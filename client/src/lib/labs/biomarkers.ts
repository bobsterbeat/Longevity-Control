// ─── Types ───────────────────────────────────────────────────────────────────

export type EvidenceColor = "green" | "yellow" | "orange";
export type ScoringType = "lower" | "higher" | "range";
export type BiomarkerCategory = "inflammation" | "metabolic" | "cardiovascular" | "organ";

export interface ScoringConfig {
  type: ScoringType;
  ideal: number;       // threshold for top score (or center for range)
  acceptable: number;  // threshold for moderate score
  flag: number;        // threshold where score drops sharply
  idealMin?: number;   // range type only
  idealMax?: number;   // range type only
  acceptableMin?: number;
  acceptableMax?: number;
}

export interface BiomarkerDefinition {
  id: string;
  name: string;
  shortName: string;
  unit: string;
  tier: 1 | 2 | 3 | 4;
  evidence: EvidenceColor;
  category: BiomarkerCategory;
  isComputed?: boolean;          // e.g. TG/HDL ratio
  computedFrom?: string[];       // biomarker IDs
  isAdvanced?: boolean;          // tier 4 — behind toggle
  scoring: ScoringConfig;
  lbsWeight?: number;            // fraction of 1.0 within LBS
  // Education
  whatItMeasures: string;
  whyItMatters: string;
  mechanism: string;
  targetDescription: string;
  recheckFrequency: string;
  whatRaisesIt: string[];
  whatLowersIt: string[];
  references: string[];
  aliases: string[];             // for CSV import matching
}

// ─── Biomarker Definitions ───────────────────────────────────────────────────

