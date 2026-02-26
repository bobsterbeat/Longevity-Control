import {
  BIOMARKERS,
  CATEGORY_WEIGHTS,
  type BiomarkerDefinition,
  type BiomarkerCategory,
  type ScoringConfig,
} from "./biomarkers";
import { getLatestResults, type LabResult } from "./store";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BiomarkerScore {
  biomarkerId: string;
  value: number;
  score: number;     // 0–100
  band: "ideal" | "acceptable" | "borderline" | "flag";
}

export interface CategoryScore {
  category: BiomarkerCategory;
  score: number;     // 0–100 (weighted within category)
  biomarkerScores: BiomarkerScore[];
}

export interface LBSResult {
  lbs: number;       // 0–100 overall Longevity Biology Score
  categories: Record<BiomarkerCategory, CategoryScore>;
  hasData: boolean;
}

// ─── Single-biomarker scoring ─────────────────────────────────────────────────

export function scoreBiomarker(def: BiomarkerDefinition, value: number): BiomarkerScore {
  const cfg = def.scoring;
  let score: number;
  let band: BiomarkerScore["band"];

  if (cfg.type === "lower") {
    if (value <= cfg.ideal) {
      score = 100;
      band = "ideal";
    } else if (value <= cfg.acceptable) {
      // linear 100 → 75
      const t = (value - cfg.ideal) / (cfg.acceptable - cfg.ideal);
      score = 100 - t * 25;
      band = "acceptable";
    } else if (value <= cfg.flag) {
      // linear 75 → 40
      const t = (value - cfg.acceptable) / (cfg.flag - cfg.acceptable);
      score = 75 - t * 35;
      band = "borderline";
    } else {
      // linear 40 → 0 at 2× flag
      const ceiling = cfg.flag * 2;
      const t = Math.min((value - cfg.flag) / (ceiling - cfg.flag), 1);
      score = 40 - t * 40;
      band = "flag";
    }
  } else if (cfg.type === "higher") {
    if (value >= cfg.ideal) {
      score = 100;
      band = "ideal";
    } else if (value >= cfg.acceptable) {
      const t = (cfg.ideal - value) / (cfg.ideal - cfg.acceptable);
      score = 100 - t * 25;
      band = "acceptable";
    } else if (value >= cfg.flag) {
      const t = (cfg.acceptable - value) / (cfg.acceptable - cfg.flag);
      score = 75 - t * 35;
      band = "borderline";
    } else {
      const floor = cfg.flag * 0.5;
      const t = Math.min((cfg.flag - value) / (cfg.flag - floor), 1);
      score = 40 - t * 40;
      band = "flag";
    }
  } else {
    // range
    const idealMin = cfg.idealMin ?? cfg.ideal;
    const idealMax = cfg.idealMax ?? cfg.ideal;
    const accMin = cfg.acceptableMin ?? cfg.acceptable;
    const accMax = cfg.acceptableMax ?? cfg.acceptable;

    if (value >= idealMin && value <= idealMax) {
      score = 100;
      band = "ideal";
    } else if (value >= accMin && value <= accMax) {
      // distance from ideal band edges
      const distFromIdeal = value < idealMin ? idealMin - value : value - idealMax;
      const rangeLow = idealMin - accMin;
      const rangeHigh = accMax - idealMax;
      const maxDist = value < idealMin ? rangeLow : rangeHigh;
      const t = maxDist > 0 ? distFromIdeal / maxDist : 0;
      score = 100 - t * 25;
      band = "acceptable";
    } else {
      // outside acceptable — how far out?
      const distOut = value < accMin ? accMin - value : value - accMax;
      const rangeWidth = accMax - accMin;
      const t = Math.min(distOut / (rangeWidth * 0.5), 1);
      score = Math.max(0, 75 - t * 75);
      band = score > 40 ? "borderline" : "flag";
    }
  }

  return { biomarkerId: def.id, value, score: Math.round(Math.max(0, Math.min(100, score))), band };
}

