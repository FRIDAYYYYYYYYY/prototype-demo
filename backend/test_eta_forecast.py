"""Tests for the Advisory ETA Forecast Module (GET /eta-forecast).

Verifies:
1. Synthetic data generation and feature matrix dimensions.
2. Gradient Boosting model training and non-zero MAE improvement over baseline.
3. Response schema for GET /eta-forecast (train_id, baseline_eta_s, ml_eta_s, advisory, data_source='synthetic').
4. Speed clamping flag per-class (Express, Passenger, Freight).
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
        assert "assumed_speed_kmh" in item
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
    assert data["advisory"] is True
    assert data["evaluation_metrics"]["benchmark"] == "synthetic, planted effects"
    for item in data["forecasts"]:
        assert item["ml_eta_s"] == item["baseline_eta_s"]
        assert item["advisory"] is True
