import type { DailyMetrics } from "@shared/schema";

// ─── Types ───────────────────────────────────────────────────────────────────

export type EvidenceLevel = "High" | "Moderate" | "Low";
export type EvidenceColor = "green" | "yellow" | "orange";
export type SupplementTiming = "AM" | "PM" | "bedtime" | "with-meals" | "pre-exercise";
export type SupplementGroup = "stack" | "conditional" | "experimental";

export const evidenceLevelToColor: Record<EvidenceLevel, EvidenceColor> = {
  High: "green",
  Moderate: "yellow",
  Low: "orange",
};

export interface SupplementData {
  id: string;
  name: string;
  shortName: string;
  category: string;
  mechanisms: string[];
  dose: string;
  timing: SupplementTiming;
  timingNote: string;
  onset: string;
  evidenceLevel: EvidenceLevel;
  evidenceNote: string;
  triggers: string[];
  avoidIf: string[];
  safetyBadges: string[];
  sideEffects: string[];
  interactions: string[];
  group: SupplementGroup;
}

export interface RankedSupplement extends SupplementData {
  score: number;
  rationale: string[];
}

export type ModalityStatusLevel = "recommended" | "caution" | "hold";

export interface ModalityStatus {
  id: string;
  name: string;
  icon: "cold" | "heat";
  status: ModalityStatusLevel;
  reason: string;
  protocol: string;
  mechanisms: string[];
  evidenceNote: string;
}

// ─── Supplement Data ─────────────────────────────────────────────────────────

