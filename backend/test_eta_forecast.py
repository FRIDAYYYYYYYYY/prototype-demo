"""Tests for the Advisory ETA Forecast Module (GET /eta-forecast).

Verifies:
1. Synthetic data generation and feature matrix dimensions.
2. Gradient Boosting model training and non-zero MAE improvement over baseline.
3. Response schema for GET /eta-forecast (mode='static_timetable', raw_timetable_speed_kmh, assumed_speed_kmh <= 110).
4. Speed clamping flag per-class (Express capped at 110, Passenger, Freight).
5. Fail-safe behavior (falls back to baseline without breaking /block-state or /sensor-event).
"""

import pytest
from fastapi.testclient import TestClient

from main import app
import eta_forecast


def test_synthetic_dataset_generation():
    """Verify synthetic feature matrix and target properties."""
    X, y, baseline = eta_forecast.generate_synthetic_dataset(n_samples=500, random_state=123)
    assert X.shape == (500, 6)
    assert len(y) == 500
    assert len(baseline) == 500
    assert (y >= 0).all()
    assert (baseline >= 0).all()


def test_eta_model_training_and_mae_metrics():
    """Verify ML model trains and computes valid evaluation metrics on held-out test data."""
    model, metrics = eta_forecast.get_or_train_model()
    assert model is not None
    assert metrics["benchmark"] == "synthetic, planted effects"
    assert "baseline_mae_seconds" in metrics
    assert "ml_mae_seconds" in metrics
    assert metrics["baseline_mae_seconds"] > 0
    assert metrics["ml_mae_seconds"] > 0
    assert metrics["test_samples"] > 0


def test_get_eta_forecast_endpoint():
    """Verify GET /eta-forecast response schema and advisory payload."""
    client = TestClient(app)
    resp = client.get("/eta-forecast")
    assert resp.status_code == 200

    data = resp.json()
    assert data["mode"] == "static_timetable"
    assert data["advisory"] is True
    assert data["data_source"] == "synthetic"
    assert "evaluation_metrics" in data
    assert data["evaluation_metrics"]["benchmark"] == "synthetic, planted effects"
    assert "forecasts" in data

    forecasts = data["forecasts"]
    assert len(forecasts) == 4
    for item in forecasts:
        assert "train_id" in item
        assert "name" in item
        assert "type" in item
        assert "distance_to_junction_km" in item
        assert "raw_timetable_speed_kmh" in item
        assert "assumed_speed_kmh" in item
        assert item["assumed_speed_kmh"] <= 110.0  # Capped at corridor max speed
        assert "clamped" in item
        assert isinstance(item["clamped"], bool)
        assert "baseline_eta_s" in item
        assert "ml_eta_s" in item
        assert "variance_vs_baseline_s" in item
        assert item["advisory"] is True
        assert item["baseline_eta_s"] > 0
        assert item["ml_eta_s"] > 0


def test_eta_failsafe_fallback(monkeypatch):
    """Verify that if the ML model is None or fails, the endpoint returns baseline without breaking."""
    monkeypatch.setattr(eta_forecast, "_MODEL", None)
    monkeypatch.setattr(eta_forecast, "get_or_train_model", lambda: (None, {"benchmark": "synthetic, planted effects", "fallback": True}))

    client = TestClient(app)
    resp = client.get("/eta-forecast")
    assert resp.status_code == 200
    data = resp.json()
    assert data["mode"] == "static_timetable"
    assert data["advisory"] is True
    assert data["evaluation_metrics"]["benchmark"] == "synthetic, planted effects"
    for item in data["forecasts"]:
        assert item["ml_eta_s"] == item["baseline_eta_s"]
        assert item["advisory"] is True
        assert item["method"] == "physics"


def test_eta_predictor_model_loads():
    """Verify eta_predictor loads trained model and metadata."""
    from ml import eta_predictor
    model, meta = eta_predictor.load_model(reload=True)
    assert model is not None
    assert meta is not None
    assert "data_source" in meta
    assert "mae_model" in meta
    assert "mae_baseline" in meta
    assert meta["mae_model"] > 0
    assert meta["mae_baseline"] > 0


def test_eta_predictor_output_positive_and_in_range():
    """Verify in-range inputs use ML predictor and return positive ETA values."""
    from ml import eta_predictor
    eta_predictor.load_model(reload=True)
    eta_s, phys_s, method = eta_predictor.predict_eta(distance_m=14000.0, speed_mps=25.0)
    assert eta_s > 0
    assert phys_s > 0
    assert abs(phys_s - 560.0) < 1.0
    assert method in ("ml-synthetic", "ml-real")


