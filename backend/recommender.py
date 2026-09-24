"""Rule based dispatcher recommendations derived from the validation report.

This module is intentionally *not* an LLM: the prototype's recommendations are
deterministic, auditable rules that translate every validation finding into a
concrete dispatcher action ("hold train X at station Y until Z").  That keeps the
advice explainable during a safety review.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Sequence

from simulator import (
    BLOCK_BY_ID,
    MIN_DWELL_MIN,
    MIN_HEADWAY_MIN,
    STATION_BY_ID,
    TRAIN_BY_ID,
    format_minute,
)

#: Exact wording used when the active plan passes every safety rule.
CLEAN_SUMMARY = "No action needed - plan is conflict-free."

ACTIVE_SCHEDULE_LABEL = {
    "baseline": "Booked timetable",
    "legacy_cascade": "Legacy cascade",
    "optimized": "CP-SAT re-plan",
    "rule_based": "Rule engine plan",
}


def train_label(train_id: str) -> str:
    train = TRAIN_BY_ID[train_id]
    return f"{train_id} ({train['name']})"


def station_label(station_id: Optional[str]) -> str:
    if not station_id:
        return "the nearest station"
    station = STATION_BY_ID.get(station_id)
    return station["name"] if station else station_id


def _entry_of(schedule: Dict[str, Any], train_id: str, block_id: str) -> int:
    return schedule["trains"][train_id]["blocks"][block_id]["entry"]


def _release_time(schedule, train_id, block_id, hold_minutes) -> str:
    return format_minute(_entry_of(schedule, train_id, block_id) + int(hold_minutes))

def conflict_to_action(
    conflict: Dict[str, Any], schedule: Dict[str, Any]
) -> Dict[str, Any]:
    """Translate one validation finding into a concrete dispatcher action."""
    conflict_type = conflict["type"]
    trains = conflict.get("trains", [])
    hold_station = conflict.get("hold_station")
    hold_minutes = int(conflict.get("required_hold_min") or 0)
    block_id = conflict.get("block_id")
    block_label = BLOCK_BY_ID[block_id]["name"] if block_id else "the corridor"
    item: Dict[str, Any] = {
        "severity": conflict["severity"],
        "conflict_id": conflict["id"],
        "trains": trains,
        "block_id": block_id,
        "station_id": hold_station,
        "evidence": conflict["message"],
    }

    if conflict_type in ("block_overlap", "headway_violation"):
        first_id, later_id = trains[0], trains[1]
        item["title"] = f"Restore headway in {block_label}"
        item["action"] = (
            f"Hold {later_id} at {station_label(hold_station)} until "
            f"{_release_time(schedule, later_id, block_id, hold_minutes)} - "
            f"{MIN_HEADWAY_MIN} min behind {first_id}."
        )
        item["auto_fix"] = {
            "train_id": later_id,
            "block_id": block_id,
            "minutes": hold_minutes,
        }
    elif conflict_type == "sequence_violation":
        item["title"] = f"Reinstate the booked order in {block_label}"
        item["action"] = (
            f"Keep {' > '.join(trains)}: hold {trains[-1]} at {station_label(hold_station)}."
        )
    elif conflict_type == "possession_violation":
        train_id = trains[0]
        window = conflict.get("window") or []
        item["title"] = f"Keep {block_label} clear for the possession window"
        if len(window) == 2:
            item["action"] = (
                f"Hold {train_id} at {station_label(hold_station)} until "
                f"{format_minute(window[1])} - {block_label} closed "
                f"{format_minute(window[0])}-{format_minute(window[1])}."
            )
            item["auto_fix"] = {
                "train_id": train_id,
                "block_id": block_id,
                "minutes": max(0, window[1] - _entry_of(schedule, train_id, block_id)),
            }
        else:
            item["action"] = f"Hold {train_id} clear of {block_label}."
    elif conflict_type == "platform_overload":
        later_id = trains[-1]
        item["title"] = f"Free a platform at {station_label(hold_station)}"
        item["action"] = (
            f"Hold {later_id} at {station_label(hold_station)} until a platform "
            f"frees ({'/'.join(trains)} overlap)."
        )
    else:
        item["title"] = "Manual review required"
        item["action"] = conflict["message"]

    return item

def build_recommendation(
    active_name: str,
    validation: Dict[str, Any],
    schedule: Dict[str, Any],
    kpis: Dict[str, Any],
    disruptions: Sequence[Dict[str, Any]] = (),
    solver_info: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Human readable dispatcher guidance for the currently active plan."""
    items: List[Dict[str, Any]] = []

    for disruption in disruptions:
        items.append(
            {
                "severity": "info",
                "title": f"Active: {disruption['label']}",
                "action": disruption.get("detail", ""),
                "trains": [disruption["train_id"]] if disruption.get("train_id") else [],
                "block_id": disruption.get("block_id"),
                "station_id": None,
            }
        )

    for conflict in validation["conflicts"]:
        items.append(conflict_to_action(conflict, schedule))

    delayed = list(kpis.get("delayed_train_ids") or [])
    if delayed and validation["valid"]:
        items.append(
            {
                "severity": "info",
                "title": "Delay absorption plan",
                "action": (
                    f"{', '.join(delayed)} late - {kpis['total_delay_min']} min total, "
                    f"worst {kpis['max_delay_min']} min. Dwells may compress to "
                    f"{MIN_DWELL_MIN} min."
                ),
                "trains": delayed,
                "block_id": None,
                "station_id": None,
            }
        )

    recovered = kpis.get("recovered_vs_rule_based_min")
    if validation["valid"] and recovered:
        items.append(
            {
                "severity": "info",
                "title": "Optimizer benefit",
                "action": (
                    f"CP-SAT recovers {recovered} min vs the rule engine; all rules pass."
                ),
                "trains": [],
                "block_id": None,
                "station_id": None,
            }
        )

    if solver_info and solver_info.get("wall_time_ms") is not None:
        quality = "provably optimal" if solver_info.get("optimal") else "feasible"
        items.append(
            {
                "severity": "info",
                "title": "Solver evidence",
                "action": (
                    f"{solver_info['engine']}: {quality} in "
                    f"{solver_info['wall_time_ms']} ms ({solver_info['variables']} vars, "
                    f"{solver_info['constraints']} constraints)."
                ),
                "trains": [],
                "block_id": None,
                "station_id": None,
            }
        )

    if validation["valid"]:
        return {
            "status": "valid",
            "headline": (
                f"{ACTIVE_SCHEDULE_LABEL.get(active_name, active_name)}: "
                f"{kpis['trains_scheduled']} trains, 0 conflicts."
            ),
            "summary": CLEAN_SUMMARY,
            "items": items,
        }

    return {
        "status": "conflict",
        "headline": (
            f"{ACTIVE_SCHEDULE_LABEL.get(active_name, active_name)}: "
            f"{validation['critical_conflicts']} critical conflict(s)."
        ),
        "summary": f"{validation['critical_conflicts']} conflict(s) need dispatcher action.",
        "items": items,
    }
