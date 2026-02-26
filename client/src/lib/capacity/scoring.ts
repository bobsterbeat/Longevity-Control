import { getLatestCapacityResults, loadProfile, type UserProfile } from "./store";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FitnessCategory = "excellent" | "good" | "average" | "fair" | "low";

export interface MetricScore {
  score: number;          // 0–100
  category: FitnessCategory;
  value: number | null;
  unit: string;
  hasData: boolean;
}

export interface FRSResult {
  frs: number;            // 0–100
  frsBand: FRSBand;
  vo2max: MetricScore;
  grip: MetricScore;
  mobility: MetricScore;  // average of sit-to-stand + step test
  balance: MetricScore;
  restingHR: MetricScore;
  hasData: boolean;
}

export type FRSBand = "high-reserve" | "good" | "reduced" | "low-reserve";

// ─── Normative tables ─────────────────────────────────────────────────────────

interface NormRow {
  ageMin: number;
  ageMax: number;
  excellent: number;  // ≥ this for higher-is-better, ≤ this for lower-is-better
  good: number;
  average: number;
  fair: number;
}

// VO2max (mL/kg/min) — higher is better (ACSM / Cooper Institute)
const VO2MAX_NORMS: Record<"male" | "female", NormRow[]> = {
  male: [
    { ageMin: 18, ageMax: 29, excellent: 52, good: 46, average: 42, fair: 37 },
    { ageMin: 30, ageMax: 39, excellent: 50, good: 44, average: 40, fair: 35 },
    { ageMin: 40, ageMax: 49, excellent: 46, good: 41, average: 36, fair: 30 },
    { ageMin: 50, ageMax: 59, excellent: 42, good: 36, average: 32, fair: 26 },
    { ageMin: 60, ageMax: 200, excellent: 38, good: 33, average: 28, fair: 22 },
  ],
  female: [
    { ageMin: 18, ageMax: 29, excellent: 41, good: 36, average: 31, fair: 26 },
    { ageMin: 30, ageMax: 39, excellent: 40, good: 35, average: 30, fair: 25 },
    { ageMin: 40, ageMax: 49, excellent: 37, good: 32, average: 27, fair: 22 },
    { ageMin: 50, ageMax: 59, excellent: 34, good: 29, average: 25, fair: 20 },
    { ageMin: 60, ageMax: 200, excellent: 30, good: 26, average: 22, fair: 17 },
  ],
};

// Grip strength (kg) — higher is better (Leong et al. Lancet 2015, NHANES)
const GRIP_NORMS: Record<"male" | "female", NormRow[]> = {
  male: [
    { ageMin: 18, ageMax: 39, excellent: 47, good: 41, average: 35, fair: 28 },
    { ageMin: 40, ageMax: 49, excellent: 49, good: 43, average: 37, fair: 30 },
    { ageMin: 50, ageMax: 59, excellent: 46, good: 40, average: 34, fair: 27 },
    { ageMin: 60, ageMax: 200, excellent: 42, good: 36, average: 30, fair: 23 },
  ],
  female: [
    { ageMin: 18, ageMax: 39, excellent: 33, good: 27, average: 22, fair: 17 },
    { ageMin: 40, ageMax: 49, excellent: 33, good: 27, average: 22, fair: 17 },
    { ageMin: 50, ageMax: 59, excellent: 32, good: 26, average: 20, fair: 14 },
    { ageMin: 60, ageMax: 200, excellent: 30, good: 24, average: 18, fair: 12 },
  ],
};

// 30-sec Sit-to-Stand reps — higher is better (Rikli & Jones Senior Fitness Test)
const SIT_TO_STAND_NORMS: Record<"male" | "female", NormRow[]> = {
  male: [
    { ageMin: 18, ageMax: 39, excellent: 24, good: 20, average: 16, fair: 12 },
    { ageMin: 40, ageMax: 49, excellent: 22, good: 17, average: 13, fair: 10 },
    { ageMin: 50, ageMax: 59, excellent: 20, good: 15, average: 11, fair: 8  },
    { ageMin: 60, ageMax: 69, excellent: 17, good: 13, average: 9,  fair: 6  },
    { ageMin: 70, ageMax: 200, excellent: 15, good: 11, average: 7, fair: 4  },
  ],
  female: [
    { ageMin: 18, ageMax: 39, excellent: 22, good: 18, average: 14, fair: 10 },
    { ageMin: 40, ageMax: 49, excellent: 20, good: 16, average: 12, fair: 8  },
    { ageMin: 50, ageMax: 59, excellent: 19, good: 14, average: 10, fair: 7  },
    { ageMin: 60, ageMax: 69, excellent: 16, good: 12, average: 8,  fair: 5  },
    { ageMin: 70, ageMax: 200, excellent: 14, good: 10, average: 6, fair: 3  },
  ],
};