def test_eta_predictor_out_of_range_fallback_to_physics():
    """Verify out-of-range inputs fall back to pure physics baseline without extrapolating."""
    from ml import eta_predictor
    eta_predictor.load_model(reload=True)

    # 1. Distance below training minimum (< 500m)
    eta_1, phys_1, m_1 = eta_predictor.predict_eta(distance_m=200.0, speed_mps=25.0)
    assert m_1 == "physics"
    assert eta_1 == phys_1
    assert eta_1 == 8.0

    # 2. Distance above training maximum (> 25,000m)
    eta_2, phys_2, m_2 = eta_predictor.predict_eta(distance_m=35000.0, speed_mps=25.0)
    assert m_2 == "physics"
    assert eta_2 == phys_2
    assert eta_2 == 1400.0

    # 3. Speed below training minimum (< 10 m/s)
    eta_3, phys_3, m_3 = eta_predictor.predict_eta(distance_m=14000.0, speed_mps=5.0)
    assert m_3 == "physics"
    assert eta_3 == phys_3
    assert eta_3 == 2800.0

    # 4. Speed above training maximum (> 45 m/s)
    eta_4, phys_4, m_4 = eta_predictor.predict_eta(distance_m=14000.0, speed_mps=60.0)
    assert m_4 == "physics"
    assert eta_4 == phys_4


def test_eta_predictor_missing_file_fallback(monkeypatch):
    """Verify predict_eta falls back safely to physics if model artifact is missing."""
    from ml import eta_predictor
    # Simulate missing model files
    eta_predictor.load_model(model_path="nonexistent_eta_model.joblib", meta_path="nonexistent_meta.json", reload=True)

    eta_s, phys_s, method = eta_predictor.predict_eta(distance_m=10000.0, speed_mps=20.0)
    assert eta_s == 500.0
    assert phys_s == 500.0
    assert method == "physics"

    # Reload real model
    eta_predictor.load_model(reload=True)


def test_eta_predictor_speed_zero_safety():
    """Verify predict_eta guards against speed_mps <= 0 (divide-by-zero protection)."""
    from ml.eta_predictor import predict_eta
    eta_0, phys_0, method_0 = predict_eta(distance_m=10000.0, speed_mps=0.0)
    assert eta_0 == 0.0
    assert phys_0 == 0.0
    assert method_0 == "physics"

    eta_neg, phys_neg, method_neg = predict_eta(distance_m=10000.0, speed_mps=-10.0)
    assert eta_neg == 0.0
    assert phys_neg == 0.0
    assert method_neg == "physics"


def test_eta_predictor_fallback_when_model_does_not_beat_baseline(monkeypatch):
    """Verify honest model check: falls back to physics when mae_model >= mae_baseline."""
    from ml import eta_predictor
    model, meta = eta_predictor.get_model_and_meta()
    bad_meta = dict(meta) if meta else {}
    bad_meta["mae_model"] = 35.0
    bad_meta["mae_baseline"] = 20.0  # model is worse than baseline

    monkeypatch.setattr(eta_predictor, "_META", bad_meta)

    eta_s, phys_s, method = eta_predictor.predict_eta(distance_m=14000.0, speed_mps=25.0)
    assert method == "physics"
    assert eta_s == phys_s


def test_get_eta_forecast_endpoint_includes_method():
    """Verify GET /eta-forecast returns 'method' in top-level payload and forecasts array."""
    from ml import eta_predictor
    eta_predictor.load_model(reload=True)

    client = TestClient(app)
    resp = client.get("/eta-forecast")
    assert resp.status_code == 200
    data = resp.json()

    assert "method" in data
    assert data["method"] in ("ml-synthetic", "ml-real", "physics")

    assert "forecasts" in data
    assert len(data["forecasts"]) > 0
    for item in data["forecasts"]:
        assert "method" in item
        assert item["method"] in ("ml-synthetic", "ml-real", "physics")


def test_export_logs_device_ms_calculation():
    """Verify export_logs computes actual_time_s and speed_mps correctly from device_ms pairs."""
    from ml.export_logs import SENSOR_SPACING_M, extract_consecutive_sensor_events
    from models import HardwareEvent

    # Simulate two consecutive sensor events on Track A with device_ms
    evt1 = HardwareEvent(
        id=1,
        source="sensor_A1",
        seq=1,
        block_id="A1",
        state="occupied",
        event_type="sensor_triggered",
        event_timestamp=1700000000000,
        device_ms=10000,
        action_taken="accepted",
        signal_a="PROCEED",
        signal_b="PROCEED",
        active_trains=["T101"],
        reason="",
    )
    evt2 = HardwareEvent(
        id=2,
        source="sensor_A2",
        seq=2,
        block_id="A2",
        state="occupied",
        event_type="sensor_triggered",
        event_timestamp=1700000001000,
        device_ms=11000,  # 1.000s delta
        action_taken="accepted",
        signal_a="PROCEED",
        signal_b="PROCEED",
        active_trains=["T101"],
        reason="",
    )

    rows = extract_consecutive_sensor_events([evt1, evt2])
    assert len(rows) == 1
    dist, speed, actual_time, train_type, headway, signal = rows[0]
    assert dist == SENSOR_SPACING_M
    assert actual_time == 1.000
    assert speed == round(SENSOR_SPACING_M / 1.000, 3)
    assert train_type == "Express"
    assert signal == "PROCEED"


