# Longevity Control Panel

A premium health dashboard that estimates a Physiologic Aging Score (PAS) as a 7-day rolling metric, generates daily health plans, and visualizes long-term health trajectories.

## Architecture

Frontend-heavy React + TypeScript app with an Express backend (minimal, serving static assets). All computations and mock data are handled client-side.

### Tech Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts, Framer Motion
- **Backend**: Express (serves frontend, no API routes needed)
- **Routing**: wouter
- **State**: React Context (MetricsProvider)

### Project Structure
```
client/src/
  lib/
    scoring.ts      - PAS & ILI computation engine with configurable weights
    rules.ts        - Today's Plan generator (exercise/diet/supplement rules)
    mockData.ts     - 60-day plausible mock data generator
    metricsStore.tsx - React context for global state
  components/
    app-sidebar.tsx    - Navigation sidebar
    pas-gauge.tsx      - SVG radial gauge for PAS display
    evidence-badge.tsx - Color-coded evidence badges (green/yellow/orange/red)
    plan-card.tsx      - Expandable plan recommendation cards
    risk-dial.tsx      - Health risk semicircular dials
    theme-provider.tsx - Dark/light mode provider
  pages/
    home.tsx        - Main dashboard (PAS gauge, sparkline, Today's Plan)
    trends.tsx      - 30-day trend charts (PAS, recovery, glucose, training, AQI)
    health-risk.tsx - Long-term risk trajectories (cardio, neuro, musculoskeletal)
    settings.tsx    - Data sources, preferences, Apple Health placeholder
shared/
  schema.ts - DailyMetrics type, plan types, scoring weights, HealthDataProvider interface
```

### PAS Computation
PAS (Physiologic Aging Score) is a 0-100 rolling 7-day composite:
- **Recovery (30%)**: HRV vs 21-day baseline, resting HR deviation, sleep hours, sleep regularity
- **Metabolic (20%)**: Glucose spike score, late eating, fasting glucose trend
- **Fitness (25%)**: VO2max, Zone 2 minutes, strength sessions (protective/reduces PAS)
- **Inflammatory (15%)**: Alcohol intake, sleep debt
- **Environmental (10%)**: Air quality index

Weights are editable in `shared/schema.ts` (PAS_WEIGHTS).

### Apple Health Integration
A `HealthDataProvider` interface is defined in `shared/schema.ts`. Currently uses MockProvider. Real Apple Health integration requires iOS/macOS native bridge (Swift/HealthKit) or local JSON/CSV export service.

### Color Theme
- Primary: Teal (hsl 168) - health/longevity association
- Evidence badges: Emerald (strong), Amber (moderate), Orange (emerging), Red (caution)
- Dark mode supported via ThemeProvider