// 1-min Step Test (steps in 60 sec) — higher is better (sex/age generic)
const STEP_TEST_THRESHOLDS = {
  excellent: 115,
  good: 90,
  average: 70,
  fair: 50,
};

// Single-leg stand balance (seconds, eyes open) — higher is better
const BALANCE_THRESHOLDS = {
  excellent: 45,
  good: 20,
  average: 8,
  fair: 4,
};

// Resting HR (bpm) — lower is better
const RHR_THRESHOLDS = {
  excellent: 52,
  good: 62,
  average: 72,
  fair: 82,
};

// Dead-hang (seconds) — higher is better, used as grip proxy
const DEAD_HANG_THRESHOLDS = {
  excellent: 60,
  good: 30,
  average: 15,
  fair: 7,
};

// ─── Score conversion ─────────────────────────────────────────────────────────

export function categoryToScore(cat: FitnessCategory): number {
  switch (cat) {
    case "excellent": return 93;
    case "good":      return 75;
    case "average":   return 52;
    case "fair":      return 30;
    case "low":       return 10;
  }
}

function classifyHigher(value: number, thresholds: { excellent: number; good: number; average: number; fair: number }): FitnessCategory {
  if (value >= thresholds.excellent) return "excellent";
  if (value >= thresholds.good)      return "good";
  if (value >= thresholds.average)   return "average";
  if (value >= thresholds.fair)      return "fair";
  return "low";
}

function classifyLower(value: number, thresholds: { excellent: number; good: number; average: number; fair: number }): FitnessCategory {
  if (value <= thresholds.excellent) return "excellent";
  if (value <= thresholds.good)      return "good";
  if (value <= thresholds.average)   return "average";
  if (value <= thresholds.fair)      return "fair";
  return "low";
}

function normRow(table: NormRow[], age: number): NormRow {
  return table.find((r) => age >= r.ageMin && age <= r.ageMax) ?? table[table.length - 1];
}

// ─── Individual scorers ────────────────────────────────────────────────────────

export function scoreVO2max(value: number, profile: UserProfile): MetricScore {
  const row = normRow(VO2MAX_NORMS[profile.sex], profile.age);
  const category = classifyHigher(value, row);
  return { score: categoryToScore(category), category, value, unit: "mL/kg/min", hasData: true };
}

export function scoreGrip(value: number, unit: "kg" | "lb", profile: UserProfile): MetricScore {
  const kg = unit === "lb" ? value * 0.4536 : value;
  const row = normRow(GRIP_NORMS[profile.sex], profile.age);
  const category = classifyHigher(kg, row);
  return { score: categoryToScore(category), category, value, unit, hasData: true };
}

export function scoreDeadHang(seconds: number): MetricScore {
  const category = classifyHigher(seconds, DEAD_HANG_THRESHOLDS);
  return { score: categoryToScore(category), category, value: seconds, unit: "s", hasData: true };
}

export function scoreSitToStand(reps: number, profile: UserProfile): MetricScore {
  const row = normRow(SIT_TO_STAND_NORMS[profile.sex], profile.age);
  const category = classifyHigher(reps, row);
  return { score: categoryToScore(category), category, value: reps, unit: "reps", hasData: true };
}

export function scoreStepTest(steps: number): MetricScore {
  const category = classifyHigher(steps, STEP_TEST_THRESHOLDS);
  return { score: categoryToScore(category), category, value: steps, unit: "steps", hasData: true };
}

export function scoreBalance(seconds: number): MetricScore {
  const category = classifyHigher(seconds, BALANCE_THRESHOLDS);
  return { score: categoryToScore(category), category, value: seconds, unit: "s", hasData: true };
}

export function scoreRestingHR(bpm: number): MetricScore {
  const category = classifyLower(bpm, RHR_THRESHOLDS);
  return { score: categoryToScore(category), category, value: bpm, unit: "bpm", hasData: true };
}

// ─── FRS composite ────────────────────────────────────────────────────────────

const EMPTY_SCORE: MetricScore = { score: 0, category: "average", value: null, unit: "", hasData: false };

const WEIGHTS = {
  vo2max:    0.35,
  grip:      0.25,
  mobility:  0.20,
  balance:   0.10,
  restingHR: 0.10,
};

