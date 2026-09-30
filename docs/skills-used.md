# Skills Inventory & Usage Audit — RailGuard AI

**Document Path:** `docs/skills-used.md`  
**Execution Phase:** Step -1 (Pre-Flight Skills Audit)  
**System Location:** Global Config `C:\Users\Sri\.gemini\config\skills` & Plugins

---

## 1. Skills Discovered in the Environment

### 1.1 Global Skills Directory (`C:\Users\Sri\.gemini\config\skills\`)
1. **`building-data-apps`** — Architecture guide for React + Vite SaaS data apps, card-based zinc design systems, KPI metrics, responsive layouts, theme toggles, and browser verification.
2. **`ml-best-practices`** — ML workflow best practices, regression metrics, model evaluation, and clear visualization handoffs.
3. **`agent-learner`** — Continuous learning and debugging memory engine.
4. **`managing-python-dependencies`** — Python virtual environment and dependency isolation.
5. **`notebook-guidance`** — Jupyter notebook guidance and analytical charts.
6. **`discovering-gcp-data-assets`**, **`bigquery-sql`**, **`dataform-bigquery`**, **`dbt-bigquery`**, **`gcp-dataflow`**, **`gcp-spark`**, **`schema-mapping`**, etc. — GCP backend data pipeline skills.

### 1.2 Plugin Skills (`C:\Users\Sri\.gemini\config\plugins\`)
1. **`modern-web-guidance-plugin`** (`modern-web-guidance`) — 99 modern web platform features (CSS View Transitions, `@starting-style`, Popover API, `IntersectionObserver`, `light-dark()`, modern easing curves, accessibility).
2. **`gemini-api`** (`gemini-api-dev`, `gemini-live-api-dev`, `gemini-omni-flash-api`) — Multi-modal Gemini integration.
3. **`data-agent-kit-plugin`** — Data agent and cloud storage management.
4. **`science`** & **`android-cli-plugin`** — Domain-specific utilities.

### 1.3 Built-in Skills (`C:\Users\Sri\.gemini\antigravity-ide\builtin\skills\`)
1. **`agy-customizations`** — Antigravity customization, skills, rules, and hooks configuration.
2. **`antigravity_guide`** — Antigravity platform reference.

### 1.4 Workspace Skills
* Workspace root: `c:\Users\Sri\OneDrive\Desktop\friday_traintraffic\prototype-demo`
* Status: No local `.agents/skills` folder found; global and plugin skill definitions are utilized.

---

## 2. Skills Selected & Component Mapping

| Skill | Component / Phase | Specific Guidance Applied |
| :--- | :--- | :--- |
| **`building-data-apps`** | Overall UI Layout, KPI Cards, Overview Hero, Decision Core | • Card-based layout hierarchy with subtle border strokes (`border-zinc-200 / border-zinc-800`).<br/>• Tabular numerals for timestamps and solver metrics.<br/>• Semantic color coding: Green (proceed/success), Red (hold/danger), Amber (caution/variance).<br/>• Full acceptance checklist verification using automated Playwright browser tests. |
| **`modern-web-guidance-plugin`** | Motion Design System (`src/motion/`), Corridor SVG, Decision Toggle | • GPU-accelerated CSS transforms and opacity-only animation loops.<br/>• Native `IntersectionObserver` for viewport-aware stagger reveals.<br/>• Modern `cubic-bezier(0.16, 1, 0.3, 1)` smooth deceleration curves.<br/>• Accessible focus indicators and `prefers-reduced-motion` compliance. |
| **`ml-best-practices`** | ML ETA Forecast (`src/components/EtaForecast.jsx`) | • Explicit labeling of synthetic training data vs. live telemetry.<br/>• Side-by-side display of direct kinematic baseline vs. ML gradient boost regressor with variance deltas.<br/>• Prominent advisory notice: ML assists dispatchers without altering hard CP-SAT safety constraints. |

---

## 3. Conflict Resolution & Rule Precedence

Where skills suggest generic defaults that conflict with the **Hackathon Prototype Guardrails & Rules**, the project **RULES strictly take precedence**:

1. **Safety & Certification Language:**
   * *Skill Default:* May generate enterprise SLA or certification claims.
   * *Project Rule (PREVAILS):* Prominent disclaimer stating **"Decision-support prototype — not safety-certified railway infrastructure"** is strictly maintained on all headers and footers.
2. **Manual Overrides & E-Stop:**
   * *Skill Default:* May suggest direct hardware actuation bindings.
   * *Project Rule (PREVAILS):* Dispatcher overrides and emergency all-stop actions are **simulated decision-support advisories only**; they do not issue autonomous movement authorities to physical rolling stock.
3. **Backend & Solver Integrity:**
   * *Skill Default:* May propose modifying database schemas or solver endpoints.
   * *Project Rule (PREVAILS):* Backend CP-SAT solver, ESP32 contracts (`/sensor-event`, `/block-state`), and firmware loops remain untouched.
4. **Data Authenticity:**
   * *Skill Default:* May generate placeholder or randomized figures.
   * *Project Rule (PREVAILS):* All numbers are either measured from live telemetry or clearly badged as recorded prototype values.

---

## 4. Missing Skills Assessment

* **Railway-Specific Interlocking / CENELEC Interlocking Skill:** Not present in global skills; domain rules (exclusive block occupancy, 90s minimum headway separation, and 210s crossing windows) are derived directly from the project [PRD.md](file:///c:/Users/Sri/OneDrive/Desktop/friday_traintraffic/prototype-demo/PRD.md) and [TRD.md](file:///c:/Users/Sri/OneDrive/Desktop/friday_traintraffic/prototype-demo/TRD.md).
