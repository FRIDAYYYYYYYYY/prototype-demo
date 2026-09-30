"""Inference and advisory predictor for train ETA.

Loads trained GradientBoostingRegressor and metadata once at startup.
Exposes predict_eta(distance_m, speed_mps, **optional) returning:
    (eta_seconds, physics_eta_seconds, method)
where method is 'ml-real', 'ml-synthetic', or 'physics'.

Fail-safe behaviors:
- Falls back to physics if model/meta files are missing.
- Falls back to physics if mae_model >= mae_baseline (honest validation check).
- Guards against speed_mps <= 0 (divide-by-zero protection).
"""

from __future__ import annotations

import json
import logging
import os
import sys
from typing import Any, Dict, Optional, Tuple

import joblib
import numpy as np

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

logger = logging.getLogger("train_traffic.ml.eta_predictor")

DEFAULT_MODEL_PATH = os.path.join(current_dir, "eta_model.joblib")
DEFAULT_META_PATH = os.path.join(current_dir, "eta_model_meta.json")

_MODEL: Optional[Any] = None
_META: Optional[Dict[str, Any]] = None
_LOAD_ATTEMPTED: bool = False


def load_model(
    model_path: Optional[str] = None,
    meta_path: Optional[str] = None,
    reload: bool = False,
) -> Tuple[Optional[Any], Optional[Dict[str, Any]]]:
    """Load model artifact and metadata into memory."""
    global _MODEL, _META, _LOAD_ATTEMPTED

    if _LOAD_ATTEMPTED and not reload:
        return _MODEL, _META

    model_path = model_path or DEFAULT_MODEL_PATH
    meta_path = meta_path or DEFAULT_META_PATH

    _LOAD_ATTEMPTED = True

    if not os.path.exists(model_path) or not os.path.exists(meta_path):
        logger.warning(
            f"ETA Model or Meta file not found at {model_path} / {meta_path}. "
            f"Predictor will use pure physics fallback."
        )
        _MODEL = None
        _META = None
        return None, None

    try:
        loaded_model = joblib.load(model_path)
        with open(meta_path, mode="r", encoding="utf-8") as f:
            loaded_meta = json.load(f)

        _MODEL = loaded_model
        _META = loaded_meta
        logger.info(
            f"Loaded ETA model: data_source={loaded_meta.get('data_source')}, "
            f"mae_model={loaded_meta.get('mae_model')}s, mae_baseline={loaded_meta.get('mae_baseline')}s"
        )
        return _MODEL, _META
    except Exception as exc:
        logger.warning(f"Failed to load ETA model artifacts: {exc}. Using physics fallback.")
        _MODEL = None
        _META = None
        return None, None


def get_model_and_meta() -> Tuple[Optional[Any], Optional[Dict[str, Any]]]:
    """Retrieve loaded model and metadata singleton."""
    global _MODEL, _META, _LOAD_ATTEMPTED
    if not _LOAD_ATTEMPTED:
        load_model()
    return _MODEL, _META


def predict_eta(
    distance_m: float,
    speed_mps: float,
    **optional: Any,
) -> Tuple[float, float, str]:
    """Predict train ETA to destination/junction.

    Args:
        distance_m: Distance to target in meters.
        speed_mps: Train approach speed in meters per second.
        **optional: Optional contextual attributes (train_type, headway_s, signal_state).

    Returns:
        Tuple of (eta_seconds, physics_eta_seconds, method)
        where method is in {"ml-real", "ml-synthetic", "physics"}.
    """
    # Guard against negative values and divide-by-zero
    if speed_mps <= 0.0 or distance_m < 0.0:
        return 0.0, 0.0, "physics"

    if distance_m == 0.0:
        return 0.0, 0.0, "physics"

    physics_eta = float(distance_m / speed_mps)

    model, meta = get_model_and_meta()

    # Fallback to physics if model or meta is missing
    if model is None or meta is None:
        return round(physics_eta, 2), round(physics_eta, 2), "physics"

    # Honest ML check: only use ML if it demonstrated lower MAE than the physics baseline
    mae_model = meta.get("mae_model")
    mae_baseline = meta.get("mae_baseline")
    if mae_model is None or mae_baseline is None or mae_model >= mae_baseline:
        return round(physics_eta, 2), round(physics_eta, 2), "physics"

    # Domain bounds check: prevent silent extrapolation outside the training domain
    dist_min = meta.get("distance_min")
    dist_max = meta.get("distance_max")
    spd_min = meta.get("speed_min")
    spd_max = meta.get("speed_max")

    if dist_min is not None and distance_m < dist_min:
        return round(physics_eta, 2), round(physics_eta, 2), "physics"
    if dist_max is not None and distance_m > dist_max:
        return round(physics_eta, 2), round(physics_eta, 2), "physics"
    if spd_min is not None and speed_mps < spd_min:
        return round(physics_eta, 2), round(physics_eta, 2), "physics"
    if spd_max is not None and speed_mps > spd_max:
        return round(physics_eta, 2), round(physics_eta, 2), "physics"

    # ML Inference
    try:
        X = np.array([[float(distance_m), float(speed_mps), float(physics_eta)]], dtype=np.float64)
        pred = model.predict(X)[0]
        eta_seconds = max(float(pred), 0.0)

        data_source = meta.get("data_source", "synthetic")
        method = "ml-real" if data_source == "real" else "ml-synthetic"

        return round(eta_seconds, 2), round(physics_eta, 2), method
    except Exception as exc:
        logger.warning(f"Error during ETA ML inference ({exc}). Falling back to physics baseline.")
        return round(physics_eta, 2), round(physics_eta, 2), "physics"


# Load model on module import
load_model()
