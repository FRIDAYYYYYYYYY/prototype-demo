"""Demo Mode replay (PRD section 3.6 / Phase 5.5).

Replays a recorded hardware sequence through the **real** ``POST /sensor-event``
pipeline.  Nothing is mocked: Pydantic validation, idempotency, conflict
detection, CP-SAT, the independent validator and the recommender all run exactly
as they do with a physical ESP32.  Only the transport is replaced (an HTTP client
instead of WiFi), which is what makes this usable as a fallback when the hardware
or the network fails on stage.

Usage::

    python scripts/replay_demo.py                       # default scenario
    python scripts/replay_demo.py --scenario b_first    # symmetric conflict
    python scripts/replay_demo.py --list
    python scripts/replay_demo.py --base-url http://127.0.0.1:8000
"""

from __future__ import annotations

import argparse
import json
import os
import time
import urllib.error
import urllib.request
from typing import Any, Dict

DEFAULT_BASE_URL = os.environ.get("BACKEND_URL", "http://127.0.0.1:8000")
EPOCH_BASE_MS = 1732500000000

#: Event timestamps are relative offsets from the first event of the run, so a
#: replay is deterministic and independent of the wall clock.
SCENARIOS: Dict[str, Dict[str, Any]] = {
    "conflict": {
        "name": "PRD 3.5 - freight arrives first, express 2 min later",
        "description": (
            "Train A (low-priority freight T305) approaches, then Train B "
            "(high-priority express T101). Legacy releases A; CP-SAT holds A."
        ),
        "events": [
            {"block_id": "A1", "state": "occupied", "offset_ms": 0, "source": "sensor_A1", "seq": 1},
            {"block_id": "B1", "state": "occupied", "offset_ms": 2_000, "source": "sensor_B1", "seq": 1},
            {"block_id": "A2", "state": "free", "offset_ms": 6_000, "source": "sensor_A2", "seq": 1},
            {"block_id": "B2", "state": "free", "offset_ms": 9_000, "source": "sensor_B2", "seq": 1},
        ],
    },
    "b_first": {
        "name": "Symmetric - express arrives first, freight 2 min later",
        "description": "The mirror conflict; legacy and CP-SAT agree here.",
        "events": [
            {"block_id": "B1", "state": "occupied", "offset_ms": 0, "source": "sensor_B1", "seq": 1},
            {"block_id": "A1", "state": "occupied", "offset_ms": 2_000, "source": "sensor_A1", "seq": 1},
            {"block_id": "B2", "state": "free", "offset_ms": 6_000, "source": "sensor_B2", "seq": 1},
            {"block_id": "A2", "state": "free", "offset_ms": 9_000, "source": "sensor_A2", "seq": 1},
        ],
    },
    "single": {
        "name": "Single train - no conflict, optimizer must not run",
        "description": "A1 then A2 only. Proves no optimisation is triggered.",
        "events": [
            {"block_id": "A1", "state": "occupied", "offset_ms": 0, "source": "sensor_A1", "seq": 1},
            {"block_id": "A2", "state": "free", "offset_ms": 3_000, "source": "sensor_A2", "seq": 1},
        ],
    },
    "duplicates": {
        "name": "Duplicate storm - retransmissions and redundant events",
        "description": "Mirrors the firmware debounce / Phase E sequence 5.",
        "events": [
            {"block_id": "A1", "state": "occupied", "offset_ms": 0, "source": "sensor_A1", "seq": 1},
            {"block_id": "A1", "state": "occupied", "offset_ms": 500, "source": "sensor_A1", "seq": 1},
            {"block_id": "A1", "state": "occupied", "offset_ms": 1_000, "source": "sensor_A1", "seq": 2},
            {"block_id": "A2", "state": "free", "offset_ms": 2_000, "source": "sensor_A2", "seq": 1},
            {"block_id": "A2", "state": "free", "offset_ms": 2_500, "source": "sensor_A2", "seq": 2},
        ],
    },
}


def _post(url: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url, data=data, headers={"Content-Type": "application/json"}, method="POST"
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        return {
            "status": "http_error",
            "code": error.code,
            "body": error.read().decode("utf-8", "replace"),
        }
    except urllib.error.URLError as error:
        raise SystemExit(
            f"Cannot reach the backend at {url}: {error.reason}\n"
            "Start it first:  python backend/main.py"
        )


def _get(url: str) -> Dict[str, Any]:
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.URLError as error:
        raise SystemExit(f"Cannot reach the backend at {url}: {error.reason}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Replay demo hardware events.")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--scenario", default="conflict", choices=sorted(SCENARIOS))
    parser.add_argument("--speed", type=float, default=1.0, help="inter-event delay scale")
    parser.add_argument("--no-reset", action="store_true", help="do not reset first")
    parser.add_argument("--list", action="store_true", help="list scenarios and exit")
    args = parser.parse_args()

    if args.list:
        for key, scenario in SCENARIOS.items():
            print(f"{key:12s} {scenario['name']}")
        return 0

    scenario = SCENARIOS[args.scenario]
    base = args.base_url.rstrip("/")

    print("=" * 78)
    print(" DEMO MODE REPLAY - events go through the real /sensor-event pipeline")
    print(" Decision-support / simulation prototype. Not autonomous train control.")
    print("=" * 78)
    print(f" scenario : {args.scenario} - {scenario['name']}")
    print(f" detail   : {scenario['description']}")
    print(f" backend  : {base}\n")

    _get(f"{base}/health")   # fail fast and loudly if the backend is not up

    if not args.no_reset:
        _post(f"{base}/sensor-event/reset", {})
        print("[replay] hardware state reset\n")

    started = time.time()
    for event in scenario["events"]:
        due = started + (event["offset_ms"] / 1000.0) / max(args.speed, 0.01)
        wait = due - time.time()
        if wait > 0:
            time.sleep(wait)

        payload = {
            "block_id": event["block_id"],
            "state": event["state"],
            "event_type": "sensor_triggered",
            "timestamp": EPOCH_BASE_MS + event["offset_ms"],
            "source": event["source"],
            "seq": event["seq"],
        }
        result = _post(f"{base}/sensor-event", payload)
        state = _get(f"{base}/block-state")
        aspects = " ".join(f"{b['block_id']}={b['signal']}" for b in state["blocks"])
        decision = result.get("decision") or {}
        print(
            f"[{time.time() - started:5.1f}s] {event['block_id']} seq={event['seq']} "
            f"-> {str(result.get('status')):<9s} aspects: {aspects:<26s}"
            + (f"[{decision.get('decision_source')}]" if decision else "")
            + (f"  {result.get('reason')}" if result.get("reason") else "")
        )

    print("\n--- final /block-state -----------------------------------------")
    print(json.dumps(_get(f"{base}/block-state"), indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