export const BIOMARKERS: BiomarkerDefinition[] = [
  // ── Tier 1: Inflammation ──────────────────────────────────────────────────
  {
    id: "hs-crp",
    name: "hs-CRP",
    shortName: "hs-CRP",
    unit: "mg/L",
    tier: 1,
    evidence: "green",
    category: "inflammation",
    scoring: { type: "lower", ideal: 0.7, acceptable: 1.0, flag: 3.0 },
    lbsWeight: 0.30,
    whatItMeasures:
      "High-sensitivity C-reactive protein — a hepatic acute-phase protein synthesized in response to interleukin-6 (IL-6) released by immune cells, adipose tissue, and senescent cells.",
    whyItMatters:
      "Chronic low-grade elevation (1–3 mg/L) independently predicts cardiovascular events, accelerated biological aging, cognitive decline, and all-cause mortality. Inflammaging — the chronic sterile inflammation of aging — consistently elevates hs-CRP even when the patient feels well. Longevity medicine targets <0.7 mg/L; most labs use <3.0 mg/L as the clinical cutoff, which is not the same as an optimal target.",
    mechanism:
      "IL-6 released from activated macrophages, visceral adipose, and senescent cells triggers JAK-STAT3 signaling in hepatocytes → CRP synthesis. CRP then activates complement, amplifies NF-κB signaling, and recruits additional immune cells — perpetuating the inflammatory cycle. Note: values >10 mg/L likely reflect acute infection or injury; repeat when well.",
    targetDescription: "Longevity ideal: <0.7 mg/L. Acceptable: <1.0. Borderline: 1.0–3.0. Elevated: >3.0. (>10 = possible acute infection — retest when recovered.)",
    recheckFrequency: "Every 3–6 months while actively optimizing; annually once stable.",
    whatRaisesIt: [
      "Visceral adiposity (most potent chronic driver)",
      "Chronic sleep deprivation or fragmented sleep",
      "Ultra-processed / high-refined carbohydrate diet",
      "Alcohol consumption",
      "Cigarette smoking",
      "Sedentary behaviour",
      "Chronic psychological stress",
      "Periodontal (gum) disease",
      "Subclinical infections",
    ],
    whatLowersIt: [
      "Zone 2 aerobic exercise (most potent behavioral modifier)",
      "Mediterranean or DASH dietary pattern",
      "Weight loss (visceral fat reduction especially)",
      "High-dose omega-3 (EPA+DHA ≥2g/day)",
      "Sleep quality and consistency improvement",
      "Stress reduction (mindfulness, social connection)",
      "Statins (pharmaceutical, if indicated)",
    ],
    references: [
      "Ridker PM. N Engl J Med. 2002; 347(20):1557-1565.",
      "Emerging Risk Factors Collaboration. JAMA. 2010; 304(24):2684-2692.",
      "Franceschi C et al. Ageing Res Rev. 2017; 54:11-22. (Inflammaging)",
    ],
    aliases: ["hs-crp", "hscrp", "crp", "high sensitivity crp", "hsCRP", "c-reactive protein"],
  },

  // ── Tier 1: Metabolic ─────────────────────────────────────────────────────
  {
    id: "hba1c",
    name: "HbA1c",
    shortName: "HbA1c",
    unit: "%",
    tier: 1,
    evidence: "green",
    category: "metabolic",
    scoring: { type: "lower", ideal: 5.3, acceptable: 5.6, flag: 6.0 },
    lbsWeight: 0.15,
    whatItMeasures:
      "Glycated haemoglobin — reflects average blood glucose over the preceding ~90 days. Glucose non-enzymatically binds to haemoglobin via the Maillard reaction; the percentage bound is proportional to mean glucose exposure.",
    whyItMatters:
      "Even within the conventional 'normal' range, higher A1c correlates with accelerated protein glycation and formation of advanced glycation end-products (AGEs) — cross-linking collagen, stiffening arteries, and impairing organ function. Insulin resistance that underlies elevated A1c typically precedes clinical diabetes by 10–20 years. The longevity target (5.0–5.3%) is more conservative than the clinical pre-diabetes threshold of 5.7%.",
    mechanism:
      "Glucose reacts with lysine residues on Hb beta-chains → stable Amadori products → AGEs. Chronically elevated glucose also activates PKC, the hexosamine biosynthesis pathway, and mitochondrial superoxide production — all independent drivers of endothelial dysfunction and cellular aging.",
    targetDescription: "Ideal: 5.0–5.3%. Acceptable: <5.6%. Borderline (pre-diabetes): 5.7–6.4%. Diabetes: ≥6.5%.",
    recheckFrequency: "Every 3 months while optimizing; every 6–12 months once stable.",
    whatRaisesIt: [
      "High-glycaemic / ultra-processed carbohydrate diet",
      "Sedentary lifestyle",
      "Poor sleep quality (impairs glucose metabolism acutely)",
      "Chronic psychological stress (cortisol-driven glucose elevation)",
      "Ageing (modest independent effect)",
      "Glucocorticoid medications",
    ],
    whatLowersIt: [
      "Zone 2 aerobic exercise (improves insulin sensitivity — both acute and chronic)",
      "Resistance training (increases glycogen-storing muscle mass)",
      "Mediterranean / low-glycaemic dietary pattern",
      "Time-restricted eating (8–10h window)",
      "Improved sleep quality and duration",
      "Weight loss (especially visceral fat)",
      "Reduced refined carbohydrates and added sugars",
    ],
    references: [
      "Selvin E et al. Ann Intern Med. 2010; 153(9):587-595.",
      "Nathan DM. N Engl J Med. 2002; 347(19):1482-1490.",
    ],
    aliases: ["hba1c", "a1c", "hemoglobin a1c", "haemoglobin a1c", "glycated hemoglobin"],
  },
  {
    id: "fasting-insulin",
    name: "Fasting Insulin",
    shortName: "Insulin",
    unit: "µIU/mL",
    tier: 1,
    evidence: "green",
    category: "metabolic",
    scoring: { type: "lower", ideal: 5, acceptable: 8, flag: 12 },
    lbsWeight: 0.10,
    whatItMeasures:
      "Plasma insulin concentration measured after ≥8h fasting — the best accessible proxy for whole-body insulin sensitivity without a formal hyperinsulinaemic-euglycaemic clamp.",
    whyItMatters:
      "Fasting hyperinsulinaemia (>8–10 µIU/mL) is detectable years to decades before A1c rises. It independently predicts metabolic syndrome, NAFLD, visceral adiposity, and accelerated aging via chronic mTOR activation. Most labs list 'normal' up to 25 µIU/mL — a population norm reflecting poor metabolic health, not an optimal target.",
    mechanism:
      "Chronically elevated insulin suppresses autophagy via mTOR, promotes lipogenesis and visceral fat deposition, activates NF-κB-driven inflammation, and up-regulates VEGF and IGF-1 signalling — all accelerating aging phenotypes. Insulin resistance also drives hepatic glucose production and lipolysis → elevated free fatty acids → ectopic fat in liver and muscle.",
    targetDescription: "Ideal: 2–5 µIU/mL. Acceptable: ≤8. Borderline: 8–12. Elevated: >12. (Clinical labs often report normal up to 25 — this is not an optimal target.)",
    recheckFrequency: "Every 3–6 months while optimizing metabolic health.",
    whatRaisesIt: [
      "Ultra-processed / high-refined carbohydrate and fructose diet",
      "Sedentary lifestyle (especially low muscle mass)",
      "Inadequate sleep",
      "Visceral adiposity",
      "Chronic psychological stress",
      "Excess alcohol",
    ],
    whatLowersIt: [
      "Zone 2 aerobic + resistance training combination (most effective)",
      "Time-restricted eating (reduces insulin secretion pulses)",
      "Low-glycaemic / Mediterranean dietary pattern",
      "Weight loss (especially visceral fat)",
      "Improved sleep",
      "Reduced refined carbohydrate and fructose intake",
    ],
    references: [
      "Reaven GM. Diabetes. 1988; 37(12):1595-1607.",
      "Hivert MF et al. Diabetes Care. 2008; 31(10):2090-2096.",
    ],
    aliases: ["fasting insulin", "insulin", "fasting-insulin"],
  },
  {
    id: "tg",
    name: "Triglycerides",
    shortName: "TG",
    unit: "mg/dL",
    tier: 1,
    evidence: "green",
    category: "metabolic",
    scoring: { type: "lower", ideal: 100, acceptable: 150, flag: 200 },
    lbsWeight: 0, // used via TG/HDL ratio
    whatItMeasures:
      "Fasting serum triglycerides — circulating fatty acids esterified to glycerol, predominantly packaged in VLDL particles secreted by the liver.",
    whyItMatters:
      "Elevated fasting TG reflects hepatic overproduction of VLDL (driven by insulin resistance and excess carbohydrate/fructose) and/or impaired peripheral clearance. Used to compute the TG/HDL ratio — a validated surrogate for small dense LDL and metabolic health.",
    mechanism:
      "Insulin resistance increases de novo lipogenesis in the liver → excess VLDL-TG secretion. Fructose specifically bypasses regulatory steps and directly drives hepatic TG production via acetyl-CoA.",
    targetDescription: "Ideal: <100 mg/dL. Acceptable: <150. Borderline: 150–200. Elevated: >200.",
    recheckFrequency: "Every 3–6 months.",
    whatRaisesIt: ["Insulin resistance", "High refined carb / fructose / alcohol intake", "Sedentary lifestyle", "Obesity", "Hypothyroidism", "Kidney disease"],
    whatLowersIt: ["Aerobic exercise", "Reduced refined carbs and fructose", "Omega-3 (2–4g EPA+DHA — most evidence for TG reduction)", "Weight loss", "Alcohol reduction", "Mediterranean diet"],
    references: ["Miller M et al. Circulation. 2011; 123(20):2292-2333."],
    aliases: ["triglycerides", "tg", "triglyceride", "trigs"],
  },
  {
    id: "hdl",
    name: "HDL Cholesterol",
    shortName: "HDL",
    unit: "mg/dL",
    tier: 1,
    evidence: "green",
    category: "metabolic",
    scoring: { type: "higher", ideal: 60, acceptable: 40, flag: 35 },
    lbsWeight: 0, // used via TG/HDL ratio
    whatItMeasures: "High-density lipoprotein cholesterol — the cholesterol fraction carried by HDL particles, which mediate reverse cholesterol transport from peripheral tissues back to the liver.",
    whyItMatters:
      "Low HDL is an independent cardiovascular risk factor and marker of metabolic dysfunction. It correlates inversely with insulin resistance. However, not all HDL is protective — HDL function (cholesterol efflux capacity) matters as much as concentration.",
    mechanism: "Insulin resistance reduces apoA-I production and increases CETP activity (transferring cholesterol from HDL to VLDL) → lower HDL-C. Impaired HDL function reduces reverse cholesterol transport efficiency.",
    targetDescription: "Ideal: >60 mg/dL (men and women). Acceptable: >40 (men), >50 (women). Low/risk: <40 (men), <50 (women).",
    recheckFrequency: "Every 6–12 months.",
    whatRaisesIt: ["Aerobic exercise (most consistent lifestyle intervention)", "Mediterranean diet", "Moderate alcohol (small effect — not a recommendation)", "Weight loss", "Smoking cessation"],
    whatLowersIt: ["Sedentary lifestyle", "Refined carbohydrates and trans fats", "Insulin resistance", "Smoking", "Obesity", "Beta-blockers (modest)"],
    references: ["Gordon DJ et al. N Engl J Med. 1989; 321(19):1311-1316."],
    aliases: ["hdl", "hdl-c", "hdl cholesterol", "high density lipoprotein"],
  },
  {
    id: "tg-hdl-ratio",
    name: "TG/HDL Ratio",
    shortName: "TG/HDL",
    unit: "ratio",
    tier: 1,
    evidence: "green",
    category: "metabolic",
    isComputed: true,
    computedFrom: ["tg", "hdl"],
    scoring: { type: "lower", ideal: 1.5, acceptable: 2.5, flag: 3.5 },
    lbsWeight: 0.10,
    whatItMeasures:
      "Computed ratio of fasting triglycerides to HDL-C. Correlates strongly with small dense LDL particle count — the atherogenic subfraction not measured by standard LDL-C.",
    whyItMatters:
      "A ratio >3.0 in Caucasians (>2.5 in some populations) strongly predicts insulin resistance, metabolic syndrome, and elevated small dense LDL — even when LDL-C appears normal. It is one of the best accessible surrogates for metabolic health without needing an NMR lipid panel.",
    mechanism:
      "Insulin resistance simultaneously raises VLDL-TG production and lowers HDL via CETP activity. This creates the classic atherogenic dyslipidaemia profile (high TG, low HDL, elevated small dense LDL) — all mechanistically driven by insulin resistance.",
    targetDescription: "Ideal: <1.5. Acceptable: <2.5. Borderline: 2.5–3.5. High concern: >3.5.",
    recheckFrequency: "Computed automatically from TG and HDL values.",
    whatRaisesIt: ["All metabolic risk factors (insulin resistance, refined carbs, fructose, sedentary lifestyle, alcohol)"],
    whatLowersIt: ["Zone 2 exercise, reduced refined carbs/fructose/alcohol, omega-3, Mediterranean diet, weight loss — same as TG and HDL individually"],
    references: ["Gaziano JM et al. Circulation. 1997; 96(8):2520-2525.", "McLaughlin T et al. Am J Clin Nutr. 2005; 82(2):314-321."],
    aliases: ["tg/hdl", "tg hdl ratio", "triglyceride hdl ratio"],
  },

  // ── Tier 2: Cardiovascular ────────────────────────────────────────────────
  {
    id: "apob",
    name: "Apolipoprotein B",
    shortName: "ApoB",
    unit: "mg/dL",
    tier: 2,
    evidence: "green",
    category: "cardiovascular",
    scoring: { type: "lower", ideal: 80, acceptable: 100, flag: 120 },
    lbsWeight: 0.15,
    whatItMeasures:
      "Apolipoprotein B — the structural protein present on every atherogenic lipoprotein particle (LDL, VLDL, IDL, Lp(a)). One molecule of ApoB per particle means ApoB = total particle count.",
    whyItMatters:
      "Each ApoB-containing particle can traverse the arterial endothelium and initiate atherosclerotic plaque — regardless of its size or cholesterol content. ApoB is a superior predictor of ASCVD risk over LDL-C, especially in insulin-resistant individuals with the atherogenic dyslipidaemia pattern. Leading cardiologists target ApoB <60–80 mg/dL for primary prevention in high-risk individuals.",
    mechanism:
      "Particle count (ApoB) determines atherogenic burden better than cholesterol content. Small dense LDL has lower cholesterol per particle but the same ApoB as large buoyant LDL — so LDL-C underestimates risk when small dense LDL predominates (common in metabolic syndrome).",
    targetDescription: "Aggressive longevity target: <60 mg/dL. Optimal: <80. Acceptable: <100. Flag: ≥100 mg/dL.",
    recheckFrequency: "Every 6–12 months; every 3 months while actively treating.",
    whatRaisesIt: ["Insulin resistance", "High saturated fat intake (especially palmitic acid)", "Trans fats", "Refined carbohydrates in the context of metabolic dysfunction", "Obesity", "Hypothyroidism"],
    whatLowersIt: [
      "Statins (potent — 30–60% reduction)",
      "PCSK9 inhibitors (potent — 50–70% reduction)",
      "Mediterranean dietary pattern",
      "Dietary fibre (especially beta-glucan / oat bran / psyllium)",
      "Plant sterols and stanols",
      "Weight loss and improved insulin sensitivity",
      "Exercise (modest 5–10% reduction)",
    ],
    references: [
      "Sniderman AD et al. J Am Coll Cardiol. 2019; 73(21):2742-2753.",
      "Ference BA et al. Eur Heart J. 2019; 40(34):2866-2873.",
    ],
    aliases: ["apob", "apo b", "apolipoprotein b", "apo-b"],
  },
  {
    id: "lpa",
    name: "Lipoprotein(a)",
    shortName: "Lp(a)",
    unit: "nmol/L",
    tier: 2,
    evidence: "green",
    category: "cardiovascular",
    scoring: { type: "lower", ideal: 75, acceptable: 125, flag: 200 },
    lbsWeight: 0.10,
    whatItMeasures:
      "Lipoprotein(a) — an LDL-like particle with an additional apolipoprotein(a) [apo(a)] molecule attached via a disulfide bond. Plasma levels are 70–90% genetically determined and largely set at birth.",
    whyItMatters:
      "Lp(a) is an independent, causal risk factor for atherosclerotic cardiovascular disease and calcific aortic stenosis, validated by large Mendelian randomisation studies. Elevated Lp(a) (>125 nmol/L or ~50 mg/dL) confers substantial lifetime cardiovascular risk independent of other factors. Important: Lp(a) can be reported in nmol/L or mg/dL — the two units are not interchangeable (nmol/L ÷ ~2.4 ≈ mg/dL, but varies by particle size). Confirm units with your lab.",
    mechanism:
      "Lp(a) promotes atherogenesis via similar mechanisms to LDL (plaque deposition) and additionally inhibits fibrinolysis via structural homology with plasminogen (apo(a) contains kringle domains that compete with plasminogen). It also promotes oxidised phospholipid accumulation and valvular calcification.",
    targetDescription: "Low risk: <75 nmol/L (or <30 mg/dL). Intermediate: 75–125 nmol/L. High risk: >125 nmol/L (or >50 mg/dL). Very high: >250 nmol/L. Note: largely genetic — the primary actionable value is knowing your level to intensify all other modifiable risk factor reduction.",
    recheckFrequency: "Once in a lifetime sufficient for most adults (level is genetically set). Recheck if cardiovascular risk stratification changes.",
    whatRaisesIt: [
      "Genetic predisposition (primary determinant — LPA gene variants)",
      "Menopause (oestrogen has modest Lp(a)-lowering effect)",
      "Kidney disease (reduces apo(a) clearance)",
    ],
    whatLowersIt: [
      "Very limited modifiable options — lifestyle interventions have minimal effect",
      "Niacin: reduces Lp(a) ~25–30% (limited clinical outcome evidence)",
      "PCSK9 inhibitors: reduce Lp(a) ~25–30%",
      "Novel RNA therapies (olpasiran, pelacarsen): currently in phase 3 trials — discuss with cardiologist if very elevated",
      "Primary value: knowing your Lp(a) to intensify optimisation of all other modifiable risk factors",
    ],
    references: [
      "Kronenberg F et al. Eur Heart J. 2022; 43(39):3925-3946.",
      "Kamstrup PR et al. JAMA. 2009; 301(22):2331-2339.",
    ],
    aliases: ["lp(a)", "lpa", "lipoprotein a", "lipoprotein(a)", "lp a"],
  },
  {
    id: "homocysteine",
    name: "Homocysteine",
    shortName: "Homocys.",
    unit: "µmol/L",
    tier: 2,
    evidence: "yellow",
    category: "cardiovascular",
    scoring: { type: "lower", ideal: 9, acceptable: 12, flag: 15 },
    lbsWeight: 0, // not in core LBS
    whatItMeasures:
      "Sulphur-containing amino acid produced during methionine metabolism. Reflects B-vitamin status (B6, B12, folate) and one-carbon (methylation) cycle efficiency.",
    whyItMatters:
      "Elevated homocysteine (>12 µmol/L) is associated with cardiovascular disease, cognitive decline, brain atrophy, dementia, osteoporosis, and accelerated epigenetic aging. It is a sensitive marker of B-vitamin deficiency and methylation capacity impairment (including MTHFR polymorphism — common in ~10% of population homozygously).",
    mechanism:
      "Methionine → S-adenosylmethionine (SAM) → homocysteine. Remethylation back to methionine requires methylcobalamin (B12) and methyltetrahydrofolate (folate via MTHFR enzyme). B6 (as P5P) is required for transsulfuration to cysteine. MTHFR C677T variant reduces enzyme activity → impaired remethylation → homocysteine accumulates.",
    targetDescription: "Optimal: 6–9 µmol/L. Acceptable: <12. Borderline: 12–15 (moderate hyperhomocysteinaemia). Elevated: >15.",
    recheckFrequency: "Every 6 months if elevated; annually once optimised.",
    whatRaisesIt: [
      "B12, B6, or folate deficiency (common with plant-based diets, malabsorption, or ageing)",
      "MTHFR C677T homozygous variant (reduces enzyme efficiency ~70%)",
      "Chronic kidney disease (impairs clearance)",
      "Hypothyroidism",
      "Proton pump inhibitors or metformin (reduce B12 absorption over time)",
      "Ageing (modest independent effect)",
    ],
    whatLowersIt: [
      "Methylated B vitamins: methylcobalamin (B12), methylfolate (L-5-MTHF), pyridoxal-5-phosphate (B6)",
      "Betaine / TMG (trimethylglycine) — alternative methyl donor",
      "Riboflavin (B2) — cofactor for MTHFR enzyme",
      "Dietary folate (dark leafy greens, legumes)",
      "Choline-rich foods",
    ],
    references: [
      "Selhub J. Annu Rev Nutr. 1999; 19:217-246.",
      "Smith AD et al. PLoS One. 2010; 5(9):e12244.",
    ],
    aliases: ["homocysteine", "hcy", "total homocysteine"],
  },

  // ── Tier 3: Organ / Function ──────────────────────────────────────────────
  {
    id: "creatinine",
    name: "Creatinine",
    shortName: "Creatinine",
    unit: "mg/dL",
    tier: 3,
    evidence: "green",
    category: "organ",
    scoring: { type: "range", ideal: 0, acceptable: 0, flag: 0, idealMin: 0.7, idealMax: 1.1, acceptableMin: 0.6, acceptableMax: 1.3 },
    lbsWeight: 0, // eGFR used instead
    whatItMeasures:
      "Waste product of creatine phosphate metabolism in muscle. Freely filtered by the glomerulus and not significantly reabsorbed — serves as a proxy for glomerular filtration rate (GFR). Confounded by muscle mass.",
    whyItMatters:
      "Rising creatinine signals declining kidney function. Trend over time is more informative than a single value. eGFR (calculated from creatinine) provides better functional kidney assessment. Muscular individuals normally have higher creatinine (not pathological).",
    mechanism: "Creatine → creatinine at a rate proportional to muscle mass. Reduction in GFR reduces creatinine clearance → rising serum levels. NSAIDs and contrast dye can transiently impair GFR → acute creatinine elevation.",
    targetDescription: "Typical range: 0.7–1.1 mg/dL (women ~0.5–0.9). Values in muscular athletes may be 1.2–1.4 without pathology. More useful as trend than single number.",
    recheckFrequency: "Annually. More frequently if trending upward or if on medications affecting kidneys.",
    whatRaisesIt: ["Progressive kidney disease", "Dehydration", "High muscle mass (not pathological)", "NSAIDs, contrast dye (transient)", "Rhabdomyolysis", "Certain medications"],
    whatLowersIt: ["Good hydration", "Treating underlying kidney disease cause", "Resolution of dehydration"],
    references: ["Stevens LA et al. Ann Intern Med. 2006; 145(4):247-254."],
    aliases: ["creatinine", "serum creatinine", "creat"],
  },
  {
    id: "egfr",
    name: "eGFR",
    shortName: "eGFR",
    unit: "mL/min/1.73m²",
    tier: 3,
    evidence: "green",
    category: "organ",
    scoring: { type: "higher", ideal: 90, acceptable: 60, flag: 45 },
    lbsWeight: 0.07,
    whatItMeasures:
      "Estimated glomerular filtration rate — calculated from serum creatinine, age, sex (and previously race). Best accessible functional measure of kidney health without formal GFR testing.",
    whyItMatters:
      "Declining eGFR is a major independent predictor of cardiovascular mortality, cognitive decline, and all-cause mortality. CKD is frequently undetected. A decline of >3 mL/min/year warrants clinical investigation. Even 'mildly reduced' eGFR (60–90) significantly increases cardiovascular risk.",
    mechanism: "GFR reflects the rate of blood filtered by the kidneys. Progressive nephron loss (from hypertension, diabetes, autoimmune, genetic, or ischaemic causes) permanently reduces GFR. Blood pressure control is the most important modifiable factor for preserving GFR.",
    targetDescription: "Normal (G1): >90. Mildly reduced (G2): 60–90. Mild-moderate (G3a): 45–60 — clinical attention warranted. Moderate-severe (G3b): 30–45. Severe (G4): 15–30. Kidney failure (G5): <15.",
    recheckFrequency: "Annually if normal. Every 3–6 months if declining or <60.",
    whatRaisesIt: ["Good blood pressure control", "Treatment of underlying kidney disease", "Good hydration", "Modest aerobic exercise (improves renal perfusion)"],
    whatLowersIt: [
      "Uncontrolled hypertension (most important driver of CKD progression)",
      "Uncontrolled diabetes",
      "NSAIDs and nephrotoxic medications",
      "Contrast dye without adequate hydration",
      "Recurrent urinary tract infections",
      "Smoking",
    ],
    references: ["Levey AS et al. Ann Intern Med. 2009; 150(9):604-612."],
    aliases: ["egfr", "gfr", "estimated gfr", "glomerular filtration rate"],
  },
  {
    id: "alt",
    name: "ALT",
    shortName: "ALT",
    unit: "U/L",
    tier: 3,
    evidence: "green",
    category: "organ",
    scoring: { type: "lower", ideal: 25, acceptable: 35, flag: 50 },
    lbsWeight: 0.03,
    whatItMeasures:
      "Alanine aminotransferase — a liver enzyme that leaks into the bloodstream when hepatocytes are stressed or damaged. The most sensitive accessible marker of hepatocellular injury.",
    whyItMatters:
      "Chronic low-grade ALT elevation (25–50 U/L) is the commonest laboratory signal of metabolic-dysfunction-associated steatotic liver disease (MASLD, formerly NAFLD) — affecting ~30% of adults and strongly linked to insulin resistance, systemic inflammation, and cardiovascular risk. Most labs normalise ALT up to 40–45 U/L — this is a population norm, not an optimal target. Longevity medicine targets <25 U/L.",
    mechanism: "Hepatocellular stress from lipid accumulation, fructose overload, or toxic injury causes membrane disruption → ALT release into plasma. Chronic ALT elevation reflects ongoing steatohepatitis with fibro-inflammatory activity.",
    targetDescription: "Longevity ideal: <25 U/L. Acceptable: <35. Borderline (clinical attention): >40. Significant: >3× upper limit of normal.",
    recheckFrequency: "Every 3–6 months if elevated; annually once normal.",
    whatRaisesIt: [
      "Excess alcohol (even moderate amounts in some individuals)",
      "Fructose / sugar-sweetened beverage excess",
      "Metabolic syndrome and visceral obesity (MASLD)",
      "Statins (mild, usually benign transaminitis)",
      "NSAIDs and some supplements (kava, valerian, high-dose niacin)",
      "Viral hepatitis (B, C)",
    ],
    whatLowersIt: [
      "Weight loss (most potent intervention for MASLD — 7–10% body weight reduction can normalise ALT)",
      "Alcohol elimination",
      "Reduced fructose and added sugar intake",
      "Aerobic exercise (reduces hepatic steatosis independently of weight loss)",
      "Coffee consumption (hepatoprotective — 2+ cups/day associated with lower ALT)",
    ],
    references: [
      "Chalasani N et al. Hepatology. 2018; 67(1):328-357.",
      "European Association for the Study of the Liver. J Hepatol. 2016; 64(6):1388-1402.",
    ],
    aliases: ["alt", "alanine aminotransferase", "alanine transaminase", "sgpt"],
  },
  {
    id: "vitamin-d",
    name: "Vitamin D (25-OH)",
    shortName: "Vit D",
    unit: "ng/mL",
    tier: 3,
    evidence: "yellow",
    category: "organ",
    scoring: { type: "range", ideal: 0, acceptable: 0, flag: 0, idealMin: 40, idealMax: 70, acceptableMin: 30, acceptableMax: 80 },
    lbsWeight: 0,
    whatItMeasures: "25-hydroxyvitamin D — the storage and transport form of vitamin D in the body; the standard marker of vitamin D status. Synthesised in the liver from cholecalciferol (D3) obtained from skin synthesis or dietary sources.",
    whyItMatters:
      "Deficiency (<20 ng/mL) impairs immune function, increases pro-inflammatory cytokines, reduces bone density, impairs muscle function, and is associated with cardiovascular risk, depression, and accelerated immune aging. Prevalence of deficiency/insufficiency exceeds 40% in Western populations. Optimising D levels is low-cost and broadly beneficial — especially relevant if hs-CRP is elevated.",
    mechanism: "Active calcitriol (1,25-OH D) binds VDR nuclear receptors in immune cells, modulating gene expression of >1,000 genes involved in inflammation, immune tolerance, and cellular metabolism. VDR activation promotes T-regulatory cell differentiation — suppressing autoimmune and chronic inflammatory activity.",
    targetDescription: "Deficient: <20 ng/mL. Insufficient: 20–30. Acceptable: 30–50. Optimal for longevity: 40–70. Toxicity concern: >100 ng/mL (with supplementation). Get tested before dosing >4,000 IU/day.",
    recheckFrequency: "Every 6 months initially; annually once stable.",
    whatRaisesIt: ["Midday sun exposure (UVB on skin — most potent source)", "Vitamin D3 supplementation (superior to D2)", "Vitamin K2 co-supplementation (improves calcium routing)"],
    whatLowersIt: ["Limited sun exposure / indoor lifestyle", "Dark skin pigmentation (melanin reduces UVB synthesis)", "Obesity (D3 sequestered in adipose)", "Malabsorption disorders", "Ageing (reduced dermal synthesis)", "Kidney disease (impairs conversion)"],
    references: [
      "Holick MF. N Engl J Med. 2007; 357(3):266-281.",
      "Hossein-nezhad A, Holick MF. Mayo Clin Proc. 2013; 88(7):720-755.",
    ],
    aliases: ["vitamin d", "25-oh d", "25(oh)d", "vit d", "vitamin d3", "25-hydroxyvitamin d"],
  },

  // ── Tier 4: Advanced ──────────────────────────────────────────────────────
  {
    id: "ferritin",
    name: "Ferritin",
    shortName: "Ferritin",
    unit: "ng/mL",
    tier: 4,
    evidence: "yellow",
    category: "organ",
    isAdvanced: true,
    scoring: { type: "range", ideal: 0, acceptable: 0, flag: 0, idealMin: 50, idealMax: 100, acceptableMin: 30, acceptableMax: 150 },
    lbsWeight: 0,
    whatItMeasures:
      "Iron storage protein — a complex of ferritin protein and iron. Serum ferritin reflects body iron stores but is also an acute-phase reactant, rising with inflammation independent of iron status.",
    whyItMatters:
      "Low ferritin (<30 ng/mL) indicates iron depletion — causing fatigue, impaired exercise performance, and anaemia. Very high ferritin (>200–300 ng/mL) may signal iron overload (haemochromatosis), systemic inflammation, metabolic syndrome, or liver disease. Iron overload promotes oxidative stress via the Fenton reaction (Fe²⁺ + H₂O₂ → OH• radical), accelerating cellular aging. Always interpret ferritin with hs-CRP — if both are elevated, the elevated ferritin may be inflammatory rather than iron overload.",
    mechanism: "Ferritin stores iron in a non-toxic form. Excess iron in the form of non-transferrin-bound iron (NTBI) — seen in haemochromatosis — generates hydroxyl radicals, damages mitochondrial DNA, and promotes hepatic and cardiac injury.",
    targetDescription: "Ideal: 50–100 ng/mL (men 50–150 acceptable). Depleted: <30 (supplementation may be needed). Borderline high: 150–200 (investigate cause). Elevated: >200 (always check CRP; if CRP normal, investigate haemochromatosis). Alarm: >500.",
    recheckFrequency: "Annually; every 3–6 months if treating iron overload or deficiency.",
    whatRaisesIt: ["Iron supplementation", "High red meat (haem iron) intake", "Haemochromatosis (genetic)", "Chronic inflammation (elevates ferritin independently of iron stores)", "Alcohol", "Haemolysis"],
    whatLowersIt: ["Blood donation (most effective for iron overload)", "Reduced red meat intake", "Phytate-rich foods (whole grains, legumes — reduce haem iron absorption)", "Resolution of inflammation (if ferritin was inflammation-driven)"],
    references: [
      "Worwood M. Br J Haematol. 1997; 99(2):248-255.",
      "Sullivan JL. Lancet. 1981; 1(8233):1293-1294.",
    ],
    aliases: ["ferritin", "serum ferritin"],
  },
  {
    id: "uric-acid",
    name: "Uric Acid",
    shortName: "Uric Acid",
    unit: "mg/dL",
    tier: 4,
    evidence: "yellow",
    category: "metabolic",
    isAdvanced: true,
    scoring: { type: "lower", ideal: 5.0, acceptable: 6.0, flag: 7.0 },
    lbsWeight: 0,
    whatItMeasures:
      "End product of purine metabolism (from adenine and guanine nucleotide breakdown). Excreted by the kidneys. Serum level reflects the balance between production and excretion.",
    whyItMatters:
      "Elevated uric acid (>6.5 mg/dL in women; >7.0 mg/dL in men) is the primary cause of gout. It is also an independent marker of insulin resistance, metabolic syndrome, hypertension, and cardiovascular risk. Fructose uniquely drives uric acid production via the AMP deaminase pathway — the main dietary driver in modern diets.",
    mechanism: "Fructose → fructose-1-phosphate via fructokinase → rapid ATP depletion → AMP accumulation → AMP deaminase → inosine → hypoxanthine → xanthine → uric acid (via xanthine oxidase). High uric acid activates the NLRP3 inflammasome (gout mechanism) and also independently increases cardiovascular risk through endothelial dysfunction and oxidative stress.",
    targetDescription: "Ideal: <5.0 mg/dL. Acceptable: <6.0 (women), <6.5 (men). Gout threshold: >6.0 (women), >7.0 (men). Treat with urate-lowering therapy if repeated gout attacks.",
    recheckFrequency: "Annually; every 3 months while treating gout or hyperuricaemia.",
    whatRaisesIt: [
      "Fructose (especially from sugar-sweetened beverages, HFCS, fruit juice — not whole fruit)",
      "Alcohol (especially beer — rich in purines; all alcohol reduces renal uric acid excretion)",
      "Purine-rich foods (organ meats, anchovies, sardines, shellfish)",
      "Dehydration",
      "Diuretics (thiazide and loop)",
      "Obesity and insulin resistance (reduce renal uric acid excretion)",
    ],
    whatLowersIt: [
      "Hydration (most immediate effect — dilutes and increases excretion)",
      "Fructose reduction (the primary dietary driver)",
      "Alcohol reduction / elimination",
      "Weight loss",
      "Vitamin C (modest uricosuric effect, ~0.5 mg/dL at 500mg/day)",
      "Tart cherry / cherry extract (minor anti-inflammatory; modest uric acid reduction)",
      "Allopurinol or febuxostat (xanthine oxidase inhibitors — medication if clinically indicated)",
    ],
    references: [
      "Johnson RJ et al. N Engl J Med. 2008; 359(18):1811-1821.",
      "Feig DI et al. N Engl J Med. 2008; 359(19):1811-1821.",
    ],
    aliases: ["uric acid", "urate", "serum uric acid"],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getBiomarker(id: string): BiomarkerDefinition | undefined {
  return BIOMARKERS.find((b) => b.id === id);
}

export function getBiomarkersByCategory(category: BiomarkerCategory): BiomarkerDefinition[] {
  return BIOMARKERS.filter((b) => b.category === category);
}

export function matchBiomarkerAlias(name: string): BiomarkerDefinition | undefined {
  const lower = name.toLowerCase().trim();
  return BIOMARKERS.find((b) => b.aliases.some((a) => a.toLowerCase() === lower));
}

export const CATEGORY_LABELS: Record<BiomarkerCategory, string> = {
  inflammation: "Inflammation",
  metabolic: "Metabolic",
  cardiovascular: "Cardiovascular",
  organ: "Organ Function",
};

export const CATEGORY_WEIGHTS: Record<BiomarkerCategory, number> = {
  inflammation: 0.30,
  metabolic: 0.35,
  cardiovascular: 0.25,
  organ: 0.10,
};
