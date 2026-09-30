"""Export sensor logs from the database for ML ETA training.

Extracts consecutive sensor transition events from PostgreSQL/SQLite.
Computes elapsed transit time (actual_time_s) and approach speed (speed_mps)
using the device hardware timer (device_ms) and physical sensor geometry (SENSOR_SPACING_M).

If insufficient event pairs are available in the DB, generates a reference
template CSV (logs_template.csv) using SENSOR_SPACING_M and realistic sample rows.
"""

from __future__ import annotations

import argparse
import csv
import logging
import os
import sys
from typing import Any, Dict, List, Optional

# Add parent directory to path to allow importing backend database/models if run directly
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from database import get_db_session  # noqa: E402
from models import HardwareEvent  # noqa: E402

logger = logging.getLogger("train_traffic.ml.export_logs")

# ---------------------------------------------------------------------------
# PHYSICAL SENSOR GEOMETRY CONSTANT
# ---------------------------------------------------------------------------
# TODO: Measure and set the exact physical distance (meters) between consecutive
#       optical/IR sensors along each track approach (e.g., between sensor_A1
#       and sensor_A2, or sensor_B1 and sensor_B2).
#       For benchtop/scale track models: typically 0.30 m to 1.50 m.
#       For full-scale blocks: typically 500 m to 14,000 m.
SENSOR_SPACING_M: float = 0.50  # TODO: Set measured physical distance in meters


CSV_HEADERS = [
    "distance_m",
    "speed_mps",
    "actual_time_s",
    "train_type",
    "headway_s",
    "signal_state",
]


def extract_consecutive_sensor_events(events: List[HardwareEvent]) -> List[List[Any]]:
    """Compute speed_mps and actual_time_s from consecutive sensor triggers."""
    rows: List[List[Any]] = []

    # Track previous event per track approach ('A' or 'B')
    last_event_by_track: Dict[str, HardwareEvent] = {}

    for evt in events:
        block_id = (evt.block_id or "").upper()
        # Identify track corridor from block ID (A1/A2 -> Track A, B1/B2 -> Track B)
        track = "A" if block_id.startswith("A") else ("B" if block_id.startswith("B") else None)
        if not track:
            continue

        # Check for transition between consecutive sensors (e.g. A1 -> A2 or state changes)
        if track in last_event_by_track:
            prev_evt = last_event_by_track[track]

            # Use device_ms if both records have it; fall back to event_timestamp
            curr_time = evt.device_ms if evt.device_ms is not None else evt.event_timestamp
            prev_time = prev_evt.device_ms if prev_evt.device_ms is not None else prev_evt.event_timestamp

            if curr_time is not None and prev_time is not None:
                delta_ms = curr_time - prev_time

                # Valid forward time gap between 50ms (debounce) and 300 seconds
                if 50 <= delta_ms <= 300000:
                    actual_time_s = round(delta_ms / 1000.0, 3)
                    speed_mps = round(SENSOR_SPACING_M / actual_time_s, 3) if actual_time_s > 0 else 0.0

                    # Derive context
                    train_type = "Express" if track == "A" else "Passenger"
                    if evt.active_trains and isinstance(evt.active_trains, list) and len(evt.active_trains) > 0:
                        train_type = "Express" if "T101" in evt.active_trains else "Passenger"

                    signal_state = evt.signal_a if track == "A" else evt.signal_b
                    headway_s = 180.0

                    rows.append([
                        SENSOR_SPACING_M,
                        speed_mps,
                        actual_time_s,
                        train_type,
                        headway_s,
                        signal_state,
                    ])

        last_event_by_track[track] = evt

    return rows


def export_logs_from_db(output_path: Optional[str] = None) -> str:
    """Extract telemetry logs from DB or produce logs_template.csv with SENSOR_SPACING_M."""
    if output_path is None:
        output_path = os.path.join(current_dir, "logs_template.csv")

    real_rows: List[List[Any]] = []

    # Attempt to query database
    try:
        with get_db_session() as session:
            if session is not None:
                events = session.query(HardwareEvent).order_by(HardwareEvent.id.asc()).all()
                logger.info(f"DB Connection active: Found {len(events)} HardwareEvents.")
                if events:
                    real_rows = extract_consecutive_sensor_events(events)
                    logger.info(f"Derived {len(real_rows)} consecutive sensor transition pairs.")
    except Exception as exc:
        logger.warning(f"Could not extract sensor events from DB: {exc}")

    is_template = len(real_rows) < 3

    if is_template:
        # Generate 3 representative sample rows scaled to SENSOR_SPACING_M
        t1 = round(SENSOR_SPACING_M / 0.50, 3)   # 0.50 m/s
        t2 = round(SENSOR_SPACING_M / 0.35, 3)   # 0.35 m/s
        t3 = round(SENSOR_SPACING_M / 0.20, 3)   # 0.20 m/s

        rows_to_write = [
            [SENSOR_SPACING_M, 0.50, t1, "Express", 180.0, "PROCEED"],
            [SENSOR_SPACING_M, 0.35, t2, "Passenger", 240.0, "CAUTION"],
            [SENSOR_SPACING_M, 0.20, t3, "Freight", 300.0, "PROCEED"],
        ]
    else:
        rows_to_write = real_rows

    with open(output_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(CSV_HEADERS)
        for row in rows_to_write:
            writer.writerow(row)

    if is_template:
        print(
            f"[export_logs] Extracted {len(real_rows)} valid sensor pairs from DB (need >= 3). "
            f"Wrote reference template with SENSOR_SPACING_M={SENSOR_SPACING_M}m to: {output_path}"
        )
    else:
        print(f"[export_logs] Successfully exported {len(rows_to_write)} rows to: {output_path}")

    return output_path


def main():
    parser = argparse.ArgumentParser(description="Export sensor telemetry logs for ETA ML model training.")
    parser.add_argument(
        "--output",
        type=str,
        default=None,
        help="Destination CSV filepath (default: backend/ml/logs_template.csv)",
    )
    args = parser.parse_args()
    export_logs_from_db(output_path=args.output)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    main()
