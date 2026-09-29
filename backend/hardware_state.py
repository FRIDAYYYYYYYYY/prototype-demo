"""Isolated physical-junction hardware state for the train traffic control prototype.

This module owns *all* mutable state produced by the ESP32 sensor layer. It is
deliberately isolated from :mod:`simulator`'s corridor state so that the tabletop
hardware demo and the corridor simulation cannot corrupt each other, and so that
the whole surface can be reset from a single test utility endpoint.

It is **not** a second control engine: it holds occupancy facts, and it *calls*
the existing :mod:`optimizer` / :mod:`validator` / :mod:`recommender` through
:mod:`junction_adapter` when a conflict is detected. No train-control logic is
duplicated here.

Contract: ``docs/hardware_contract.md``.
"""

from __future__ import annotations

import logging
import os
import threading
import time
from typing import Any, Dict, List, Optional

LOGGER = logging.getLogger("junction.hardware")

#: Default staleness threshold in seconds.  Overridable for tests / long poll
#: intervals with the ``HARDWARE_STALE_THRESHOLD_S`` environment variable.
DEFAULT_STALE_THRESHOLD_S = 10.0

#: ``event_type`` values allowed by the locked hardware contract.
EVENT_TYPES = ("sensor_triggered",)


def stale_threshold_s() -> float:
    """Configured staleness threshold (seconds)."""
    try:
        return float(os.environ.get("HARDWARE_STALE_THRESHOLD_S", DEFAULT_STALE_THRESHOLD_S))
    except (TypeError, ValueError):
        return DEFAULT_STALE_THRESHOLD_S


# ---------------------------------------------------------------------------
# Locked sensor -> (logical block, physical train, transition) lookup
# ---------------------------------------------------------------------------

SENSOR_CONTRACT: Dict[str, Dict[str, Any]] = {
    "A1": {
        "gpio": 22,
        "block_id": "A",
        "train_id": "T305",
        "event": "Train A approaching",
        "transition": "free->occupied",
        "target_state": "occupied",
        "description": "A: free -> occupied",
    },
    "A2": {
        "gpio": 19,
        "block_id": "A",
        "train_id": "T305",
        "event": "Train A cleared",
        "transition": "occupied->free",
        "target_state": "free",
        "description": "A: occupied -> free",
    },
    "B1": {
        "gpio": 21,
        "block_id": "B",
        "train_id": "T408",
        "event": "Train B approaching",
        "transition": "free->occupied",
        "target_state": "occupied",
        "description": "B: free -> occupied",
    },
    "B2": {
        "gpio": 18,
        "block_id": "B",
        "train_id": "T408",
        "event": "Train B cleared",
        "transition": "occupied->free",
        "target_state": "free",
        "description": "B: occupied -> free",
    },
}

#: The four sensors, in contract order.
SENSOR_IDS: List[str] = list(SENSOR_CONTRACT)

#: Logical blocks, in contract order.
LOGICAL_BLOCK_IDS: List[str] = ["A", "B"]

#: Physical junction train -> existing simulator train.  The PRD scenario is
#: "Train A (low-priority freight) arrives first, Train B (high-priority express)
#: a few seconds later", so:
#:
#: * ``A`` -> ``T305`` Coal Freight 305 (priority 4, weight 1) - the only freight
#:   in the existing fleet, i.e. the low-priority approach.
#: * ``B`` -> ``T101`` Rajdhani Express (priority 1, weight 3) - the highest
#:   priority train in the existing fleet, i.e. the high-priority approach.
#:
#: Nothing is renamed: the mapping is a lookup layer over existing IDs, weights
#: and priorities.  Note that ``T101`` is also booked *ahead* of ``T305``, so the
#: existing no-overtaking constraint in ``optimizer.py`` independently enforces
#: "express before freight" at the junction.  See ``docs/junction_decision.md``
#: for the measured legacy-vs-CP-SAT comparison and the honest mechanism note.
JUNCTION_TRAIN_MAP: Dict[str, str] = {"A": "T305", "B": "T101"}

#: Reverse lookup: simulator train -> physical train label.
TRAIN_TO_JUNCTION: Dict[str, str] = {v: k for k, v in JUNCTION_TRAIN_MAP.items()}

#: The existing corridor block that represents the shared junction (capacity 1).
JUNCTION_BLOCK_ID = "BL1"


