# AI-Powered Precise Train Traffic Control — SIH25022
## Product Requirements Document (PRD)

---

### 1. Problem Statement

A shared railway junction serving two approaches cannot safely allow both trains through simultaneously. Today, a hand-coded local rule (first train to arrive proceeds — First-Come, First-Served / FCFS) resolves this on the hardware controller alone. 

That rule has significant limitations:
* **No priority awareness:** It treats a high-priority passenger express the same as a low-priority freight train.
* **No global optimization:** It cannot evaluate downstream network delays, platform occupancies, or total passenger delay impact.
* **No corridor visibility:** It operates strictly on local proximity without visibility into adjacent block sections.

This project replaces that rigid local rule with an **AI decision-support layer** powered by Google OR-Tools CP-SAT that a human railway dispatcher can inspect, trust, and understand.

---

### 2. Product Vision

A fully working, judge-facing decision-support prototype where a physical two-track junction model (sensors + optical signals) reports real-time occupancy events to a software backend. 

The software backend:
1. Simulates corridor progression and tracks dynamic block occupancies.
2. Detects junction and headway conflicts in real time.
3. Solves dynamic rescheduling using Constraint Programming (CP-SAT).
4. Independently safety-validates the proposed plan against headway, platform, and possession rules.
5. Emits an explainable, human-readable advisory recommendation.
6. Transmits the optimal signal state back to the physical junction signals (LEDs).

> **Safety Boundary / Non-Autonomous Notice:**  
> The human dispatcher (or judge) remains in the loop at all times. The system provides decision-support and advisory guidance; it does **not** issue autonomous movement authorities to real rolling stock.

---

### 3. User Personas & Target Audiences

| Persona | Role | Key Needs & Interactions |
| :--- | :--- | :--- |
| **Hackathon Judges** | Primary Evaluation Audience | Needs to verify technical depth, algorithmic rigor (CP-SAT), real-time hardware loop reliability, and clear before/after delay metrics. |
| **Railway Dispatcher** | Simulated End User | Needs explainable advisory recommendations ("why train B holds for train A"), punctuality metrics, and override capability. |
| **Hardware Workstream** | Integration Consumer | Needs a reliable, lightweight contract (`POST /sensor-event`, `GET /block-state`) over standard HTTP/WiFi. |
| **Software Workstream** | Implementation Owner | Maintains backend solver integrity, safety validators, API endpoints, and dispatcher dashboard UI. |

---

### 4. Scope for the Final Round

#### In-Scope (Phase 1 – Phase 5.5)
* **Complete End-to-End Loop:** Physical sensor triggers (IR / buttons) $\rightarrow$ ESP32 $\rightarrow$ Backend conflict detection $\rightarrow$ CP-SAT re-planning $\rightarrow$ Safety validator $\rightarrow$ Advisory generator $\rightarrow$ Signal aspect feedback to hardware LEDs.
* **Quantifiable Value Demonstration:** Live side-by-side comparison of the legacy local FCFS rule vs. CP-SAT priority optimization on an asymmetric arrival scenario.
* **Interactive UI:** React + MUI corridor schematic with live signal head indicators, train progress tracking, and delay charts.
* **Resilient Demo Path:** Fully tested live execution flow with automated backup recordings in case of live hardware/network failure.

#### Out-of-Scope / Explicitly Deferred (Phase Final)
* Multi-tenant cloud database persistence (PostgreSQL / TimescaleDB).
* External Power BI / Tableau business intelligence suites.
* Heavy Machine Learning (reinforcement learning, LSTM delay forecasting) that would introduce non-deterministic edge cases on demo day.
* Unscheduled refactors or UI redesigns that do not directly contribute to closing the hardware integration loop.

---

### 5. Success Criteria

| Criterion | Target Metric / Pass Condition | Verification Method |
| :--- | :--- | :--- |
| **End-to-End Hardware Loop** | Physical sensor activation updates backend state and drives hardware LEDs within $<2\text{ s}$. | Physical sensor triggering test with live ESP32 polling. |
| **Algorithmic Outperformance** | CP-SAT demonstrates measurable reduction in total passenger-weighted delay vs. FCFS. | Live KPI comparison card and schedule diff metrics. |
| **Safety & Constraint Adherence** | 100% adherence to $3\text{ min}$ headway separation, platform limits, and track possession closures. | Independent validation pass via `backend/validator.py`. |
| **Deterministic Reliability** | 10/10 automated test suites passing + 3 consecutive successful physical rehearsal runs. | Automated pytest suite & recorded fallback video. |
