# RailGuard AI — Motion Design Specification & Design System
**Branch**: `ui-motion`  
**Version**: 1.0.0 (Apple-Grade Motion Specification)  
**Target Performance**: 60 FPS GPU-accelerated (Transform & Opacity only)

---

## 1. Design Philosophy & Core Principles

Inspired by Apple Pro product presentations and modern industrial dispatch consoles:
1. **Purposeful Kinetic Feedback**: Motion is never decorative clutter; it communicates state transitions (e.g. signal aspect change from HOLD to PROCEED, train kinematic progression along physical blocks, solver convergence).
2. **Physical Kinematics**: Train movement and UI cards use spring and cubic-bezier easings that mimic physical mass and velocity rather than linear or jarring transitions.
3. **Information First (Zero Delay to Live Polling)**: Animations never block, delay, or mask incoming ESP32 telemetry or solver advisories. Numbers count up smoothly; status dots breathe asynchronously.
4. **Inclusive Motion (prefers-reduced-motion)**: When reduced motion is requested, all transforms collapse to instantaneous or subtle opacity crossfades.

---

## 2. Motion Tokens (Anime.js & CSS Variables)

### 2.1 Easing Curves
- **Apple Smooth (Default Entrance/Exit)**: `cubicBezier(0.16, 1, 0.3, 1)` (equivalent to `cubic-bezier(0.16, 1, 0.3, 1)`) — rapid onset with prolonged, buttery deceleration.
- **Spring Kinematics (Physical Trains & Dials)**: `spring({ mass: 1, stiffness: 90, damping: 14, velocity: 0 })`
- **Punchy Accent (Badges, Alerts, Toggles)**: `cubicBezier(0.34, 1.56, 0.64, 1)` — subtle overshoot for confirmation states.
- **Linear Continuous (Track Flow & Sleeper Waves)**: `linear`

### 2.2 Duration Tokens
| Token | Value | Use Case |
| :--- | :--- | :--- |
| `duration-instant` | `120ms` | Button active/press, toggle switches, hover highlights |
| `duration-fast` | `240ms` | Tooltips, badge pop-in, LED glow transitions |
| `duration-base` | `480ms` | Card reveals, tab transitions, count-up numbers |
| `duration-slow` | `800ms` | Decision Core Case 2 vs Case 3 bars, ML forecast changes |
| `duration-glider` | `4800ms` | SVG Train corridor gliding loop along block sensors |

### 2.3 Stagger Patterns
- **Hero & Card Grids**: `stagger(60)` (60ms offset between child items)
- **Sensor Stream Rows**: `stagger(40)` (40ms waterfall reveal)
- **Decision Stages & Constraints**: `stagger(80)` (80ms sequential audit step reveal)

---

## 3. Typography Scale & Spatial Rhythm

### 3.1 Type Scale
- **Hero Display**: `clamp(2.5rem, 5vw, 3.75rem)` / Weight: `700` / Tracking: `-0.03em` / Line-height: `1.08`
- **Section Heading / H2**: `1.75rem` (28px) / Weight: `650` / Tracking: `-0.02em`
- **Card Titles / H3**: `1.125rem` (18px) / Weight: `600` / Tracking: `-0.01em`
- **KPI Large Number**: `2.25rem` (36px) / Weight: `700` / Font: `JetBrains Mono, SF Mono, Menlo, monospace`
- **Body Regular**: `0.9375rem` (15px) / Weight: `400` / Line-height: `1.5`
- **Mono Small / Badges**: `0.75rem` (12px) / Weight: `500` / Tracking: `0.02em`

### 3.2 Spacing & Surface Hierarchy
- **Base Grid Unit**: `8px` (8, 16, 24, 32, 48, 64)
- **Card Padding**: `20px` to `24px`
- **Surface Elevation**: Multi-layered diffused shadows + subtle inner border stroke (`rgba(255,255,255,0.08)` dark mode, `rgba(0,0,0,0.06)` light mode) with backdrop blur (`backdrop-filter: blur(16px)`).

---

## 4. Animation Inventory to Implement

### A. Live Junction Corridor & Sensors
- **Train Glider Motion**: Smooth, synchronized movement of Train A (Express) and Train B (Freight) along track geometry with deceleration near signal lamps and acceleration through Junction 14.
- **Signal Aspect LED Glow**: Smooth color and bloom pulse transition when signals shift between `PROCEED` (emerald neon), `HOLD` (crimson ember), and `WARN` (amber halo).
- **Sensor Block Pulse**: GPIO sensors (A1, A2, B1, B2) pulse with a glowing ping ripple when active block occupancy changes.

### B. Decision Core (Case 2 vs Case 3 Staggered Reveal)
- **Interactive Case 2 vs Case 3 Toggle & Comparison**:
  - *Case 2 (Legacy FCFS / Hold Express)*: 9.2 min weighted delay, red bottleneck indicator.
  - *Case 3 (CP-SAT Priority / Hold Freight)*: 4.6 min weighted delay (50% reduction), green efficiency sweep.
- **Bar Sweep Animation**: Animated fill width sweep on metric change using Anime.js timing.
- **Staggered Decision Pipeline**: 7-stage sequential verification checklist cascading into view with completed status dots.

### C. ETA Forecast Cards & Real-Time Counters
- **Count-Up Numerals**: Micro-count-up for baseline vs ML seconds, updating smoothly on polling without layout shift.
- **Variance Delta Glow**: Subtle amber/teal pill glow when ML model refines kinematic arrival time.
- **Staggered Card Grid**: Staggered fade/slide on initial load or tab switch.

### D. Apple-Grade Overview Hero & Navigation
- **Hero Ambient Glow**: Subtle, floating gradient orb backdrop with gentle breathing motion.
- **Scroll & Reveal Motion**: Viewport intersection observer triggering `translateY(16px) -> 0` and `opacity: 0 -> 1` stagger.
- **Polished Tab / Page Transitions**: Subtle crossfade and smooth translate for tab navigation.
