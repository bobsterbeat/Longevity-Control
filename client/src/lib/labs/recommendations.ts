import { type BiomarkerScore, type LBSResult, scoreBiomarker } from "./scoring";
import { getBiomarker, BIOMARKERS } from "./biomarkers";
import { getLatestResults } from "./store";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActionCategory = "Diet" | "Exercise" | "Supplements" | "Sleep" | "Medical";

export interface CoachingAction {
  id: string;
  title: string;
  description: string;
  priority: "critical" | "high" | "moderate";
  category: ActionCategory;
  linkedBiomarkers: string[];   // biomarker IDs
  expectedImpact: string;       // brief statement of expected change
}

// ─── Action Library ───────────────────────────────────────────────────────────

const ACTION_LIBRARY: CoachingAction[] = [
  // ── Diet
  {
    id: "reduce-refined-carbs",
    title: "Reduce refined carbohydrates",
    description: "Replace white bread, pasta, rice, and sugary foods with whole grains, legumes, and non-starchy vegetables. Target <100g refined carbs/day.",
    priority: "high",
    category: "Diet",
    linkedBiomarkers: ["hba1c", "fasting-insulin", "tg", "tg-hdl-ratio"],
    expectedImpact: "Lower HbA1c by 0.2–0.5%, reduce TG 15–25%, improve insulin sensitivity",
  },
  {
    id: "eliminate-fructose",
    title: "Eliminate sugar-sweetened beverages and juice",
    description: "Fructose uniquely drives TG, insulin resistance, ALT elevation, and uric acid via hepatic AMP deaminase. Replace with water, sparkling water, or unsweetened tea.",
    priority: "critical",
    category: "Diet",
    linkedBiomarkers: ["tg", "fasting-insulin", "alt", "uric-acid"],
    expectedImpact: "TG may drop 20–30% within 4–6 weeks; ALT and uric acid improve over 3 months",
  },
  {
    id: "mediterranean-diet",
    title: "Adopt a Mediterranean dietary pattern",
    description: "Emphasise extra-virgin olive oil, oily fish (salmon, sardines), colourful vegetables, legumes, nuts, and limited red meat. This pattern has the most evidence across all longevity biomarkers.",
    priority: "high",
    category: "Diet",
    linkedBiomarkers: ["hs-crp", "apob", "tg", "hdl", "alt"],
    expectedImpact: "Reduces hs-CRP 20–30%, improves TG/HDL ratio, modestly lowers ApoB",
  },
  {
    id: "increase-dietary-fibre",
    title: "Increase soluble fibre intake",
    description: "Beta-glucan (oats, barley), psyllium, and legumes reduce LDL-C and ApoB through bile acid sequestration. Target 30–40g total fibre/day.",
    priority: "moderate",
    category: "Diet",
    linkedBiomarkers: ["apob", "tg"],
    expectedImpact: "ApoB may reduce 5–10% with 10–15g/day soluble fibre",
  },
  {
    id: "limit-alcohol",
    title: "Limit or eliminate alcohol",
    description: "Alcohol raises TG, elevates ALT, elevates hs-CRP, raises uric acid, and impairs sleep quality. Even moderate intake can meaningfully worsen longevity biomarkers.",
    priority: "high",
    category: "Diet",
    linkedBiomarkers: ["hs-crp", "alt", "tg", "uric-acid"],
    expectedImpact: "ALT normalises within 4–8 weeks; TG improves within weeks",
  },
  {
    id: "increase-omega3",
    title: "Increase dietary omega-3 sources",
    description: "Eat oily fish (salmon, mackerel, sardines) 3–4×/week or supplement with EPA+DHA ≥2g/day. Most potent dietary intervention for TG reduction.",
    priority: "moderate",
    category: "Diet",
    linkedBiomarkers: ["tg", "hs-crp"],
    expectedImpact: "TG reduction 20–30% at ≥2g EPA+DHA; modest hs-CRP reduction",
  },
  {
    id: "time-restricted-eating",
    title: "Implement time-restricted eating (8–10h window)",
    description: "Confine eating to an 8–10 hour window aligned with daylight hours. Reduces insulin secretion pulses, improves fasting insulin, and supports circadian metabolic regulation.",
    priority: "moderate",
    category: "Diet",
    linkedBiomarkers: ["fasting-insulin", "hba1c", "tg"],
    expectedImpact: "Fasting insulin may drop 1–3 µIU/mL over 8–12 weeks",
  },
  {
    id: "reduce-purine-fructose",
    title: "Reduce purine-rich foods and fructose for uric acid",
    description: "Limit organ meats, anchovies, sardines, beer, and all fructose sources (especially HFCS and fruit juice). Whole fruit is acceptable due to fibre co-presence.",
    priority: "moderate",
    category: "Diet",
    linkedBiomarkers: ["uric-acid"],
    expectedImpact: "Uric acid may drop 0.5–1.0 mg/dL within 4–8 weeks",
  },
  {
    id: "methylated-b-vitamins",
    title: "Add methylated B vitamins for homocysteine",
    description: "Methylcobalamin (B12 1mg/day), methylfolate (L-5-MTHF 400–800µg/day), and pyridoxal-5-phosphate (B6 25–50mg/day). Use methylated forms especially if MTHFR status is unknown.",
    priority: "high",
    category: "Supplements",
    linkedBiomarkers: ["homocysteine"],
    expectedImpact: "Homocysteine reduction of 3–5 µmol/L within 8–12 weeks in deficient individuals",
  },

  // ── Exercise
  {
    id: "zone2-aerobic",
    title: "Build Zone 2 aerobic exercise base",
    description: "150–180 min/week of sustained moderate-intensity cardio (conversational pace, ~65–75% HRmax). This is the single most impactful lifestyle intervention for metabolic biomarker improvement.",
    priority: "critical",
    category: "Exercise",
    linkedBiomarkers: ["hs-crp", "hba1c", "fasting-insulin", "tg", "hdl", "alt"],
    expectedImpact: "Improves nearly all longevity biomarkers — most potent available lifestyle intervention",
  },
  {
    id: "resistance-training",
    title: "Add resistance training 2–3×/week",
    description: "Progressive overload (3–4 sets per muscle group, 8–12 rep range). Builds metabolically active muscle — a 'glucose disposal' organ that improves insulin sensitivity independently of cardio.",
    priority: "high",
    category: "Exercise",
    linkedBiomarkers: ["hba1c", "fasting-insulin", "tg-hdl-ratio"],
    expectedImpact: "Improves insulin sensitivity and glucose disposal; may reduce HbA1c 0.1–0.3% with consistency",
  },
  {
    id: "reduce-sedentary-time",
    title: "Break up prolonged sitting every 60–90 minutes",
    description: "Brief movement breaks (5–10 min walk, bodyweight exercises) meaningfully reduce postprandial glucose spikes and vascular inflammation independent of total exercise volume.",
    priority: "moderate",
    category: "Exercise",
    linkedBiomarkers: ["hs-crp", "hba1c", "fasting-insulin"],
    expectedImpact: "Reduces postprandial glucose excursions; independently reduces chronic inflammation",
  },

  // ── Sleep
  {
    id: "sleep-consistency",
    title: "Consistent sleep-wake timing (±30 min, 7 days)",
    description: "Sleep consistency is as important as duration. Variable sleep timing disrupts cortisol rhythms, impairs glucose metabolism, and elevates inflammatory markers. Fix your wake time first.",
    priority: "high",
    category: "Sleep",
    linkedBiomarkers: ["hs-crp", "hba1c", "fasting-insulin"],
    expectedImpact: "Consistent sleep reduces hs-CRP by 15–20% and improves glucose metabolism over 4–8 weeks",
  },
  {
    id: "sleep-duration",
    title: "Target 7–9 hours total sleep time",
    description: "Chronic sleep restriction (<7h) elevates IL-6 and hs-CRP, impairs insulin sensitivity, and accelerates HbA1c. Prioritise earlier bedtimes over sleeping in.",
    priority: "high",
    category: "Sleep",
    linkedBiomarkers: ["hs-crp", "hba1c", "fasting-insulin"],
    expectedImpact: "Each additional hour of sleep from <6h to 7–8h is associated with 10–15% lower hs-CRP",
  },

  // ── Supplements
  {
    id: "omega3-supplement",
    title: "Supplement EPA+DHA omega-3 (≥2g/day)",
    description: "High-quality fish oil or algal DHA+EPA. Most evidence for TG reduction exists at ≥2g combined EPA+DHA/day. Prescription-grade icosapent ethyl (Vascepa) at 4g/day has cardiovascular outcome data.",
    priority: "moderate",
    category: "Supplements",
    linkedBiomarkers: ["tg", "hs-crp"],
    expectedImpact: "TG reduction 20–30% at ≥3g EPA+DHA; modest hs-CRP reduction over 8–12 weeks",
  },
  {
    id: "vitamin-d-supplement",
    title: "Supplement Vitamin D3 (2,000–5,000 IU/day) + K2",
    description: "Supplement based on your tested 25-OH-D level. Target 40–70 ng/mL. Always combine with Vitamin K2 (MK-7, 100–200µg/day) to optimise calcium routing to bones rather than arteries.",
    priority: "high",
    category: "Supplements",
    linkedBiomarkers: ["vitamin-d"],
    expectedImpact: "Restores optimal Vitamin D status, supports immune regulation and anti-inflammatory gene expression",
  },
  {
    id: "hydration-uric-acid",
    title: "Increase hydration (2.5–3L water/day)",
    description: "Adequate hydration is the most immediate and accessible intervention to reduce uric acid via increased renal excretion. Especially important if taking diuretics or exercising heavily.",
    priority: "moderate",
    category: "Diet",
    linkedBiomarkers: ["uric-acid", "creatinine", "egfr"],
    expectedImpact: "Uric acid may drop 0.3–0.5 mg/dL with sustained hydration improvement",
  },

  // ── Medical
  {
    id: "medical-apob",
    title: "Discuss ApoB-lowering medication with your physician",
    description: "If ApoB remains ≥100 mg/dL despite 6+ months of lifestyle optimisation, discuss statin therapy or PCSK9 inhibitors. ApoB is a stronger predictor of ASCVD risk than LDL-C.",
    priority: "high",
    category: "Medical",
    linkedBiomarkers: ["apob"],
    expectedImpact: "Statins reduce ApoB 30–60%; PCSK9 inhibitors 50–70% on top of statins",
  },
  {
    id: "medical-lpa",
    title: "Flag elevated Lp(a) to your cardiologist",
    description: "Lp(a) >125 nmol/L is largely genetic and not amenable to lifestyle change. Intensify all other modifiable risk factor management. RNA therapies (olpasiran) in late Phase 3 trials — discuss with specialist.",
    priority: "high",
    category: "Medical",
    linkedBiomarkers: ["lpa"],
    expectedImpact: "Awareness and risk stratification; ensures other modifiable risk factors are maximally optimised",
  },
  {
    id: "blood-pressure-egfr",
    title: "Optimise blood pressure for kidney protection",
    description: "Hypertension is the primary driver of CKD progression. Target BP <120/80 mmHg (or ≤130/80 in CKD). ACE inhibitors and ARBs have specific kidney-protective effects beyond BP reduction.",
    priority: "critical",
    category: "Medical",
    linkedBiomarkers: ["egfr", "creatinine"],
    expectedImpact: "BP control is the most evidence-based intervention to slow eGFR decline",
  },
  {
    id: "hepatitis-screen",
    title: "Screen for viral hepatitis if ALT remains elevated",
    description: "Persistent ALT elevation despite lifestyle improvement warrants hepatitis B and C serology, and MASLD assessment. Early detection is critical for outcome.",
    priority: "moderate",
    category: "Medical",
    linkedBiomarkers: ["alt"],
    expectedImpact: "Rules out treatable causes; guides targeted intervention",
  },
];