def sensor_for(block_id: str, target_state: str) -> Optional[str]:
    """Sensor ID that produces ``target_state`` on ``block_id``."""
    for sensor_id, spec in SENSOR_CONTRACT.items():
        if spec["block_id"] == block_id and spec["target_state"] == target_state:
            return sensor_id


class HardwareState:
    """Thread-safe junction state: occupancy, idempotency, decision and logs.

    A single :class:`threading.RLock` guards every mutation so that simultaneous
    sensor events cannot interleave a read-modify-write and corrupt occupancy.
    """

    def __init__(self) -> None:
        self._lock = threading.RLock()
        self.reset()

    # -- lifecycle ---------------------------------------------------------
    def reset(self) -> None:
        """Clear occupancy, idempotency counters, decision and event log."""
        with self._lock:
            self.occupancy: Dict[str, str] = {block: "free" for block in LOGICAL_BLOCK_IDS}
            self.arrival_times: Dict[str, float] = {}
            self.last_accepted_seq: Dict[str, int] = {}
            self.last_event_received_at: Optional[float] = None
            self.last_event: Optional[Dict[str, Any]] = None
            self.decision: Optional[Dict[str, Any]] = None
            self.optimizer_calls: int = 0
            self.event_log: List[Dict[str, Any]] = []
            # Identity of the last hardware state that produced a decision, so a
            # repeated event cannot re-trigger the optimizer.
            self._last_conflict_key: Optional[str] = None

    # -- read helpers ------------------------------------------------------
    def is_occupied(self, block_id: str) -> bool:
        with self._lock:
            return self.occupancy.get(block_id) == "occupied"

    def occupied_blocks(self) -> List[str]:
        with self._lock:
            return [b for b in LOGICAL_BLOCK_IDS if self.occupancy.get(b) == "occupied"]

    def is_stale(self, threshold_s: Optional[float] = None) -> bool:
        """True before the first event, or after ``threshold_s`` of silence."""
        with self._lock:
            if self.last_event_received_at is None:
                return True
            limit = stale_threshold_s() if threshold_s is None else float(threshold_s)
            return (time.time() - self.last_event_received_at) > limit

    def snapshot(self, threshold_s: Optional[float] = None) -> Dict[str, Any]:
        """Serialisable state snapshot (no decision payload embedded)."""
        with self._lock:
            return {
                "occupancy": dict(self.occupancy),
                "occupied_blocks": [
                    b for b in LOGICAL_BLOCK_IDS if self.occupancy.get(b) == "occupied"
                ],
                "last_accepted_seq": dict(self.last_accepted_seq),
                "last_event": self.last_event,
                "last_event_received_at": self.last_event_received_at,
                "stale": self.is_stale(threshold_s),
                "stale_threshold_s": (
                    stale_threshold_s() if threshold_s is None else float(threshold_s)
                ),
                "decision": dict(self.decision) if self.decision else None,
                "optimizer_calls": self.optimizer_calls,
                "contract": contract_table(),
            }

    def log_event(self, entry: Dict[str, Any], limit: int = 200) -> None:
        """Append to the bounded in-memory audit trail (Phase I persists it)."""
        with self._lock:
            self.event_log.append(entry)
            if len(self.event_log) > limit:
                del self.event_log[: len(self.event_log) - limit]


#: Process-wide singleton used by the FastAPI layer.
_HARDWARE_STATE: Optional[HardwareState] = None
_STATE_LOCK = threading.Lock()


def get_hardware_state() -> HardwareState:
    global _HARDWARE_STATE
    if _HARDWARE_STATE is None:
        with _STATE_LOCK:
            if _HARDWARE_STATE is None:
                _HARDWARE_STATE = HardwareState()
    return _HARDWARE_STATE

    return None


def contract_table() -> Dict[str, Any]:
    """Serialisable snapshot of the locked contract, for the API and the UI."""
    return {
        "sensors": [
            {
                "sensor_id": sensor_id,
                "gpio": spec["gpio"],
                "block_id": spec["block_id"],
                "train_id": spec["train_id"],
                "event": spec["event"],
                "transition": spec["transition"],
                "target_state": spec["target_state"],
            }
            for sensor_id, spec in SENSOR_CONTRACT.items()
        ],
        "logical_blocks": LOGICAL_BLOCK_IDS,
        "junction_train_map": dict(JUNCTION_TRAIN_MAP),
        "junction_block_id": JUNCTION_BLOCK_ID,
        "event_types": list(EVENT_TYPES),
    }


class HardwareStateError(ValueError):
    """Raised for a well-formed request that breaks the hardware contract."""
