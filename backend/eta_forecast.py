"""Advisory ETA Forecast Module for Junction Approach.

Uses a Gradient Boosting Regressor trained on synthetic corridor telemetry
to predict time-to-junction (seconds), accounting for train class,
approach distance, assumed speed, peak traffic windows, and upstream delays.

DATA SOURCE NOTE:
All training data in this module is SYNTHETIC and generated internally for
decision-support simulation and prototyping.

CORRIDOR DATA:
Fleet configurations (T101, T204, T305, T408) and corridor topology (BL1, BL2, BL3)
are sourced directly from backend/simulator.py.

FAIL-SAFE:
If the ML model fails to initialize or predict, the module gracefully falls
back to the physics baseline (distance / assumed speed).
"""

from __future__ import annotations

import logging
import os
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error

from simulator import BLOCKS, TRAINS

logger = logging.getLogger("train_traffic.eta_forecast")

CLASS_MAPPING = {"Express": 0, "Passenger": 1, "Freight": 2}
PEAK_HOURS = {8, 9, 10, 17, 18, 19}

# Per-class operational speed bounds capped at corridor max speed (110 km/h)
CLASS_SPEED_RANGES: Dict[str, Tuple[float, float]] = {
    "Express": (80.0, 110.0),
    "Passenger": (60.0, 90.0),
    "Freight": (35.0, 65.0),
}

# Global singleton model and evaluation cache
_MODEL: Optional[GradientBoostingRegressor] = None
_METRICS: Dict[str, Any] = {}