// ─── Recommendation Engine ────────────────────────────────────────────────────

export function getRecommendations(lbsResult: LBSResult): CoachingAction[] {
  const latest = getLatestResults();
  const latestValues: Record<string, number> = {};
  for (const [id, rec] of Object.entries(latest)) {
    latestValues[id] = rec.value;
  }

  // Compute TG/HDL
  const tg = latestValues["tg"];
  const hdl = latestValues["hdl"];
  if (tg != null && hdl != null && hdl > 0) {
    latestValues["tg-hdl-ratio"] = tg / hdl;
  }

  // Build a set of flagged / borderline biomarkers
  const flagged = new Set<string>();
  const borderline = new Set<string>();

  for (const def of BIOMARKERS) {
    if (def.isComputed) continue;
    const val = latestValues[def.id];
    if (val == null) continue;
    const bs = scoreBiomarker(def, val);
    if (bs.band === "flag") flagged.add(def.id);
    else if (bs.band === "borderline") borderline.add(def.id);
  }
  // Check TG/HDL ratio
  const tgHdlVal = latestValues["tg-hdl-ratio"];
  if (tgHdlVal != null) {
    const tgHdlDef = BIOMARKERS.find((b) => b.id === "tg-hdl-ratio");
    if (tgHdlDef) {
      const bs = scoreBiomarker(tgHdlDef, tgHdlVal);
      if (bs.band === "flag") flagged.add("tg-hdl-ratio");
      else if (bs.band === "borderline") borderline.add("tg-hdl-ratio");
    }
  }

  // Score each action by relevance
  const scored = ACTION_LIBRARY.map((action) => {
    let relevanceScore = 0;

    for (const bioId of action.linkedBiomarkers) {
      if (flagged.has(bioId)) relevanceScore += 4;
      else if (borderline.has(bioId)) relevanceScore += 2;
    }

    // Boost critical actions
    if (action.priority === "critical") relevanceScore += 2;
    else if (action.priority === "high") relevanceScore += 1;

    return { action, relevanceScore };
  });

  // Sort by relevance, filter >0, take top 8
  return scored
    .filter((s) => s.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 8)
    .map((s) => s.action);
}

export function priorityColor(priority: CoachingAction["priority"]): string {
  switch (priority) {
    case "critical": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
    case "high":     return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
    case "moderate": return "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300";
  }
}

export function categoryIcon(category: ActionCategory): string {
  switch (category) {
    case "Diet":        return "🥗";
    case "Exercise":    return "🏃";
    case "Supplements": return "💊";
    case "Sleep":       return "😴";
    case "Medical":     return "🏥";
  }
}