export function computeFRS(restingHR: number): FRSResult {
  const profile = loadProfile();
  const latest = getLatestCapacityResults();

  // VO2max
  const vo2maxRes = latest["vo2max"];
  const vo2max = vo2maxRes ? scoreVO2max(vo2maxRes.value, profile) : EMPTY_SCORE;

  // Grip (prefer grip-strength, fallback to dead-hang)
  let grip: MetricScore = EMPTY_SCORE;
  if (latest["grip-strength"]) {
    const r = latest["grip-strength"];
    grip = scoreGrip(r.value, r.unit === "lb" ? "lb" : "kg", profile);
  } else if (latest["dead-hang"]) {
    grip = scoreDeadHang(latest["dead-hang"].value);
  }

  // Mobility (average of sit-to-stand + step test)
  const stsRes = latest["sit-to-stand"];
  const stepRes = latest["step-test"];
  let mobility: MetricScore = EMPTY_SCORE;
  if (stsRes && stepRes) {
    const sts = scoreSitToStand(stsRes.value, profile);
    const step = scoreStepTest(stepRes.value);
    const avgScore = Math.round((sts.score + step.score) / 2);
    const avgCat = sts.score >= step.score ? sts.category : step.category;
    mobility = { score: avgScore, category: avgCat, value: null, unit: "", hasData: true };
  } else if (stsRes) {
    mobility = scoreSitToStand(stsRes.value, profile);
  } else if (stepRes) {
    mobility = scoreStepTest(stepRes.value);
  }

  // Balance
  const balRes = latest["balance"];
  const balance = balRes ? scoreBalance(balRes.value) : EMPTY_SCORE;

  // Resting HR
  const restingHRScore = scoreRestingHR(restingHR);

  // Weighted FRS
  let totalWeight = 0;
  let weightedSum = 0;
  const pairs: [MetricScore, number][] = [
    [vo2max, WEIGHTS.vo2max],
    [grip, WEIGHTS.grip],
    [mobility, WEIGHTS.mobility],
    [balance, WEIGHTS.balance],
    [restingHRScore, WEIGHTS.restingHR],
  ];

  for (const [ms, w] of pairs) {
    if (ms.hasData) {
      totalWeight += w;
      weightedSum += ms.score * w;
    }
  }

  const frs = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  const hasData = totalWeight > 0;
  const frsBand = getFRSBand(frs);

  return { frs, frsBand, vo2max, grip, mobility, balance, restingHR: restingHRScore, hasData };
}

export function getFRSBand(score: number): FRSBand {
  if (score >= 80) return "high-reserve";
  if (score >= 60) return "good";
  if (score >= 40) return "reduced";
  return "low-reserve";
}

export const FRS_BAND_LABELS: Record<FRSBand, string> = {
  "high-reserve": "High Reserve",
  "good":         "Good",
  "reduced":      "Reduced",
  "low-reserve":  "Low Reserve",
};

export const FRS_BAND_COLORS: Record<FRSBand, string> = {
  "high-reserve": "#10b981",
  "good":         "#22d3ee",
  "reduced":      "#f59e0b",
  "low-reserve":  "#ef4444",
};

export function categoryColor(cat: FitnessCategory): string {
  switch (cat) {
    case "excellent": return "text-emerald-600 dark:text-emerald-400";
    case "good":      return "text-sky-600 dark:text-sky-400";
    case "average":   return "text-amber-600 dark:text-amber-400";
    case "fair":      return "text-orange-600 dark:text-orange-400";
    case "low":       return "text-red-600 dark:text-red-400";
  }
}

export function categoryBg(cat: FitnessCategory): string {
  switch (cat) {
    case "excellent": return "bg-emerald-100 dark:bg-emerald-900/30";
    case "good":      return "bg-sky-100 dark:bg-sky-900/30";
    case "average":   return "bg-amber-100 dark:bg-amber-900/30";
    case "fair":      return "bg-orange-100 dark:bg-orange-900/30";
    case "low":       return "bg-red-100 dark:bg-red-900/30";
  }
}

export const CATEGORY_LABELS: Record<FitnessCategory, string> = {
  excellent: "Excellent",
  good:      "Good",
  average:   "Average",
  fair:      "Fair",
  low:       "Low",
};

/** Approximate population percentile label for a fitness category.
 *  Based on ACSM / Cooper Institute population distributions. */
export function categoryToPercentileLabel(cat: FitnessCategory): string {
  switch (cat) {
    case "excellent": return "Top ~15%";
    case "good":      return "Top ~35%";
    case "average":   return "~50th pct";
    case "fair":      return "~Bottom 35%";
    case "low":       return "~Bottom 15%";
  }
}

/** Age/sex-specific threshold row for each metric, for the user's current profile.
 *  Used by the Reference page to render personalised normative tables. */
export interface MetricNorms {
  vo2max:     { excellent: number; good: number; average: number; fair: number };
  grip:       { excellent: number; good: number; average: number; fair: number };
  sitToStand: { excellent: number; good: number; average: number; fair: number };
  stepTest:   { excellent: number; good: number; average: number; fair: number };
  balance:    { excellent: number; good: number; average: number; fair: number };
  restingHR:  { excellent: number; good: number; average: number; fair: number };
}

