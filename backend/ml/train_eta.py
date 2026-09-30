"""Train the ML ETA prediction model.

Trains a GradientBoostingRegressor to predict transit time (actual_time_s)
given approach distance (distance_m) and speed (speed_mps).

Evaluates model performance against the pure physics baseline (distance / speed).
Saves eta_model.joblib and eta_model_meta.json.
"""

from __future__ import annotations

import argparse
import csv
import json
import logging
import os
import sys
from typing import Any, Dict, List, Optional, Tuple

import joblib
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import KFold, train_test_split

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

logger = logging.getLogger("train_traffic.ml.train_eta")

DEFAULT_MODEL_PATH = os.path.join(current_dir, "eta_model.joblib")
DEFAULT_META_PATH = os.path.join(current_dir, "eta_model_meta.json")

# Training domain bounds
DISTANCE_MIN_M = 500.0
DISTANCE_MAX_M = 25000.0
SPEED_MIN_MPS = 10.0
SPEED_MAX_MPS = 45.0


def generate_synthetic_data(
    n_samples: int = 5000, random_state: int = 42
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, List[str]]:
    """Generate 5,000 rows of synthetic train telemetry covering corridor scale.

    Distance: 500 m to 25,000 m
    Speed: 10 m/s to 45 m/s (~36 km/h to 162 km/h)
    Physics baseline: physics_eta = distance_m / speed_mps
    Braking penalty applies below 2,000 m.
    Noise: small proportional Gaussian term (std = 0.05).
    """
    rng = np.random.RandomState(random_state)

    # Distances spanning junction approach up to full corridor scale (500m to 25,000m)
    # Stratify slightly to ensure solid representation across both approach and block scales
    dist_approach = rng.uniform(DISTANCE_MIN_M, 3000.0, size=int(n_samples * 0.3))
    dist_corridor = rng.uniform(3000.0, DISTANCE_MAX_M, size=n_samples - int(n_samples * 0.3))
    distance_m = np.concatenate([dist_approach, dist_corridor])
    rng.shuffle(distance_m)

    # Speed range in m/s (10.0 m/s to 45.0 m/s)
    speed_mps = rng.uniform(SPEED_MIN_MPS, SPEED_MAX_MPS, size=n_samples)

    # Physics-based ETA
    physics_eta = distance_m / speed_mps

    # Proportional noise (std dev = 5%)
    noise = rng.normal(0.0, 0.05, size=n_samples)

    # Deceleration / braking penalty that grows as train approaches within 2,000 m
    braking_penalty = np.where(
        distance_m < 2000.0,
        ((2000.0 - distance_m) * 0.02) + rng.uniform(2.0, 8.0, size=n_samples),
        0.0,
    )

    actual_time_s = (physics_eta * (1.0 + noise)) + braking_penalty
    actual_time_s = np.maximum(actual_time_s, 1.0)

    feature_names = ["distance_m", "speed_mps", "physics_eta"]
    X = np.column_stack([distance_m, speed_mps, physics_eta])

    return X, actual_time_s, physics_eta, feature_names


def load_real_data(
    csv_path: str,
) -> Optional[Tuple[np.ndarray, np.ndarray, np.ndarray, List[str]]]:
    """Load and validate real sensor events from CSV if file exists and has >= 30 rows."""
    if not os.path.exists(csv_path):
        logger.warning(f"Data file {csv_path} not found.")
        return None

    rows = []
    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            try:
                dist = float(r["distance_m"])
                spd = float(r["speed_mps"])
                act = float(r["actual_time_s"])
                if dist > 0 and spd > 0 and act > 0:
                    rows.append((dist, spd, act))
            except (ValueError, KeyError):
                continue

    if len(rows) < 30:
        logger.info(f"Dataset {csv_path} contains {len(rows)} valid rows (need >= 30 for real training).")
        return None

    distance_m = np.array([r[0] for r in rows], dtype=np.float64)
    speed_mps = np.array([r[1] for r in rows], dtype=np.float64)
    actual_time_s = np.array([r[2] for r in rows], dtype=np.float64)
    physics_eta = distance_m / speed_mps

    feature_names = ["distance_m", "speed_mps", "physics_eta"]
    X = np.column_stack([distance_m, speed_mps, physics_eta])

    return X, actual_time_s, physics_eta, feature_names