export const SUPPLEMENTS: SupplementData[] = [
  {
    id: "glycine",
    name: "Glycine",
    shortName: "Glycine",
    category: "Neuro / Sleep",
    mechanisms: [
      "Lowers core body temperature via peripheral vasodilation — promotes sleep onset",
      "NMDA receptor co-agonist; improves slow-wave sleep architecture",
      "Inhibitory neurotransmitter in brainstem (glycine receptors) — reduces arousal",
    ],
    dose: "3g powder or capsules",
    timing: "bedtime",
    timingNote: "30 min before bed. If waking at 3–4am, keep 1g by bedside — glycine can be taken mid-night.",
    onset: "2–5 nights for subjective sleep quality",
    evidenceLevel: "High",
    evidenceNote:
      "Multiple RCTs (Bannai 2012, 2015; Inagawa 2006) demonstrate improved sleep quality scores, reduced fatigue the following day, and measurable core temperature drop. Effect size is consistent and well-replicated.",
    triggers: ["poor_sleep", "awakenings", "fatigue"],
    avoidIf: [],
    safetyBadges: [],
    sideEffects: ["Mild nausea at doses >5g", "Soft stool (rare)"],
    interactions: ["Potentiates clozapine — inform prescriber if on antipsychotics"],
    group: "stack",
  },
  {
    id: "magnesium-glycinate",
    name: "Magnesium Glycinate",
    shortName: "Mg Glycinate",
    category: "Neuro / Sleep",
    mechanisms: [
      "GABA-A receptor potentiation — calming, reduces sleep-onset anxiety",
      "NMDA receptor antagonism — dampens cortisol-driven nighttime arousal",
      "HPA axis modulation; reduces stress reactivity and cortisol reactivity",
      "Muscle relaxation via competition with calcium at voltage-gated channels",
    ],
    dose: "200–400mg elemental Mg as glycinate salt",
    timing: "bedtime",
    timingNote:
      "60–90 min before bed. Glycinate form has superior GI tolerability and absorption vs oxide or sulfate. Start at 200mg and titrate up.",
    onset: "1–4 weeks; faster for muscle cramps and anxiety",
    evidenceLevel: "Moderate",
    evidenceNote:
      "One RCT in elderly (Abbasi 2012) showed improved sleep efficiency and insomnia metrics. Evidence is strongest in magnesium-deficient populations (common — estimated 45–50% of Western adults are suboptimal). Glycinate form not separately RCT'd vs other forms.",
    triggers: ["poor_sleep", "poor_hrv", "fatigue", "awakenings"],
    avoidIf: ["Chronic kidney disease (impaired Mg excretion — consult MD)"],
    safetyBadges: ["GI upset at high doses"],
    sideEffects: ["Loose stool at doses >400mg elemental", "Sedation (beneficial at bedtime)"],
    interactions: [
      "Bisphosphonates — separate by ≥2h (Mg reduces absorption)",
      "Tetracycline antibiotics — separate by 2h",
      "Diuretics — thiazides increase Mg loss; loop diuretics reduce Mg",
    ],
    group: "stack",
  },
  {
    id: "omega-3",
    name: "Omega-3 Fish Oil (EPA/DHA)",
    shortName: "Omega-3",
    category: "Prostaglandin / Resolvin",
    mechanisms: [
      "EPA/DHA displace arachidonic acid from cell membranes → shifts prostaglandin balance to anti-inflammatory Series-3",
      "Precursors to resolvins and protectins — actively resolve (not just block) inflammation",
      "Reduces NF-κB signaling; lowers IL-6, TNF-α, and CRP",
      "Improves endothelial function and reduces triglycerides",
    ],
    dose: "2–4g combined EPA+DHA daily (label must show EPA+DHA content, not total oil)",
    timing: "with-meals",
    timingNote:
      "With largest meal of the day — fat co-ingestion improves absorption 3×. Splitting AM/PM reduces GI effects. Triglyceride-lowering requires ≥3–4g EPA+DHA.",
    onset: "4–8 weeks for inflammatory markers; 6–12 weeks for lipid panel",
    evidenceLevel: "High",
    evidenceNote:
      "Extensive meta-analyses support cardiovascular risk reduction and triglyceride lowering. REDUCE-IT trial (4g icosapentaenoic acid) showed 25% CV event reduction in high-risk patients. Moderate evidence for CRP and IL-6 reduction across multiple RCTs.",
    triggers: ["high_inflammation", "post_exercise", "always"],
    avoidIf: [
      "Fish or shellfish allergy (algae-based DHA is an alternative)",
      "High-dose anticoagulation without MD supervision",
    ],
    safetyBadges: ["Anticoagulant interaction"],
    sideEffects: ["Fish odor / burping (use enteric-coated form)", "Loose stool at high doses", "Mild nausea"],
    interactions: [
      "Warfarin — additive antiplatelet/anticoagulant effect; monitor INR",
      "Aspirin — additive antiplatelet (usually safe, but monitor)",
      "Blood pressure medications — mild additive hypotensive effect",
    ],
    group: "stack",
  },
  {
    id: "vitamin-d3",
    name: "Vitamin D3 + K2",
    shortName: "Vit D3",
    category: "Cytokine / Immune",
    mechanisms: [
      "VDR nuclear receptor activation — modulates expression of >1,000 genes",
      "T-regulatory cell (Treg) promotion → reduces autoimmune and chronic inflammatory activity",
      "Reduces pro-inflammatory cytokine production (IL-6, IL-17, TNF-α)",
      "K2 (MK-7) directs calcium to bone/teeth, away from arteries (prevents calcification with D3)",
    ],
    dose: "1,000–4,000 IU D3 + 100–200mcg MK-7 (K2) daily",
    timing: "AM",
    timingNote:
      "With morning fat-containing meal — D3 is fat-soluble. K2 is essential co-factor to prevent hypercalcemia complications. Dose should be guided by serum 25-OH vitamin D — target 40–70 ng/mL.",
    onset: "Weeks to months for serum levels. Recheck 25-OH D after 8–12 weeks on supplementation.",
    evidenceLevel: "High",
    evidenceNote:
      "High evidence for deficiency correction (>40% of Western populations are suboptimal). Moderate evidence for inflammation modulation, immune function, and mood. Supplementation benefit is greatest when baseline 25-OH D is <30 ng/mL. Test before supplementing >4,000 IU/day.",
    triggers: ["high_inflammation", "fatigue", "always"],
    avoidIf: [
      "Hypercalcemia (check calcium before high-dose D3)",
      "Sarcoidosis or other granulomatous disease (autonomous Vit D activation)",
      "Primary hyperparathyroidism",
    ],
    safetyBadges: [],
    sideEffects: [
      "Hypercalcemia at chronic high doses (>10,000 IU/day without monitoring)",
      "Fatigue, nausea, headache at toxic levels",
    ],
    interactions: [
      "Thiazide diuretics — additive hypercalcemia risk",
      "Digoxin — hypercalcemia increases digoxin toxicity risk",
      "Statins — D3 may reduce statin myopathy (beneficial interaction)",
    ],
    group: "stack",
  },
  {
    id: "curcumin",
    name: "Curcumin (Bioavailable Form)",
    shortName: "Curcumin",
    category: "Cytokine Modulation",
    mechanisms: [
      "NF-κB pathway inhibition — suppresses the master inflammatory transcription switch",
      "COX-2 and 5-LOX inhibition — reduces prostaglandin and leukotriene synthesis",
      "Lowers IL-1β, IL-6, and TNF-α production",
      "Nrf2 pathway activation — upregulates endogenous antioxidant defense (GSH, SOD)",
    ],
    dose: "500–1,000mg curcuminoids in bioavailable form: BCM-95, Meriva, CurcuWIN, or standard + 5mg piperine",
    timing: "with-meals",
    timingNote:
      "With a fat-containing meal. Bioavailability is critical — standard curcumin has <1% oral absorption. Choose a formulated product (piperine, phytosome, or nanoparticle form) or absorption is negligible.",
    onset: "4–8 weeks for inflammation markers; 2–4 weeks for joint symptom improvement",
    evidenceLevel: "Moderate",
    evidenceNote:
      "Multiple RCTs show efficacy comparable to NSAIDs for knee OA pain with fewer GI side effects. Consistent DOMS reduction in exercise trials. Note: only bioavailable forms show meaningful plasma curcuminoid levels. Evidence is undermined by many studies using standard curcumin with poor absorption.",
    triggers: ["high_inflammation", "post_exercise"],
    avoidIf: [
      "Gallbladder disease or gallstones (curcumin stimulates bile secretion)",
      "Anticoagulants — additive bleeding risk without MD supervision",
      "Chemotherapy — consult oncologist (may interfere with some agents)",
    ],
    safetyBadges: ["Anticoagulant interaction", "GI upset"],
    sideEffects: ["GI upset, nausea, diarrhea at doses >2g", "Yellow staining of stool"],
    interactions: [
      "Warfarin and anticoagulants — additive antiplatelet activity",
      "Tacrolimus — curcumin may increase drug levels",
      "Some chemotherapy agents — consult oncologist",
    ],
    group: "conditional",
  },
  {
    id: "coq10",
    name: "CoQ10 (Ubiquinol)",
    shortName: "CoQ10",
    category: "Mitochondrial",
    mechanisms: [
      "Essential cofactor in mitochondrial electron transport chain (Complex I, II, III)",
      "Lipid-soluble antioxidant — regenerates vitamin E; quenches mitochondrial ROS",
      "Statins deplete endogenous CoQ10 by blocking the mevalonate pathway",
      "Improves mitochondrial membrane potential and ATP production efficiency",
    ],
    dose: "100–200mg ubiquinol (reduced form — superior bioavailability over ubiquinone)",
    timing: "AM",
    timingNote:
      "With fat-containing breakfast. Ubiquinol absorbs 2–3× better than ubiquinone. AM dosing avoids rare sleep disruption. Statin users should prioritize this supplement.",
    onset: "4–12 weeks for fatigue and exercise capacity; faster for statin myopathy relief",
    evidenceLevel: "Moderate",
    evidenceNote:
      "High evidence for statin-induced myopathy (well-established mechanism). Moderate evidence for fatigue, exercise capacity, and heart failure symptoms. Evidence for general aging and inflammation is limited — avoid overstating.",
    triggers: ["fatigue", "poor_hrv"],
    avoidIf: [],
    safetyBadges: [],
    sideEffects: ["Insomnia (rare — take in morning)", "Mild GI discomfort", "Headache (rare)"],
    interactions: [
      "Warfarin — CoQ10 may reduce anticoagulant effect; monitor INR",
      "Statins — beneficial interaction (replenishes CoQ10 depleted by statins)",
    ],
    group: "conditional",
  },
  {
    id: "collagen-peptides",
    name: "Collagen Peptides + Vitamin C",
    shortName: "Collagen",
    category: "Connective Tissue",
    mechanisms: [
      "Hydroxyproline-rich peptides stimulate tenocyte and chondrocyte collagen synthesis",
      "Vitamin C is essential cofactor for prolyl hydroxylase — required for collagen cross-linking",
      "Provides concentrated glycine and proline — rate-limiting amino acids for collagen",
      "Accumulates in cartilage and tendon tissue within 60 min of ingestion",
    ],
    dose: "15–20g hydrolyzed collagen peptides + 50mg Vitamin C",
    timing: "pre-exercise",
    timingNote:
      "30–60 min before exercise (Shaw 2017 protocol). Vitamin C must be co-administered — not optional. On rest days, take before bed. Type I or II collagen peptides both supported.",
    onset: "4–12 weeks for measurable connective tissue changes; skin benefits visible at 4–8 weeks",
    evidenceLevel: "Moderate",
    evidenceNote:
      "Shaw et al. (2017) RCT showed increased collagen synthesis markers and actual collagen content in tendons with pre-exercise collagen + Vit C. Multiple RCTs for skin elasticity and hydration. Joint and cartilage evidence is promising but smaller-scale.",
    triggers: ["post_exercise", "always"],
    avoidIf: [
      "History of kidney stones (vitamin C at doses >1g increases oxalate; keep Vit C at 50mg as in protocol)",
    ],
    safetyBadges: [],
    sideEffects: ["GI fullness (large powder volume)", "Rare nausea"],
    interactions: [
      "Vitamin C increases iron absorption — be aware in hemochromatosis (separate timing)",
    ],
    group: "conditional",
  },
  {
    id: "tart-cherry",
    name: "Tart Cherry Extract",
    shortName: "Tart Cherry",
    category: "Prostaglandin / Antioxidant",
    mechanisms: [
      "Anthocyanins inhibit COX-1/COX-2 pathways (similar mechanism to NSAIDs, lower potency)",
      "Contains endogenous melatonin — supports sleep onset and circadian signaling",
      "Reduces post-exercise CRP and creatine kinase (muscle damage markers)",
      "Polyphenol antioxidant load reduces post-exercise oxidative stress",
    ],
    dose: "1,000–1,500mg standardized Montmorency cherry extract — or 480ml juice (contains ~25g sugar)",
    timing: "PM",
    timingNote:
      "1–2 hours before bed for sleep. For DOMS: take before and after exercise. Use capsule/concentrate form to avoid the sugar load in juice. Sugar in juice form is a meaningful caveat for anyone monitoring glucose.",
    onset: "Sleep benefit: 3–7 days. DOMS reduction: acute (24–48h window).",
    evidenceLevel: "Moderate",
    evidenceNote:
      "Howatson 2011 and Losso 2018 RCTs showed improved sleep duration and quality. Multiple RCTs in athletes demonstrate DOMS and strength recovery benefit. Gout prevention evidence is low-tier and mechanistically plausible but not RCT-confirmed.",
    triggers: ["poor_sleep", "post_exercise"],
    avoidIf: [
      "Diabetes or significant insulin resistance if using juice form (high sugar — use extract capsule instead)",
    ],
    safetyBadges: [],
    sideEffects: ["GI upset in large juice quantities", "Sugar load from juice form"],
    interactions: ["Warfarin — minimal interaction; monitor if high juice consumption", "Blood glucose medications — mild additive effect"],
    group: "conditional",
  },
  {
    id: "boswellia",
    name: "Boswellia (AKBA Standardized)",
    shortName: "Boswellia",
    category: "Leukotriene Inhibition",
    mechanisms: [
      "5-LOX inhibition — reduces leukotriene synthesis (distinct from COX pathway; complementary to NSAIDs)",
      "Reduces CXCL-8 (neutrophil attractant) and microsomal PGE2 synthase activity",
      "AKBA (acetyl-11-keto-β-boswellic acid) is primary active fraction — standardization essential",
    ],
    dose: "300–500mg AKBA-standardized extract (5-Loxin or AflaPin); twice daily with food",
    timing: "with-meals",
    timingNote:
      "Twice daily with meals. Look for label stating AKBA content (e.g., 30% AKBA). Non-standardized boswellia products have inconsistent efficacy and should be avoided.",
    onset: "4–8 weeks for joint symptom improvement",
    evidenceLevel: "Moderate",
    evidenceNote:
      "Multiple RCTs demonstrate efficacy for knee OA pain reduction; some IBD evidence. AKBA fraction is the key active component — standardized extracts outperform non-standardized in trials. Evidence quality is moderate but consistent across OA studies.",
    triggers: ["high_inflammation", "post_exercise"],
    avoidIf: ["Anticoagulants — mild additive antiplatelet property"],
    safetyBadges: ["GI upset", "Anticoagulant interaction"],
    sideEffects: ["GI upset", "Nausea", "Diarrhea (less than NSAIDs)"],
    interactions: ["Mild additive effect with anticoagulants/antiplatelets", "P-gp substrate drugs (minor)"],
    group: "experimental",
  },
];

