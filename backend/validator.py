"""Rule based safety validation for a candidate timetable.

The validator is deliberately independent from the optimizer: it re-derives the
physical invariants from the raw timetable the way a signalling interlocking
would, and it is also used to prove that the optimizer output is safe.  Every
finding is phrased in dispatcher language so the recommendation panel can turn
it into an action.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Sequence

from simulator import (
    BLOCK_BY_ID,
    BOOKED_ORDER,
    MIN_HEADWAY_MIN,
    ROUTE_BLOCK_IDS,
    STATIONS,
    format_minute,
)

CHECK_DEFINITIONS: List[Dict[str, str]] = [
    {
        "id": "block_exclusion",
        "name": "Exclusive block occupation",
        "description": "One train per block at a time.",
    },
    {
        "id": "headway",
        "name": f"Minimum headway ({MIN_HEADWAY_MIN} min)",
                "description": f"Next train enters {MIN_HEADWAY_MIN} min after the previous clears.",
    },
    {
        "id": "sequence",
        "name": "Booked running order preserved",
        "description": "Booked running order kept (no overtaking).",
    },
    {
        "id": "possession",
        "name": "Possession / closure windows respected",
        "description": "No occupation during a possession window.",
    },
    {
        "id": "platforms",
        "name": "Station platform capacity",
        "description": "Simultaneous calls must fit the platforms.",
    },
]


def hold_station_for(block_id: str) -> str:
    """Station where a train can wait for ``block_id`` to clear."""
    return BLOCK_BY_ID[block_id]["from"]


def _downstream_block(station_id: str) -> Optional[str]:
    for block_id in ROUTE_BLOCK_IDS:
        if BLOCK_BY_ID[block_id]["from"] == station_id:
            return block_id
    return None


def _occupancy(train_id: str, block_id: str, schedule: Dict[str, Any]) -> Dict[str, int]:
    block = schedule["trains"][train_id]["blocks"][block_id]
    return {"entry": block["entry"], "exit": block["exit"]}


def _conflict(
    index: int,
    conflict_type: str,
    check_id: str,
    severity: str,
    message: str,
    **extra: Any,
) -> Dict[str, Any]:
    payload = {
        "id": f"CF-{index}",
        "type": conflict_type,
        "check": check_id,
        "severity": severity,
        "message": message,
    }
    payload.update(extra)
    return payload

def validate_schedule(
    schedule: Dict[str, Any],
    disruptions: Sequence[Dict[str, Any]] = (),
    reference: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Check a timetable against every physical invariant.

    ``reference`` is the booked timetable that defines the running order.
    """
    reference = reference or schedule
    conflicts: List[Dict[str, Any]] = []
    violation_counts: Dict[str, int] = {check["id"]: 0 for check in CHECK_DEFINITIONS}

    # -- block exclusion, headway and booked running order ------------------
    for block_id in ROUTE_BLOCK_IDS:
        block_name = BLOCK_BY_ID[block_id]["name"]
        ordered = sorted(
            BOOKED_ORDER,
            key=lambda train_id: (
                schedule["trains"][train_id]["blocks"][block_id]["entry"],
                BOOKED_ORDER.index(train_id),
            ),
        )

        for first_index, first_id in enumerate(ordered):
            for second_id in ordered[first_index + 1:]:
                first = _occupancy(first_id, block_id, schedule)
                second = _occupancy(second_id, block_id, schedule)
                if second["entry"] < first["exit"]:
                    overlap = first["exit"] - second["entry"]
                    violation_counts["block_exclusion"] += 1
                    conflicts.append(
                        _conflict(
                            len(conflicts) + 1,
                            "block_overlap",
                            "block_exclusion",
                            "critical",
                            (
                                f"{second_id} enters {block_name} {format_minute(second['entry'])} "
                                f"while {first_id} is inside until "
                                f"{format_minute(first['exit'])} ({overlap} min overlap)."
                            ),
                            block_id=block_id,
                            block_name=block_name,
                            trains=[first_id, second_id],
                            overlap_min=overlap,
                            required_hold_min=overlap + MIN_HEADWAY_MIN,
                            hold_station=hold_station_for(block_id),
                        )
                    )
                else:
                    gap = second["entry"] - first["exit"]
                    if gap < MIN_HEADWAY_MIN:
                        violation_counts["headway"] += 1
                        conflicts.append(
                            _conflict(
                                len(conflicts) + 1,
                                "headway_violation",
                                "headway",
                                "critical",
                                (
                                    f"{first_id}-{second_id} gap {gap} min in {block_name} "
                                    f"({MIN_HEADWAY_MIN} min required)."
                                ),
                                block_id=block_id,
                                block_name=block_name,
                                trains=[first_id, second_id],
                                gap_min=gap,
                                required_hold_min=MIN_HEADWAY_MIN - gap,
                                hold_station=hold_station_for(block_id),
                            )
                        )

        booked_sequence = sorted(
            BOOKED_ORDER,
            key=lambda train_id: reference["trains"][train_id]["blocks"][block_id]["entry"],
        )
        if ordered != booked_sequence:
            violation_counts["sequence"] += 1
            conflicts.append(
                _conflict(
                    len(conflicts) + 1,
                    "sequence_violation",
                    "sequence",
                    "critical",
                    (
                        f"Order in {block_name}: {' > '.join(ordered)}, "
                        f"booked {' > '.join(booked_sequence)}."
                    ),
                    block_id=block_id,
                    block_name=block_name,
                    trains=ordered,
                    hold_station=hold_station_for(block_id),
                )
            )

    # -- possession / closure windows ----------------------------------------
    for disruption in disruptions:
        if disruption.get("type") != "block_closure":
            continue
        block_id = disruption["block_id"]
        start, end = disruption["start"], disruption["end"]
        for train_id in BOOKED_ORDER:
            occupancy = _occupancy(train_id, block_id, schedule)
            if occupancy["entry"] < end and occupancy["exit"] > start:
                violation_counts["possession"] += 1
                conflicts.append(
                    _conflict(
                        len(conflicts) + 1,
                        "possession_violation",
                        "possession",
                        "critical",
                        (
                            f"{train_id} in {block_id} {format_minute(occupancy['entry'])}-"
                            f"{format_minute(occupancy['exit'])} during possession "
                            f"{format_minute(start)}-{format_minute(end)}."
                        ),
                        block_id=block_id,
                        block_name=BLOCK_BY_ID[block_id]["name"],
                        trains=[train_id],
                        hold_station=hold_station_for(block_id),
                        required_hold_min=max(0, end - occupancy["entry"]),
                        window=[start, end],
                    )
                )

    # -- station platform capacity -------------------------------------------
    for station in STATIONS:
        station_id = station["id"]
        intervals: List[Dict[str, Any]] = []
        for train_id in BOOKED_ORDER:
            stop = schedule["trains"][train_id]["stations"][station_id]
            arrive = stop["arrive"]
            intervals.append(
                {
                    "train_id": train_id,
                    "start": arrive,
                    "end": max(stop["depart"], arrive + 1),
                }
            )

        # Sweep the minute by minute concurrency and keep the worst moment.
        peak, peak_minute, peak_trains = 0, None, []
        for minute in sorted({item["start"] for item in intervals}):
            present = [
                item["train_id"]
                for item in intervals
                if item["start"] <= minute < item["end"]
            ]
            if len(present) > peak:
                peak, peak_minute, peak_trains = len(present), minute, present

        if peak > station["platforms"]:
            violation_counts["platforms"] += 1
            conflicts.append(
                _conflict(
                    len(conflicts) + 1,
                    "platform_overload",
                    "platforms",
                    "warning",
                    (
                        f"{station['name']} needs {peak} platforms at "
                        f"{format_minute(peak_minute)}, has {station['platforms']} "
                        f"({', '.join(peak_trains)})."
                    ),
                    station_id=station_id,
                    trains=peak_trains,
                    hold_station=station_id,
                    hold_block=_downstream_block(station_id),
                )
            )

    critical = sum(1 for conflict in conflicts if conflict["severity"] == "critical")
    checks = [
        {
            "id": check["id"],
            "name": check["name"],
            "description": check["description"],
            "violations": violation_counts[check["id"]],
            "status": "fail" if violation_counts[check["id"]] else "pass",
        }
        for check in CHECK_DEFINITIONS
    ]

    return {
        "valid": critical == 0,
        "schedule_source": schedule.get("source", "unknown"),
        "critical_conflicts": critical,
        "warnings": len(conflicts) - critical,
        "conflicts": conflicts,
        "checks": checks,
    }


def summarise(validation: Dict[str, Any]) -> str:
    """One line summary used in the API payload and the UI badge."""
    if validation["valid"]:
        return "Valid - no violations."
    return (
        f"Conflict - {validation['critical_conflicts']} critical, "
        f"{validation['warnings']} warning(s)."
    )
