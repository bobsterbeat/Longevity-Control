# Longevity Control Panel

A personal health dashboard for tracking biological aging velocity. Built with React, TypeScript, and Recharts — fully client-side, no account required.

> **Educational use only. Not medical advice.**

---

## What it does

The app computes a **Physiologic Aging Score (PAS)** — a 0–100 daily composite that estimates how fast you're aging based on inputs you control. Lower is better. It's not a diagnosis; it's a directional signal for lifestyle decisions.

### Pages

| Page | Purpose |
|------|---------|
| **Daily Control** | Main dashboard — today's PAS gauge, recovery snapshot, top drivers, and a 4-card action plan |
| **Trends** | 30-day charts for PAS/ILI, recovery metrics, glucose, training load, and environment |
| **Health Risk** | Long-term risk trajectories for cardiometabolic, neurocognitive, and musculoskeletal health |
| **Settings** | Theme, data sources, and the experimental supplements toggle |

---

## PAS formula

```
PAS = Recovery(30%) + Metabolic(20%) + Fitness(25%) + Inflammatory(15%) + Environmental(10%)
```

Each subscore runs 0–100. All are computed against a rolling baseline (default 21 days, configurable in the Recovery chart). The 7-day rolling average smooths daily noise.

### Inputs tracked daily

| Category | Metrics |
|----------|---------|
| Recovery | HRV (ms), Resting HR (bpm), Sleep hours, Bedtime, Wake time, Awakenings |
| Metabolic | Fasting glucose, Glucose spike score, Late eating, Last meal time |
| Fitness | VO2max, Zone 2 minutes, Strength sessions, HIIT sessions |
| Inflammatory | Alcohol drinks, Last drink time |
| Environmental | AQI |

---

## Features

### Daily Control
- **PAS Gauge** — animated 7-day rolling score with sparkline
- **Recovery Snapshot** — HRV and RHR vs 21-day baseline, sleep hours, sleep consistency score (from bedtime/wake variability), awakenings
- **Top Drivers Today** — top 3 subscores increasing PAS + top 1 protective factor, shown as weighted delta contributions
- **Inflammatory Load (ILI)** — secondary composite focused on acute stressors
- **PAS Breakdown** — weighted bar chart of all 5 subscores
- **Today's Plan (4 cards)**:
  - Exercise — recovery vs training day, AQI override
  - Diet — Mediterranean focus, glucose and meal timing advice
  - Supplements — "Suggested Today" vs "Daily Stack" sections, AM/PM timing badges, evidence badges, caution text, and an Experimental/Emerging toggle
  - Sleep Plan — personalized based on sleep debt, HRV suppression, RHR elevation, and sleep variability
- **Edit Today modal** — update all metrics including bedtime, wake time, awakenings, alcohol timing, and late eating time

### Trends
- PAS & ILI area chart (30 days)
- Recovery chart with **baseline band** and configurable baseline window (7 / 21 / 42 days), **z-score toggle** to normalize across metrics, and per-metric reference lines
- Glucose spike bar chart
- Stacked training load (Zone 2 / Strength / HIIT)
- AQI area chart
- Intervention timeline
- **Weekly Insights** — simple n-of-1 correlations: alcohol → next-day HRV, late eating → spike score, Zone 2 → 48h PAS change

### Evidence color system

| Color | Meaning |
|-------|---------|
| Green | Strong evidence — multiple high-quality studies |
| Yellow | Moderate evidence — some studies, individual response varies |
| Orange | Emerging / Experimental — early research or animal studies |
| Red | Caution — significant risks or not recommended |

---

## Running locally

### Prerequisites
- Node.js 18+ (check with `node -v`)
- npm (comes with Node)

### Install and start

```bash
cd Longevity-Control
npm install
npm run dev
```

Open [http://localhost:5000](http://localhost:5000) in your browser.

The app runs entirely in the browser using 60 days of generated mock data. No database or API keys are needed.

### Other commands

```bash
npm run build    # Production build → dist/
npm run check    # TypeScript type check
```

---

## Project structure

```
Longevity-Control/
├── client/src/
│   ├── pages/
│   │   ├── home.tsx          # Daily Control dashboard
│   │   ├── trends.tsx        # Trend charts + weekly insights
│   │   ├── health-risk.tsx   # Risk trajectory dials
│   │   └── settings.tsx      # Preferences
│   ├── components/
│   │   ├── pas-gauge.tsx     # SVG animated gauge
│   │   ├── plan-card.tsx     # Expandable plan card (exercise, diet, sleep)
│   │   ├── supplement-card.tsx  # Two-section supplement card
│   │   ├── evidence-badge.tsx   # Color-coded evidence badge
│   │   └── ui/               # shadcn/ui component library
│   └── lib/
│       ├── scoring.ts        # PAS / ILI calculation engine
│       ├── rules.ts          # Today's Plan generation
│       ├── mockData.ts       # 60-day synthetic data
│       └── metricsStore.tsx  # React Context state
├── shared/
│   └── schema.ts             # Zod schemas + TypeScript types
└── server/
    └── index.ts              # Express dev server (serves Vite)
```

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| UI framework | React 18 + TypeScript |
| Build tool | Vite 7 |
| Styling | Tailwind CSS |
| Components | Radix UI / shadcn-ui |
| Charts | Recharts |
| Animation | Framer Motion |
| Routing | Wouter |
| Validation | Zod |
| Server | Express (dev only) |

---

## Roadmap / not yet implemented

- Real data import (CSV, Apple Health)
- User authentication + persistent storage (PostgreSQL + Drizzle ORM are scaffolded)
- Push notifications for recovery alerts
- CGM integration for live glucose data

---

## Disclaimer

This application is for educational and personal tracking purposes only. It does not constitute medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider before making changes to your health regimen.