export function getMetricNormsForProfile(profile: UserProfile): MetricNorms {
  return {
    vo2max:     normRow(VO2MAX_NORMS[profile.sex], profile.age),
    grip:       normRow(GRIP_NORMS[profile.sex], profile.age),
    sitToStand: normRow(SIT_TO_STAND_NORMS[profile.sex], profile.age),
    stepTest:   STEP_TEST_THRESHOLDS,
    balance:    BALANCE_THRESHOLDS,
    restingHR:  RHR_THRESHOLDS,
  };
}

// ─── Coaching ──────────────────────────────────────────────────────────────────

export interface CapacityCoachingItem {
  title: string;
  description: string;
  priority: "high" | "moderate";
  category: "Exercise" | "Nutrition" | "Recovery";
}

export function getCapacityCoaching(frsResult: FRSResult): CapacityCoachingItem[] {
  const tips: CapacityCoachingItem[] = [];

  if (frsResult.vo2max.hasData && (frsResult.vo2max.category === "fair" || frsResult.vo2max.category === "low" || frsResult.vo2max.category === "average")) {
    tips.push({
      title: "Build Zone 2 aerobic base",
      description: "VO2max is the strongest single predictor of all-cause mortality. Target 150–180 min/week at conversational pace (65–75% HRmax). Each 3.5 mL/kg/min improvement ≈ 15% mortality risk reduction.",
      priority: frsResult.vo2max.category === "low" || frsResult.vo2max.category === "fair" ? "high" : "moderate",
      category: "Exercise",
    });
  }

  if (frsResult.grip.hasData && (frsResult.grip.category === "fair" || frsResult.grip.category === "low")) {
    tips.push({
      title: "Progressive resistance training",
      description: "Low grip strength is a powerful predictor of frailty, hospitalisation, and early mortality. Add compound strength work 2–3×/week: deadlifts, rows, farmer's carries, and loaded carries. Grip improves with any pulling movement.",
      priority: "high",
      category: "Exercise",
    });
  } else if (frsResult.grip.hasData && frsResult.grip.category === "average") {
    tips.push({
      title: "Add loaded carries and pulling",
      description: "Grip and overall strength are trainable at any age. Farmer's carries, pull-ups/rows, and deadlift variations improve grip and full-body force production. Maintain progressive overload.",
      priority: "moderate",
      category: "Exercise",
    });
  }

  if (frsResult.mobility.hasData && (frsResult.mobility.category === "fair" || frsResult.mobility.category === "low")) {
    tips.push({
      title: "Daily mobility and movement",
      description: "Low sit-to-stand capacity predicts functional decline and fall risk. Practise bodyweight squats, lunges, and get-ups daily. Target 5–10 minutes of intentional mobility each morning.",
      priority: "high",
      category: "Exercise",
    });
  }

  if (frsResult.balance.hasData && (frsResult.balance.category === "fair" || frsResult.balance.category === "low")) {
    tips.push({
      title: "Balance and proprioception training",
      description: "Single-leg stand <10s is a significant fall-risk marker. Practice single-leg standing (eyes open, then closed), single-leg deadlifts, and heel-to-toe walking. Start with 3×30s each leg daily.",
      priority: frsResult.balance.category === "low" ? "high" : "moderate",
      category: "Exercise",
    });
  }

  if (frsResult.frs < 50) {
    tips.push({
      title: "Prioritise protein intake (≥1.6g/kg body weight)",
      description: "Low functional reserve often correlates with insufficient dietary protein. Adequate protein (1.6–2.2g/kg/day) combined with resistance training is the most evidence-based strategy for building and preserving functional capacity.",
      priority: "high",
      category: "Nutrition",
    });
  }

  if (frsResult.restingHR.hasData && (frsResult.restingHR.category === "fair" || frsResult.restingHR.category === "low")) {
    tips.push({
      title: "Improve cardiovascular recovery",
      description: "Elevated resting HR reflects low parasympathetic tone and cardiovascular fitness. Zone 2 aerobic training is the most evidence-based intervention — it lowers resting HR by 5–10 bpm over 8–16 weeks.",
      priority: "moderate",
      category: "Recovery",
    });
  }

  if (tips.length === 0) {
    tips.push({
      title: "Maintain your functional reserve",
      description: "Your scores are solid. Focus on progressive overload in strength training, maintaining zone 2 volume, and prioritising sleep quality to protect what you've built.",
      priority: "moderate",
      category: "Exercise",
    });
  }

  return tips.slice(0, 5);
}
