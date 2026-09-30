"""SQLAlchemy 2.0 database models for PostgreSQL persistence.

Defines tables matching the railway topology, disruptions, optimizer runs,
train timing results, validation conflicts, hardware sensor events,
converging junction decisions, and headline KPI snapshots.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

JSON_TYPE = JSON().with_variant(JSONB, "postgresql")


class Base(DeclarativeBase):
    pass


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Train(Base):
    __tablename__ = "trains"

    id: Mapped[str] = mapped_column(String(16), primary_key=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    type: Mapped[str] = mapped_column(String(32), nullable=False)
    priority: Mapped[int] = mapped_column(Integer, nullable=False)
    weight: Mapped[int] = mapped_column(Integer, nullable=False)
    colour: Mapped[str] = mapped_column(String(16), nullable=False, default="#6366f1")
    origin_station: Mapped[str] = mapped_column(String(32), nullable=False, default="A")
    dest_station: Mapped[str] = mapped_column(String(32), nullable=False, default="D")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    schedule_results: Mapped[List["ScheduleResult"]] = relationship(
        "ScheduleResult", back_populates="train", cascade="all, delete-orphan"
    )


class Block(Base):
    __tablename__ = "blocks"

    id: Mapped[str] = mapped_column(String(16), primary_key=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    from_station: Mapped[str] = mapped_column(String(32), nullable=False)
    to_station: Mapped[str] = mapped_column(String(32), nullable=False)
    length_km: Mapped[float] = mapped_column(Float, nullable=False)
    max_speed_kmh: Mapped[int] = mapped_column(Integer, nullable=False, default=110)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    schedule_results: Mapped[List["ScheduleResult"]] = relationship(
        "ScheduleResult", back_populates="block", cascade="all, delete-orphan"
    )


class Disruption(Base):
    __tablename__ = "disruptions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    type: Mapped[str] = mapped_column(String(32), nullable=False)
    label: Mapped[str] = mapped_column(String(256), nullable=False)
    train_id: Mapped[Optional[str]] = mapped_column(String(16), ForeignKey("trains.id"), nullable=True)
    block_id: Mapped[Optional[str]] = mapped_column(String(16), ForeignKey("blocks.id"), nullable=True)
    minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    start_minute: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    end_minute: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class ScheduleRun(Base):
    __tablename__ = "schedule_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    run_type: Mapped[str] = mapped_column(String(32), nullable=False)
    solver_status: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    is_optimal: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    wall_time_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    variables: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    constraints: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    num_conflicts: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    num_branches: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    objective_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    best_objective_bound: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    disruptions_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    results: Mapped[List["ScheduleResult"]] = relationship(
        "ScheduleResult", back_populates="run", cascade="all, delete-orphan"
    )
    conflicts: Mapped[List["Conflict"]] = relationship(
        "Conflict", back_populates="run", cascade="all, delete-orphan"
    )
    kpi_snapshots: Mapped[List["KPISnapshot"]] = relationship(
        "KPISnapshot", back_populates="run"
    )


class ScheduleResult(Base):
    __tablename__ = "schedule_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    run_id: Mapped[int] = mapped_column(Integer, ForeignKey("schedule_runs.id", ondelete="CASCADE"), nullable=False)
    train_id: Mapped[str] = mapped_column(String(16), ForeignKey("trains.id"), nullable=False)
    block_id: Mapped[str] = mapped_column(String(16), ForeignKey("blocks.id"), nullable=False)
    entry_minute: Mapped[int] = mapped_column(Integer, nullable=False)
    entry_label: Mapped[str] = mapped_column(String(16), nullable=False)
    exit_minute: Mapped[int] = mapped_column(Integer, nullable=False)
    exit_label: Mapped[str] = mapped_column(String(16), nullable=False)
    hold_min: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    run_min: Mapped[int] = mapped_column(Integer, nullable=False)
    final_delay_min: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    run: Mapped["ScheduleRun"] = relationship("ScheduleRun", back_populates="results")
    train: Mapped["Train"] = relationship("Train", back_populates="schedule_results")
    block: Mapped["Block"] = relationship("Block", back_populates="schedule_results")


class Conflict(Base):
    __tablename__ = "conflicts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    run_id: Mapped[int] = mapped_column(Integer, ForeignKey("schedule_runs.id", ondelete="CASCADE"), nullable=False)
    conflict_code: Mapped[str] = mapped_column(String(32), nullable=False)
    type: Mapped[str] = mapped_column(String(32), nullable=False)
    severity: Mapped[str] = mapped_column(String(16), nullable=False)
    check_id: Mapped[str] = mapped_column(String(32), nullable=False)
    block_id: Mapped[Optional[str]] = mapped_column(String(16), ForeignKey("blocks.id"), nullable=True)
    station_id: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    train_1: Mapped[Optional[str]] = mapped_column(String(16), ForeignKey("trains.id"), nullable=True)
    train_2: Mapped[Optional[str]] = mapped_column(String(16), ForeignKey("trains.id"), nullable=True)
    start_min: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    end_min: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    run: Mapped["ScheduleRun"] = relationship("ScheduleRun", back_populates="conflicts")


class HardwareEvent(Base):
    __tablename__ = "hardware_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source: Mapped[str] = mapped_column(String(32), nullable=False)
    seq: Mapped[int] = mapped_column(Integer, nullable=False)
    block_id: Mapped[str] = mapped_column(String(16), nullable=False)
    state: Mapped[str] = mapped_column(String(16), nullable=False)
    event_type: Mapped[str] = mapped_column(String(32), nullable=False)
    client_ip: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    event_timestamp: Mapped[int] = mapped_column(Integer, nullable=False)  # Milliseconds epoch
    action_taken: Mapped[str] = mapped_column(String(32), nullable=False)
    signal_a: Mapped[str] = mapped_column(String(16), nullable=False)
    signal_b: Mapped[str] = mapped_column(String(16), nullable=False)
    active_trains: Mapped[Optional[Any]] = mapped_column(JSON_TYPE, nullable=True)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    junction_decisions: Mapped[List["JunctionDecision"]] = relationship(
        "JunctionDecision", back_populates="hardware_event", cascade="all, delete-orphan"
    )


class JunctionDecision(Base):
    """Specific 2-train converging junction decision outputs from optimize_junction_conflict()."""
    __tablename__ = "junction_decisions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    hardware_event_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("hardware_events.id", ondelete="CASCADE"), nullable=False
    )
    ready_time_a: Mapped[int] = mapped_column(Integer, nullable=False)
    ready_time_b: Mapped[int] = mapped_column(Integer, nullable=False)
    weight_a: Mapped[int] = mapped_column(Integer, nullable=False)
    weight_b: Mapped[int] = mapped_column(Integer, nullable=False)
    entry_a: Mapped[int] = mapped_column(Integer, nullable=False)
    entry_b: Mapped[int] = mapped_column(Integer, nullable=False)
    delay_a: Mapped[int] = mapped_column(Integer, nullable=False)
    delay_b: Mapped[int] = mapped_column(Integer, nullable=False)
    proceed_train: Mapped[str] = mapped_column(String(16), nullable=False)
    hold_train: Mapped[str] = mapped_column(String(16), nullable=False)
    objective_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    wall_time_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    hardware_event: Mapped["HardwareEvent"] = relationship("HardwareEvent", back_populates="junction_decisions")


class KPISnapshot(Base):
    __tablename__ = "kpi_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    run_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("schedule_runs.id", ondelete="SET NULL"), nullable=True
    )
    active_schedule: Mapped[str] = mapped_column(String(32), nullable=False)
    total_delay_min: Mapped[int] = mapped_column(Integer, nullable=False)
    max_delay_min: Mapped[int] = mapped_column(Integer, nullable=False)
    trains_scheduled: Mapped[int] = mapped_column(Integer, nullable=False)
    on_time_trains: Mapped[int] = mapped_column(Integer, nullable=False)
    delayed_trains: Mapped[int] = mapped_column(Integer, nullable=False)
    delayed_train_ids: Mapped[Optional[Any]] = mapped_column(JSON_TYPE, nullable=True)
    critical_conflicts: Mapped[int] = mapped_column(Integer, nullable=False)
    warnings: Mapped[int] = mapped_column(Integer, nullable=False)
    cascade_total_delay_min: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    rule_based_total_delay_min: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    optimized_total_delay_min: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    recovered_vs_rule_based_min: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    disruptions_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    run: Mapped[Optional["ScheduleRun"]] = relationship("ScheduleRun", back_populates="kpi_snapshots")
