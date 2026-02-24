import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RiskDial } from "@/components/risk-dial";
import { useMetrics } from "@/lib/metricsStore";
import { computeRollingPAS, computeILI } from "@/lib/scoring";
import { RiskCategory } from "@shared/schema";
import { AlertTriangle, Info } from "lucide-react";

function computeRiskCategories(
  avgPAS: number,
  avgILI: number,
  latestMetrics: { vo2max: number; sleepHours: number; strengthSessions: number }
): RiskCategory[] {
  const cardioScore = Math.round(
    avgPAS * 0.35 + avgILI * 0.35 + (100 - latestMetrics.vo2max * 2) * 0.30
  );
  const cardioLevel = cardioScore <= 35 ? "low" : cardioScore <= 60 ? "moderate" : "high";

  const neuroScore = Math.round(
    avgPAS * 0.30 + avgILI * 0.30 +
    (100 - latestMetrics.sleepHours * 12) * 0.25 +
    (100 - latestMetrics.vo2max * 1.5) * 0.15
  );
  const neuroLevel = neuroScore <= 35 ? "low" : neuroScore <= 60 ? "moderate" : "high";

  const msScore = Math.round(
    avgPAS * 0.25 + avgILI * 0.20 +
    (100 - latestMetrics.vo2max * 2) * 0.30 +
    (latestMetrics.strengthSessions ? 0 : 50) * 0.25
  );
  const msLevel = msScore <= 35 ? "low" : msScore <= 60 ? "moderate" : "high";

  return [
    {
      name: "Cardiometabolic Trajectory",
      level: cardioLevel,
      score: Math.min(100, Math.max(0, cardioScore)),
      description:
        "Based on chronic inflammation markers, metabolic health signals, and cardiovascular fitness. Higher PAS and inflammatory load correlate with increased cardiometabolic risk over time.",
    },
    {
      name: "Neurocognitive Trajectory",
      level: neuroLevel,
      score: Math.min(100, Math.max(0, neuroScore)),
      description:
        "Driven by sleep quality, inflammatory load, and cardiovascular fitness. Chronic sleep disruption and high inflammation are associated with accelerated cognitive aging.",
    },
    {
      name: "Musculoskeletal / Frailty",
      level: msLevel,
      score: Math.min(100, Math.max(0, msScore)),
      description:
        "Reflects muscle maintenance through resistance training, overall fitness capacity, and inflammatory burden. Strength training is a key protective factor against frailty.",
    },
  ];
}

export default function HealthRiskPage() {
  const { metrics } = useMetrics();
  const today = metrics[metrics.length - 1];

  const last30 = useMemo(() => metrics.slice(-30), [metrics]);
  const avgPAS = useMemo(() => {
    const scores = last30.map((m) => computeRollingPAS(metrics.slice(0, metrics.indexOf(m) + 1)));
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [last30, metrics]);
  const avgILI = useMemo(() => {
    const scores = last30.map((m) => computeILI(m, metrics));
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [last30, metrics]);

  const riskCategories = useMemo(
    () =>
      computeRiskCategories(avgPAS, avgILI, {
        vo2max: today.vo2max,
        sleepHours: today.sleepHours,
        strengthSessions: today.strengthSessions,
      }),
    [avgPAS, avgILI, today]
  );

  const iconKeys = ["cardiometabolic", "neurocognitive", "musculoskeletal"];

  return (
    <ScrollArea className="h-full">
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-risk-title">Health Risk</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Long-term trajectory guidance based on your data</p>
        </div>

        <Card className="bg-amber-50/50 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-800/30">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Important Disclaimer</p>
                <p className="text-xs text-amber-700/80 dark:text-amber-300/70 mt-1 leading-relaxed">
                  These trajectory estimates are for educational purposes only and are not a medical diagnosis.
                  They are based on simplified models using your daily metrics to suggest directional trends.
                  Always consult with healthcare professionals for medical decisions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {riskCategories.map((risk, idx) => (
            <RiskDial key={risk.name} risk={risk} iconKey={iconKeys[idx]} />
          ))}
        </div>

        <Card data-testid="card-risk-factors">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-base">Key Contributing Factors</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FactorCard
                title="Average PAS (30 days)"
                value={avgPAS}
                description="Your rolling physiologic aging score over the past month"
                isGood={avgPAS < 40}
              />
              <FactorCard
                title="Average Inflammatory Load"
                value={avgILI}
                description="Composite inflammatory signal from sleep, HRV, glucose, alcohol, and air quality"
                isGood={avgILI < 35}
              />
              <FactorCard
                title="VO2max"
                value={today.vo2max}
                unit="ml/kg/min"
                description="Higher VO2max is one of the strongest predictors of all-cause mortality reduction"
                isGood={today.vo2max >= 40}
              />
              <FactorCard
                title="Strength Training"
                value={today.strengthSessions ? "Active" : "Inactive"}
                description="Regular resistance training reduces frailty risk and supports metabolic health"
                isGood={today.strengthSessions === 1}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}

function FactorCard({
  title,
  value,
  unit,
  description,
  isGood,
}: {
  title: string;
  value: number | string;
  unit?: string;
  description: string;
  isGood: boolean;
}) {
  return (
    <div className="rounded-md bg-muted/40 p-4">
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-sm font-medium">{title}</span>
        <span className={`text-lg font-bold tabular-nums ${isGood ? "text-emerald-500" : "text-amber-500"}`}>
          {value}
          {unit && <span className="text-xs font-normal ml-0.5">{unit}</span>}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