// ─── Modality Data ────────────────────────────────────────────────────────────

const MODALITY_DATA = {
  "cold-plunge": {
    mechanisms: [
      "Vasoconstriction reduces diffusion of inflammatory mediators into tissue",
      "Norepinephrine surge (~200–300% increase) — anti-inflammatory and mood elevation",
      "Vagal tone enhancement and parasympathetic rebound post-immersion",
      "Cold shock proteins (RBM3, CIRP) induced — neuroprotective, anti-apoptotic",
    ],
    evidenceNote:
      "Bleakley 2012 Cochrane review supports DOMS reduction across multiple RCTs. Moderate evidence for HRV improvement and autonomic tone enhancement with regular CWI. Emerging data on brown adipose activation for metabolic benefit. Acclimation increases norepinephrine response over weeks.",
  },
  "sauna": {
    mechanisms: [
      "Heat shock protein (HSP70, HSP90) induction — proteostasis, cellular repair, and muscle protection",
      "Nitric oxide release → vasodilation, endothelial conditioning, and cardiovascular adaptation",
      "Parasympathetic rebound after session — measurable HRV improvement over days to weeks",
      "Growth hormone pulse (combined with exercise → synergistic GH release)",
      "Plasma volume expansion with rehydration — cardiovascular adaptation marker",
    ],
    evidenceNote:
      "Laukkanen et al. prospective studies show dose-dependent cardiovascular mortality reduction (2–4× weekly sauna use). Moderate evidence for HSP induction and recovery. RCTs for fibromyalgia and chronic pain show benefit. Emerging HRV data is consistent with autonomic improvement over weeks of regular use.",
  },
};