// ─── Computed biomarkers ──────────────────────────────────────────────────────

function computeValue(
  def: BiomarkerDefinition,
  latestValues: Record<string, number>
): number | null {
  if (!def.isComputed || !def.computedFrom) return latestValues[def.id] ?? null;

  if (def.id === "tg-hdl-ratio") {
    const tg = latestValues["tg"];
    const hdl = latestValues["hdl"];
    if (tg == null || hdl == null || hdl === 0) return null;
    return parseFloat((tg / hdl).toFixed(2));
  }
  return null;
}

// ─── LBS ─────────────────────────────────────────────────────────────────────

export function computeLBS(): LBSResult {
  const latestRecords = getLatestResults();
  const latestValues: Record<string, number> = {};
  for (const [id, rec] of Object.entries(latestRecords)) {
    latestValues[id] = rec.value;
  }

  const categories: Record<BiomarkerCategory, CategoryScore> = {
    inflammation: { category: "inflammation", score: 0, biomarkerScores: [] },
    metabolic: { category: "metabolic", score: 0, biomarkerScores: [] },
    cardiovascular: { category: "cardiovascular", score: 0, biomarkerScores: [] },
    organ: { category: "organ", score: 0, biomarkerScores: [] },
  };

  // Score each weighted biomarker
  let totalWeight = 0;
  let weightedSum = 0;
  let hasData = false;

  for (const def of BIOMARKERS) {
    const weight = def.lbsWeight ?? 0;
    if (weight === 0) continue; // not part of LBS

    const value = computeValue(def, latestValues);
    if (value == null) continue;

    hasData = true;
    const bs = scoreBiomarker(def, value);
    categories[def.category].biomarkerScores.push(bs);
    totalWeight += weight;
    weightedSum += bs.score * weight;
  }

  // Also score non-LBS biomarkers for display purposes
  for (const def of BIOMARKERS) {
    if ((def.lbsWeight ?? 0) > 0) continue; // already done
    const value = computeValue(def, latestValues);
    if (value == null) continue;
    const bs = scoreBiomarker(def, value);
    categories[def.category].biomarkerScores.push(bs);
  }

  // Compute category scores as simple average of member scores (for display)
  for (const cat of Object.values(categories)) {
    if (cat.biomarkerScores.length === 0) {
      cat.score = 0;
    } else {
      cat.score = Math.round(
        cat.biomarkerScores.reduce((sum, b) => sum + b.score, 0) / cat.biomarkerScores.length
      );
    }
  }

  const lbs = totalWeight > 0
    ? Math.round(weightedSum / totalWeight)
    : 0;

  return { lbs, categories, hasData };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function bandColor(band: BiomarkerScore["band"]): string {
  switch (band) {
    case "ideal":      return "text-emerald-600 dark:text-emerald-400";
    case "acceptable": return "text-sky-600 dark:text-sky-400";
    case "borderline": return "text-amber-600 dark:text-amber-400";
    case "flag":       return "text-red-600 dark:text-red-400";
  }
}

export function bandBg(band: BiomarkerScore["band"]): string {
  switch (band) {
    case "ideal":      return "bg-emerald-100 dark:bg-emerald-900/30";
    case "acceptable": return "bg-sky-100 dark:bg-sky-900/30";
    case "borderline": return "bg-amber-100 dark:bg-amber-900/30";
    case "flag":       return "bg-red-100 dark:bg-red-900/30";
  }
}

export function bandLabel(band: BiomarkerScore["band"]): string {
  switch (band) {
    case "ideal":      return "Optimal";
    case "acceptable": return "Acceptable";
    case "borderline": return "Borderline";
    case "flag":       return "Elevated";
  }
}

export function lbsColor(score: number): string {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-sky-600 dark:text-sky-400";
  if (score >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export function lbsLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 50) return "Fair";
  if (score >= 35) return "Needs Work";
  return "Attention Needed";
}
