import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  categoryBg,
  categoryColor,
  categoryToPercentileLabel,
  CATEGORY_LABELS,
  getMetricNormsForProfile,
  type FitnessCategory,
} from "@/lib/capacity/scoring";
import { loadProfile, getLatestCapacityResults } from "@/lib/capacity/store";
import { Info, ExternalLink } from "lucide-react";

// ─── Population percentile bands per category ─────────────────────────────────

const PERCENTILE_BANDS: Record<FitnessCategory, string> = {
  excellent: "Top ~15%  (≈85th–99th pct)",
  good:      "Top ~35%  (≈65th–85th pct)",
  average:   "~Middle   (≈35th–65th pct)",
  fair:      "~Bottom 35%  (≈15th–35th pct)",
  low:       "~Bottom 15%  (<15th pct)",
};

const ORDERED_CATS: FitnessCategory[] = ["excellent", "good", "average", "fair", "low"];

// ─── Metric metadata ──────────────────────────────────────────────────────────

interface MetricMeta {
  key: string;
  label: string;
  unit: string;
  direction: "higher" | "lower";
  significance: string;
  source: string;
  ageAdjusted: boolean;
}

const METRICS: MetricMeta[] = [
  {
    key: "vo2max",
    label: "VO2max (Cardiorespiratory Fitness)",
    unit: "mL/kg/min",
    direction: "higher",
    significance:
      "The strongest single predictor of all-cause mortality. Each 3.5 mL/kg/min improvement is associated with ~15% lower mortality risk. A VO2max below 25 confers greater risk than smoking.",
    source: "ACSM Guidelines for Exercise Testing & Prescription; Cooper Institute Fitnessgram",
    ageAdjusted: true,
  },
  {
    key: "grip",
    label: "Grip Strength",
    unit: "kg",
    direction: "higher",
    significance:
      "Grip strength is a proxy for overall musculoskeletal reserve. Low grip is independently associated with cardiovascular disease, hospitalisation, and earlier death (Leong et al., Lancet 2015 — 140,000 participants across 17 countries).",
    source: "Leong DP et al. Lancet 2015; NHANES population data",
    ageAdjusted: true,
  },
  {
    key: "sitToStand",
    label: "30-sec Sit-to-Stand",
    unit: "reps",
    direction: "higher",
    significance:
      "Measures lower-body strength and functional mobility. Low sit-to-stand performance predicts fall risk, functional decline, and frailty. Validated as part of the Senior Fitness Test battery.",
    source: "Rikli & Jones Senior Fitness Test Manual (2nd ed.)",
    ageAdjusted: true,
  },
  {
    key: "stepTest",
    label: "1-Minute Step Test",
    unit: "steps/min",
    direction: "higher",
    significance:
      "A submaximal cardiovascular endurance test. Higher step counts indicate better aerobic capacity and cardiovascular efficiency.",
    source: "Standardised fitness testing protocols (McArdle, Katch & Katch)",
    ageAdjusted: false,
  },
  {
    key: "balance",
    label: "Single-Leg Balance",
    unit: "seconds",
    direction: "higher",
    significance:
      "Proprioception and neuromuscular control decline with age. Single-leg stand time <10s is associated with significantly elevated fall and injury risk. Highly trainable at any age.",
    source: "General neuromuscular assessment standards; NHANES balance data",
    ageAdjusted: false,
  },
  {
    key: "restingHR",
    label: "Resting Heart Rate",
    unit: "bpm",
    direction: "lower",
    significance:
      "Lower resting HR reflects higher cardiovascular efficiency and parasympathetic tone. Every 10 bpm increase above 60 is associated with ~10–20% higher cardiovascular event risk in longitudinal studies.",
    source: "General cardiovascular physiology norms; Cooney et al. BMJ 2010",
    ageAdjusted: false,
  },
];

// ─── FRS component weights ────────────────────────────────────────────────────