// ─── Recommendation Engine ────────────────────────────────────────────────────

const TRIGGER_WEIGHTS: Record<string, number> = {
  always: 1,
  high_inflammation: 4,
  poor_hrv: 3,
  poor_sleep: 4,
  awakenings: 3,
  post_exercise: 2,
  fatigue: 3,
};

const EVIDENCE_MULTIPLIER: Record<EvidenceLevel, number> = {
  High: 1.4,
  Moderate: 1.0,
  Low: 0.6,
};

function detectTriggers(today: DailyMetrics, ili: number, hrvDiffPct: number): Set<string> {
  const t = new Set<string>();
  t.add("always");
  if (ili > 35 || (today.glucoseSpikeScore ?? 0) > 50 || today.alcoholDrinks > 0) t.add("high_inflammation");
  if (hrvDiffPct < -15) t.add("poor_hrv");
  if (today.sleepHours < 7 || (today.awakenings ?? 0) > 2) t.add("poor_sleep");
  if ((today.awakenings ?? 0) > 2) t.add("awakenings");
  if (today.zone2Minutes > 20 || today.strengthSessions > 0 || today.hiitSessions > 0) t.add("post_exercise");
  if (today.sleepHours < 6.5) t.add("fatigue");
  return t;
}

function buildRationale(
  trigger: string,
  today: DailyMetrics,
  ili: number,
  hrvDiffPct: number
): string {
  switch (trigger) {
    case "high_inflammation":
      if (today.alcoholDrinks > 0) return "Alcohol last night — inflammatory load elevated";
      if (ili > 60) return `ILI ${Math.round(ili)} — significant inflammatory burden today`;
      return "Elevated inflammatory markers today";
    case "poor_sleep":
      return `${today.sleepHours}h sleep — below the 7h recovery threshold`;
    case "awakenings":
      return `${today.awakenings} awakenings — fragmented sleep detected`;
    case "poor_hrv":
      return `HRV ${Math.abs(Math.round(hrvDiffPct))}% below 21d baseline — autonomic stress`;
    case "post_exercise":
      return "Exercise today — supports recovery and tissue repair";
    case "fatigue":
      return "Short sleep — mitochondrial and cellular energy support indicated";
    case "always":
      return "Core daily protocol";
    default:
      return "";
  }
}