def train_and_evaluate(
    data_path: Optional[str] = None,
    model_out: str = DEFAULT_MODEL_PATH,
    meta_out: str = DEFAULT_META_PATH,
) -> Dict[str, Any]:
    """Train GradientBoostingRegressor and evaluate against physics-only baseline."""
    real_dataset = load_real_data(data_path) if data_path else None

    if real_dataset is not None:
        data_source = "real"
        X, y, baseline, feature_names = real_dataset
        n_rows = len(y)
        dist_min = float(np.min(X[:, 0]))
        dist_max = float(np.max(X[:, 0]))
        spd_min = float(np.min(X[:, 1]))
        spd_max = float(np.max(X[:, 1]))
        logger.info(f"Training on REAL dataset: {n_rows} rows from {data_path}")

        # 5-fold cross-validation for real data
        kf = KFold(n_splits=5, shuffle=True, random_state=42)
        model_maes = []
        model_r2s = []
        base_maes = []
        base_r2s = []

        for train_idx, test_idx in kf.split(X):
            X_tr, X_val = X[train_idx], X[test_idx]
            y_tr, y_val = y[train_idx], y[test_idx]
            base_val = baseline[test_idx]

            fold_model = GradientBoostingRegressor(
                n_estimators=100, max_depth=3, random_state=42
            )
            fold_model.fit(X_tr, y_tr)
            y_pred = fold_model.predict(X_val)

            model_maes.append(mean_absolute_error(y_val, y_pred))
            model_r2s.append(r2_score(y_val, y_pred))
            base_maes.append(mean_absolute_error(y_val, base_val))
            base_r2s.append(r2_score(y_val, base_val))

        mae_model = float(np.mean(model_maes))
        r2_model = float(np.mean(model_r2s))
        mae_baseline = float(np.mean(base_maes))
        r2_baseline = float(np.mean(base_r2s))

        final_model = GradientBoostingRegressor(
            n_estimators=100, max_depth=3, random_state=42
        )
        final_model.fit(X, y)

    else:
        data_source = "synthetic"
        X, y, baseline, feature_names = generate_synthetic_data(n_samples=5000, random_state=42)
        n_rows = len(y)
        dist_min = DISTANCE_MIN_M
        dist_max = DISTANCE_MAX_M
        spd_min = SPEED_MIN_MPS
        spd_max = SPEED_MAX_MPS
        logger.info(f"Training on SYNTHETIC dataset: {n_rows} samples (dist: {dist_min}-{dist_max}m, speed: {spd_min}-{spd_max}m/s)")

        # 80/20 train/test split for synthetic data
        X_train, X_test, y_train, y_test, base_train, base_test = train_test_split(
            X, y, baseline, test_size=0.2, random_state=42
        )

        model = GradientBoostingRegressor(
            n_estimators=100, max_depth=3, random_state=42
        )
        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)
        mae_model = float(mean_absolute_error(y_test, y_pred))
        r2_model = float(r2_score(y_test, y_pred))
        mae_baseline = float(mean_absolute_error(y_test, base_test))
        r2_baseline = float(r2_score(y_test, base_test))

        final_model = model

    # Print summary evaluation comparison
    print("=" * 60)
    print(f"ETA Model Training & Evaluation Summary [{data_source.upper()}]")
    print("=" * 60)
    print(f"Data source    : {data_source}")
    print(f"Sample count   : {n_rows}")
    print(f"Distance range : {dist_min:.1f} m to {dist_max:.1f} m")
    print(f"Speed range    : {spd_min:.1f} m/s to {spd_max:.1f} m/s")
    print(f"Features       : {feature_names}")
    print("-" * 60)
    print(f"Physics Baseline MAE : {mae_baseline:.3f} s  | R2 : {r2_baseline:.4f}")
    print(f"ML Model         MAE : {mae_model:.3f} s  | R2 : {r2_model:.4f}")
    improvement = ((mae_baseline - mae_model) / mae_baseline) * 100.0 if mae_baseline > 0 else 0.0
    print(f"MAE Improvement      : {improvement:.2f}%")
    print("=" * 60)

    # Save model binary and metadata
    os.makedirs(os.path.dirname(model_out), exist_ok=True)
    joblib.dump(final_model, model_out)

    meta = {
        "data_source": data_source,
        "n_rows": n_rows,
        "distance_min": round(dist_min, 1),
        "distance_max": round(dist_max, 1),
        "speed_min": round(spd_min, 1),
        "speed_max": round(spd_max, 1),
        "mae_model": round(mae_model, 3),
        "mae_baseline": round(mae_baseline, 3),
        "r2_model": round(r2_model, 4),
        "r2_baseline": round(r2_baseline, 4),
        "features": feature_names,
    }

    os.makedirs(os.path.dirname(meta_out), exist_ok=True)
    with open(meta_out, mode="w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    print(f"Saved model to : {model_out}")
    print(f"Saved meta to  : {meta_out}")

    return meta


def main():
    parser = argparse.ArgumentParser(description="Train GradientBoostingRegressor for train ETA prediction.")
    parser.add_argument("--data", type=str, default=None, help="Path to sensor CSV data (optional).")
    parser.add_argument("--model-out", type=str, default=DEFAULT_MODEL_PATH, help="Path to save model .joblib")
    parser.add_argument("--meta-out", type=str, default=DEFAULT_META_PATH, help="Path to save metadata .json")
    args = parser.parse_args()

    train_and_evaluate(
        data_path=args.data,
        model_out=args.model_out,
        meta_out=args.meta_out,
    )


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    main()