const FRS_WEIGHTS = [
  { label: "VO2max",       pct: 35, color: "#10b981" },
  { label: "Grip strength",pct: 25, color: "#22d3ee" },
  { label: "Mobility",     pct: 20, color: "#f59e0b" },
  { label: "Balance",      pct: 10, color: "#a78bfa" },
  { label: "Resting HR",   pct: 10, color: "#f87171" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReferencePage() {
  const profile = useMemo(() => loadProfile(), []);
  const norms = useMemo(() => getMetricNormsForProfile(profile), [profile]);
  const latest = useMemo(() => getLatestCapacityResults(), []);

  const ageLabel =
    profile.age < 30 ? "18–29" :
    profile.age < 40 ? "30–39" :
    profile.age < 50 ? "40–49" :
    profile.age < 60 ? "50–59" : "60+";

  const sexLabel = profile.sex === "male" ? "males" : "females";

  // Map metric key to latest value
  const latestValues: Record<string, number | null> = {
    vo2max:     latest["vo2max"]?.value ?? null,
    grip:       latest["grip-strength"]?.value ?? null,
    sitToStand: latest["sit-to-stand"]?.value ?? null,
    stepTest:   latest["step-test"]?.value ?? null,
    balance:    latest["balance"]?.value ?? null,
    restingHR:  null, // comes from daily metrics — shown as note
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reference Ranges</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Normative data personalised to your profile —{" "}
            <span className="font-medium text-foreground">
              {profile.sex === "male" ? "Male" : "Female"}, age {profile.age}
            </span>
            . Edit your profile in the <a href="/capacity" className="underline hover:text-foreground transition-colors">Capacity page</a>.
          </p>
        </div>

        {/* Disclaimer */}
        <Card className="bg-muted/30 border-border/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Reference ranges are population averages from published peer-reviewed research. Individual variation is significant and these thresholds do not constitute medical advice. Percentile estimates are approximate — exact values vary between studies, populations, and measurement protocols.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Metric reference cards */}
        {METRICS.map((meta) => {
          const norm = norms[meta.key as keyof typeof norms];
          const currentVal = latestValues[meta.key];

          // Determine user's category from their current value
          let userCat: FitnessCategory | null = null;
          if (currentVal !== null && norm) {
            if (meta.direction === "higher") {
              userCat =
                currentVal >= norm.excellent ? "excellent" :
                currentVal >= norm.good      ? "good"      :
                currentVal >= norm.average   ? "average"   :
                currentVal >= norm.fair      ? "fair"      : "low";
            } else {
              userCat =
                currentVal <= norm.excellent ? "excellent" :
                currentVal <= norm.good      ? "good"      :
                currentVal <= norm.average   ? "average"   :
                currentVal <= norm.fair      ? "fair"      : "low";
            }
          }

          return (
            <Card key={meta.key}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <CardTitle className="text-base">{meta.label}</CardTitle>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {meta.ageAdjusted && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-0 bg-muted text-muted-foreground">
                        {sexLabel} {ageLabel}
                      </Badge>
                    )}
                    {currentVal !== null && userCat && (
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 h-4 border-0 ${categoryBg(userCat)} ${categoryColor(userCat)}`}
                      >
                        Your value: {currentVal} {meta.unit} — {CATEGORY_LABELS[userCat]}
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">{meta.significance}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Threshold table */}
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/40 border-b">
                        <th className="text-left p-2.5 font-semibold text-muted-foreground">Category</th>
                        <th className="text-left p-2.5 font-semibold text-muted-foreground">
                          Threshold ({meta.unit})
                        </th>
                        <th className="text-left p-2.5 font-semibold text-muted-foreground">~Population</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ORDERED_CATS.map((cat, i) => {
                        const isUser = userCat === cat;
                        const threshold = buildThresholdLabel(cat, norm, meta.direction);
                        return (
                          <tr
                            key={cat}
                            className={`border-b last:border-b-0 transition-colors ${isUser ? "bg-primary/5" : i % 2 === 0 ? "bg-background" : "bg-muted/20"}`}
                          >
                            <td className="p-2.5">
                              <span className={`font-semibold ${categoryColor(cat)}`}>
                                {CATEGORY_LABELS[cat]}
                              </span>
                              {isUser && (
                                <span className="ml-2 text-[10px] text-primary font-semibold">← you</span>
                              )}
                            </td>
                            <td className="p-2.5 tabular-nums text-foreground">{threshold}</td>
                            <td className="p-2.5 text-muted-foreground">{PERCENTILE_BANDS[cat]}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Source */}
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  Source: {meta.source}
                </p>
              </CardContent>
            </Card>
          );
        })}

        {/* FRS weighting card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">FRS Composite Weighting</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              The Functional Reserve Score (FRS) is a weighted composite of the five capacity metrics above.
              VO2max receives the highest weight because it has the strongest evidence base for predicting healthspan.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {FRS_WEIGHTS.map((w) => (
                <div key={w.label} className="flex items-center gap-3">
                  <span className="text-sm w-32 flex-shrink-0">{w.label}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${w.pct * 2}%`, backgroundColor: w.color }}
                    />
                  </div>
                  <span className="text-sm font-semibold tabular-nums w-10 text-right" style={{ color: w.color }}>
                    {w.pct}%
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-4 leading-relaxed">
              FRS 0–100: ≥80 = High Reserve · 60–79 = Good · 40–59 = Reduced · &lt;40 = Low Reserve.
              Weights derived from effect sizes in longitudinal mortality and function-decline studies.
            </p>
          </CardContent>
        </Card>

      </div>
    </ScrollArea>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildThresholdLabel(
  cat: FitnessCategory,
  norm: { excellent: number; good: number; average: number; fair: number },
  direction: "higher" | "lower"
): string {
  const { excellent, good, average, fair } = norm;

  if (direction === "higher") {
    switch (cat) {
      case "excellent": return `≥ ${excellent}`;
      case "good":      return `${good} – ${excellent - 0.1}`;
      case "average":   return `${average} – ${good - 0.1}`;
      case "fair":      return `${fair} – ${average - 0.1}`;
      case "low":       return `< ${fair}`;
    }
  } else {
    // lower is better (resting HR)
    switch (cat) {
      case "excellent": return `≤ ${excellent}`;
      case "good":      return `${excellent + 1} – ${good}`;
      case "average":   return `${good + 1} – ${average}`;
      case "fair":      return `${average + 1} – ${fair}`;
      case "low":       return `> ${fair}`;
    }
  }
}