export function recommendSupplements(
  today: DailyMetrics,
  ili: number,
  hrvDiffPct: number,
  _sleepConsistency: number
): { ranked: RankedSupplement[]; modalities: ModalityStatus[] } {
  const activeTriggers = detectTriggers(today, ili, hrvDiffPct);

  const ranked: RankedSupplement[] = SUPPLEMENTS.map((supp) => {
    let score = 0;
    const rationale: string[] = [];
    for (const trigger of supp.triggers) {
      if (activeTriggers.has(trigger)) {
        score += TRIGGER_WEIGHTS[trigger] ?? 1;
        const msg = buildRationale(trigger, today, ili, hrvDiffPct);
        if (msg && !rationale.includes(msg)) rationale.push(msg);
      }
    }
    score *= EVIDENCE_MULTIPLIER[supp.evidenceLevel];
    return { ...supp, score, rationale };
  });

  ranked.sort((a, b) => b.score - a.score);

  const modalities = buildModalityStatuses(ili, hrvDiffPct, today);

  return { ranked, modalities };
}

function buildModalityStatuses(
  ili: number,
  hrvDiffPct: number,
  today: DailyMetrics
): ModalityStatus[] {
  const didExercise =
    today.zone2Minutes > 20 || today.strengthSessions > 0 || today.hiitSessions > 0;

  // ── Cold Plunge ──
  let coldStatus: ModalityStatusLevel;
  let coldReason: string;
  let coldProtocol: string;

  if (hrvDiffPct < -30) {
    coldStatus = "hold";
    coldReason = "HRV severely suppressed — cold stress adds sympathetic load and may worsen autonomic recovery. Rest today.";
    coldProtocol = "Skip — prioritize sleep and rest";
  } else if (hrvDiffPct < -15) {
    coldStatus = "caution";
    coldReason = "HRV mildly suppressed — shorter cold exposure may still stimulate parasympathetic rebound without overloading the system.";
    coldProtocol = "5 min at 13–15°C (55–59°F)";
  } else if (ili > 30 || didExercise) {
    coldStatus = "recommended";
    coldReason = didExercise
      ? "Post-exercise — reduces DOMS, clears inflammatory mediators, and speeds muscle recovery."
      : `ILI ${Math.round(ili)} — cold immersion supports resolution of inflammatory load.`;
    coldProtocol = "10–15 min at 10–15°C (50–59°F), 2–4h post-exercise";
  } else {
    coldStatus = "caution";
    coldReason = "No specific trigger today — benefit is moderate. Fine for routine use and alertness.";
    coldProtocol = "10 min at 12–15°C — routine protocol";
  }

  // ── Sauna ──
  let saunaStatus: ModalityStatusLevel;
  let saunaReason: string;
  let saunaProtocol: string;

  if (today.alcoholDrinks > 0) {
    saunaStatus = "hold";
    saunaReason = "Alcohol detected — sauna after alcohol causes dangerous hypotension and dehydration. Always avoid this combination.";
    saunaProtocol = "Skip — never combine with alcohol";
  } else if (hrvDiffPct < -25) {
    saunaStatus = "hold";
    saunaReason = "HRV severely suppressed — heat stress may worsen recovery. Your system is already overloaded. Rest and sleep are better choices today.";
    saunaProtocol = "Skip today — rest and prioritise sleep";
  } else if (hrvDiffPct < -10) {
    saunaStatus = "caution";
    saunaReason = "HRV mildly suppressed — a shorter, cooler session may still trigger the parasympathetic rebound effect without adding excessive heat stress.";
    saunaProtocol = "10 min at 75–80°C; cool gradually; hydrate well";
  } else {
    saunaStatus = "recommended";
    saunaReason = "HRV at or near baseline — sauna supports cardiovascular adaptation, HSP induction, and parasympathetic recovery. Ideal conditions.";
    saunaProtocol = "15–20 min at 80–90°C (176–194°F), 2–4× per week";
  }

  return [
    {
      id: "cold-plunge",
      name: "Cold Plunge",
      icon: "cold",
      status: coldStatus,
      reason: coldReason,
      protocol: coldProtocol,
      ...MODALITY_DATA["cold-plunge"],
    },
    {
      id: "sauna",
      name: "Sauna",
      icon: "heat",
      status: saunaStatus,
      reason: saunaReason,
      protocol: saunaProtocol,
      ...MODALITY_DATA["sauna"],
    },
  ];
}
