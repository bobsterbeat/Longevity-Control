import { DailyMetrics, PAS_WEIGHTS } from "@shared/schema";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalize(value: number, min: number, max: number): number {
  return clamp(((value - min) / (max - min)) * 100, 0, 100);
}

export function getBaseline(metrics: DailyMetrics[], field: keyof DailyMetrics, days = 21): number {
  const recent = metrics.slice(-days);
  const values = recent
    .map((m) => m[field])
    .filter((v): v is number => typeof v === "number");
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function computeRecoverySubscore(today: DailyMetrics, hrvBaseline: number, hrBaseline: number): number {
  const hrvDeviation = hrvBaseline > 0 ? ((hrvBaseline - today.hrv) / hrvBaseline) * 100 : 50;
  const hrvScore = clamp(50 + hrvDeviation * 2, 0, 100);

  const hrDeviation = hrBaseline > 0 ? ((today.restingHR - hrBaseline) / hrBaseline) * 100 : 50;
  const hrScore = clamp(50 + hrDeviation * 3, 0, 100);

  const sleepScore = today.sleepHours >= 8 ? 0 :
    today.sleepHours >= 7 ? 15 :
    today.sleepHours >= 6 ? 40 :
    today.sleepHours >= 5 ? 65 : 90;

  const regularityScore = 100 - today.sleepRegularityScore;

  return (hrvScore * 0.35 + hrScore * 0.20 + sleepScore * 0.25 + regularityScore * 0.20);
}

function computeMetabolicSubscore(today: DailyMetrics): number {
  const glucoseSpike = today.glucoseSpikeScore ?? 30;
  const lateEating = today.lateEating ? 60 : 0;
  const fastingGlucoseScore = today.fastingGlucose
    ? normalize(today.fastingGlucose, 70, 130)
    : 30;

  return glucoseSpike * 0.40 + lateEating * 0.30 + fastingGlucoseScore * 0.30;
}

function computeFitnessProtection(today: DailyMetrics): number {
  const vo2maxScore = 100 - normalize(today.vo2max, 25, 55);
  const zone2Score = 100 - normalize(today.zone2Minutes, 0, 45);
  const strengthScore = today.strengthSessions ? 0 : 60;

  return vo2maxScore * 0.40 + zone2Score * 0.35 + strengthScore * 0.25;
}

function computeInflammatoryBehaviors(today: DailyMetrics): number {
  const alcoholScore = normalize(today.alcoholDrinks, 0, 4);
  const sleepDebt = today.sleepHours < 7 ? normalize(7 - today.sleepHours, 0, 3) : 0;

  return alcoholScore * 0.50 + sleepDebt * 0.50;
}

function computeEnvironmentalLoad(today: DailyMetrics): number {
  return normalize(today.aqi, 0, 200);
}

export function computeDailyPAS(
  today: DailyMetrics,
  allMetrics: DailyMetrics[]
): number {
  const hrvBaseline = getBaseline(allMetrics, "hrv");
  const hrBaseline = getBaseline(allMetrics, "restingHR");

  const recovery = computeRecoverySubscore(today, hrvBaseline, hrBaseline);
  const metabolic = computeMetabolicSubscore(today);
  const fitness = computeFitnessProtection(today);
  const inflammatory = computeInflammatoryBehaviors(today);
  const environmental = computeEnvironmentalLoad(today);

  const pas =
    recovery * PAS_WEIGHTS.recovery +
    metabolic * PAS_WEIGHTS.metabolic +
    fitness * PAS_WEIGHTS.fitness +
    inflammatory * PAS_WEIGHTS.inflammatory +
    environmental * PAS_WEIGHTS.environmental;

  return Math.round(clamp(pas, 0, 100));
}

export function computeRollingPAS(
  metrics: DailyMetrics[],
  windowDays = 7
): number {
  if (metrics.length === 0) return 50;
  const window = metrics.slice(-windowDays);
  const scores = window.map((m) => computeDailyPAS(m, metrics));
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export function computeILI(today: DailyMetrics, allMetrics: DailyMetrics[]): number {
  const hrvBaseline = getBaseline(allMetrics, "hrv");
  const hrvContrib = hrvBaseline > 0
    ? clamp(((hrvBaseline - today.hrv) / hrvBaseline) * 150, 0, 100)
    : 40;

  const sleepDisruption = today.sleepHours < 7
    ? normalize(7 - today.sleepHours, 0, 3)
    : 0;

  const glucoseSpikes = today.glucoseSpikeScore ?? 25;

  const alcoholLoad = normalize(today.alcoholDrinks, 0, 4);

  const aqiLoad = normalize(today.aqi, 0, 200);

  const ili =
    hrvContrib * 0.25 +
    sleepDisruption * 0.25 +
    glucoseSpikes * 0.20 +
    alcoholLoad * 0.15 +
    aqiLoad * 0.15;

  return Math.round(clamp(ili, 0, 100));
}

export function getPASLabel(pas: number): { text: string; color: string } {
  if (pas <= 30) return { text: "Slow", color: "text-emerald-500" };
  if (pas <= 55) return { text: "Moderate", color: "text-amber-500" };
  return { text: "Fast", color: "text-red-500" };
}

export function getPASTrend(pasHistory: number[], days = 14): "improving" | "stable" | "worsening" {
  if (pasHistory.length < days) return "stable";
  const recent = pasHistory.slice(-days);
  const firstHalf = recent.slice(0, Math.floor(days / 2));
  const secondHalf = recent.slice(Math.floor(days / 2));
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const diff = secondAvg - firstAvg;
  if (diff > 5) return "worsening";
  if (diff < -5) return "improving";
  return "stable";
}

export function computeSubscores(today: DailyMetrics, allMetrics: DailyMetrics[]) {
  const hrvBaseline = getBaseline(allMetrics, "hrv");
  const hrBaseline = getBaseline(allMetrics, "restingHR");
  return {
    recovery: Math.round(computeRecoverySubscore(today, hrvBaseline, hrBaseline)),
    metabolic: Math.round(computeMetabolicSubscore(today)),
    fitness: Math.round(computeFitnessProtection(today)),
    inflammatory: Math.round(computeInflammatoryBehaviors(today)),
    environmental: Math.round(computeEnvironmentalLoad(today)),
  };
}