def generate_synthetic_dataset(
    n_samples: int = 3500, random_state: int = 42
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Generate synthetic train approach data for ETA model training.

    Features:
    0: train_class (0: Express, 1: Passenger, 2: Freight)
    1: distance_km (1.0 to 20.0 km)
    2: assumed_speed_kmh (realistic per-class speed inside training bounds)
    3: hour (6 to 22)
    4: peak_flag (1 if peak hour else 0)
    5: prior_delay_min (0.0 to 45.0 min)

    Target:
    actual_time_s: Actual time to junction in seconds including synthetic
                   deceleration, signal caution aspects, and station congestion.

    Label Noise:
    Gaussian noise with standard deviation = 6.0 seconds (rng.normal(0.0, 6.0)).
    """
    rng = np.random.RandomState(random_state)

    train_classes = rng.choice([0, 1, 2], size=n_samples, p=[0.4, 0.35, 0.25])
    distances_km = rng.uniform(1.0, 20.0, size=n_samples)

    # Base speeds dependent on train class inside realistic training ranges (capped at corridor max 110 km/h)
    base_speeds = np.where(
        train_classes == 0,
        rng.uniform(80.0, 110.0, size=n_samples),  # Express: 80-110 km/h
        np.where(
            train_classes == 1,
            rng.uniform(60.0, 90.0, size=n_samples),   # Passenger: 60-90 km/h
            rng.uniform(35.0, 65.0, size=n_samples),   # Freight: 35-65 km/h
        ),
    )
    speeds_kmh = np.clip(base_speeds + rng.normal(0, 4, size=n_samples), 25.0, 110.0)

    hours = rng.randint(6, 23, size=n_samples)
    peak_flags = np.array([1 if h in PEAK_HOURS else 0 for h in hours])
    prior_delays_min = rng.exponential(scale=5.0, size=n_samples)
    prior_delays_min = np.clip(prior_delays_min, 0.0, 45.0)

    # Physics baseline: time = (distance / speed) * 3600 seconds
    baseline_time_s = (distances_km / speeds_kmh) * 3600.0

    # Non-linear synthetic planted delay effects:
    # 1. Approach deceleration penalty (heavier for freight)
    decel_penalty_s = np.where(
        train_classes == 2,
        35.0 + (15.0 / np.maximum(distances_km, 1.0)),
        15.0 + (8.0 / np.maximum(distances_km, 1.0)),
    )

    # 2. Peak hour congestion factor (signal checks)
    congestion_s = peak_flags * rng.uniform(20.0, 60.0, size=n_samples)

    # 3. Prior delay ripple (speed restrictions on caution signals)
    delay_ripple_s = prior_delays_min * rng.uniform(1.5, 3.5, size=n_samples)

    # 4. Stochastic track variation (Label Noise std dev = 6.0 seconds)
    noise_s = rng.normal(0.0, 6.0, size=n_samples)

    actual_time_s = baseline_time_s + decel_penalty_s + congestion_s + delay_ripple_s + noise_s
    actual_time_s = np.maximum(actual_time_s, baseline_time_s * 0.9)

    X = np.column_stack(
        [train_classes, distances_km, speeds_kmh, hours, peak_flags, prior_delays_min]
    )

    return X, actual_time_s, baseline_time_s


def get_or_train_model() -> Tuple[Optional[GradientBoostingRegressor], Dict[str, Any]]:
    """Initialize and train the Gradient Boosting Regressor singleton on synthetic data."""
    global _MODEL, _METRICS
    if os.environ.get("FORCE_ETA_FAIL") == "1":
        logger.warning("FORCE_ETA_FAIL is enabled; simulating model failure.")
        return None, {"benchmark": "synthetic, planted effects", "fallback": True, "error": "Forced model failure"}

    if _MODEL is not None and _METRICS:
        return _MODEL, _METRICS

    try:
        X, y, baseline = generate_synthetic_dataset(n_samples=3500, random_state=42)
        X_train, X_test, y_train, y_test, base_train, base_test = train_test_split(
            X, y, baseline, test_size=0.2, random_state=42
        )

        model = GradientBoostingRegressor(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.1,
            loss="squared_error",
            random_state=42,
        )
        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)

        baseline_mae = float(mean_absolute_error(y_test, base_test))
        ml_mae = float(mean_absolute_error(y_test, y_pred))

        _MODEL = model
        _METRICS = {
            "benchmark": "synthetic, planted effects",
            "baseline_mae_seconds": round(baseline_mae, 2),
            "ml_mae_seconds": round(ml_mae, 2),
            "mae_improvement_pct": round(((baseline_mae - ml_mae) / baseline_mae) * 100.0, 1),
            "test_samples": len(y_test),
        }
        logger.info(
            f"ETA Forecast Model Trained: Baseline MAE={_METRICS['baseline_mae_seconds']}s, "
            f"ML MAE={_METRICS['ml_mae_seconds']}s ({_METRICS['mae_improvement_pct']}% improvement)"
        )
        return _MODEL, _METRICS
    except Exception as exc:
        logger.warning(f"Failed to train ETA model, activating baseline fallback: {exc}")
        _MODEL = None
        _METRICS = {
            "benchmark": "synthetic, planted effects",
            "baseline_mae_seconds": 0.0,
            "ml_mae_seconds": 0.0,
            "fallback": True,
        }
        return None, _METRICS


def get_eta_forecasts(state: Any = None) -> Dict[str, Any]:
    """Compute advisory ETA forecasts for all trains approaching the corridor junction.

    Pulls fleet data directly from backend/simulator.py (TRAINS and BLOCKS).
    Returns baseline ETA (distance / assumed speed) and ML forecast (gradient boosting).
    Guaranteed fail-safe: if ML fails, returns baseline ETA for all trains.
    """
    model, metrics = get_or_train_model()

    # Source corridor approach block length from simulator.BLOCKS (Block 1 length = 14.0 km)
    approach_block = BLOCKS[0]
    approach_dist_km = float(approach_block["length_km"])

    forecasts: List[Dict[str, Any]] = []

    for train in TRAINS:
        train_id = train["id"]
        train_name = train["name"]
        train_type = train["type"]

        # Derive raw speed from booked timetable run time across approach block (BL1)
        run_min = float(train["run_min"].get(approach_block["id"], 6))
        raw_timetable_speed_kmh = round(approach_dist_km / (run_min / 60.0), 1)

        # Clamp to realistic training range for train class
        min_speed, max_speed = CLASS_SPEED_RANGES.get(train_type, (60.0, 90.0))
        clamped = False
        if raw_timetable_speed_kmh < min_speed:
            assumed_speed_kmh = round(min_speed, 1)
            clamped = True
        elif raw_timetable_speed_kmh > max_speed:
            assumed_speed_kmh = round(max_speed, 1)
            clamped = True
        else:
            assumed_speed_kmh = round(raw_timetable_speed_kmh, 1)

        hour = 10  # 10:00 AM simulation start horizon
        peak_flag = 1 if hour in PEAK_HOURS else 0

        # Extract prior delay from simulator state if available
        prior_delay = 0.0
        if state is not None:
            try:
                active_sched = state.active_schedule()
                if active_sched and "trains" in active_sched and train_id in active_sched["trains"]:
                    prior_delay = float(active_sched["trains"][train_id].get("final_delay", 0.0))
            except Exception:
                prior_delay = 0.0

        # Physics baseline (seconds)
        baseline_eta_s = round((approach_dist_km / max(assumed_speed_kmh, 1.0)) * 3600.0, 1)

        # ML Forecast with fail-safe fallback
        ml_eta_s = baseline_eta_s
        if model is not None:
            try:
                class_code = CLASS_MAPPING.get(train_type, 1)
                feat = np.array([[class_code, approach_dist_km, assumed_speed_kmh, hour, peak_flag, prior_delay]])
                pred = model.predict(feat)[0]
                ml_eta_s = round(float(pred), 1)
            except Exception as e:
                logger.warning(f"Prediction failed for {train_id}, using baseline: {e}")
                ml_eta_s = baseline_eta_s

        variance_s = round(ml_eta_s - baseline_eta_s, 1)

        forecasts.append({
            "train_id": train_id,
            "name": train_name,
            "type": train_type,
            "distance_to_junction_km": approach_dist_km,
            "raw_timetable_speed_kmh": raw_timetable_speed_kmh,
            "assumed_speed_kmh": assumed_speed_kmh,
            "clamped": clamped,
            "prior_delay_min": prior_delay,
            "baseline_eta_s": baseline_eta_s,
            "ml_eta_s": ml_eta_s,
            "variance_vs_baseline_s": variance_s,
            "advisory": True,
        })

    return {
        "mode": "static_timetable",
        "advisory": True,
        "disclaimer": "Advisory ETA forecast for decision support only - not an autonomous movement authority",
        "data_source": "synthetic",
        "evaluation_metrics": metrics,
        "forecasts": forecasts,
    }
