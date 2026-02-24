import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { PASGauge, MiniGauge } from "@/components/pas-gauge";
import { PlanCard } from "@/components/plan-card";
import { SupplementCard } from "@/components/supplement-card";
import { useMetrics } from "@/lib/metricsStore";
import {
  computeRollingPAS,
  computeILI,
  computeDailyPAS,
  computeSubscores,
  getPASTrend,
  getBaseline,
  computeTopDrivers,
  computeSleepConsistency,
} from "@/lib/scoring";
import { generateTodaysPlan } from "@/lib/rules";
import { AreaChart, Area, ResponsiveContainer, Tooltip as RTooltip, YAxis } from "recharts";
import {
  TrendingDown, TrendingUp, Minus, Edit3,
  Heart, Moon, ShieldCheck, AlertTriangle as TriangleAlert,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function HomePage() {
  const { metrics, showExperimental, updateToday } = useMetrics();
  const today = metrics[metrics.length - 1];
  const [editOpen, setEditOpen] = useState(false);

  const pas = useMemo(() => computeRollingPAS(metrics), [metrics]);
  const ili = useMemo(() => computeILI(today, metrics), [today, metrics]);
  const plan = useMemo(
    () => generateTodaysPlan(today, metrics, showExperimental),
    [today, metrics, showExperimental]
  );

  const sparklineData = useMemo(() => {
    const last7 = metrics.slice(-7);
    return last7.map((m, i) => ({
      day: i,
      pas: computeDailyPAS(m, metrics),
      date: new Date(m.date).toLocaleDateString("en-US", { weekday: "short" }),
    }));
  }, [metrics]);

  const subscores = useMemo(() => computeSubscores(today, metrics), [today, metrics]);

  const pasHistory = useMemo(
    () => metrics.map((m) => computeDailyPAS(m, metrics)),
    [metrics]
  );
  const trend = getPASTrend(pasHistory);

  // Recovery snapshot
  const hrvBaseline = useMemo(() => getBaseline(metrics, "hrv", 21), [metrics]);
  const hrBaseline = useMemo(() => getBaseline(metrics, "restingHR", 21), [metrics]);
  const hrvDiffPct = hrvBaseline > 0 ? Math.round(((today.hrv - hrvBaseline) / hrvBaseline) * 100) : 0;
  const hrDiff = hrBaseline > 0 ? Math.round(today.restingHR - hrBaseline) : 0;
  const sleepConsistency = useMemo(() => computeSleepConsistency(metrics, 7), [metrics]);

  // Top drivers
  const drivers = useMemo(() => computeTopDrivers(today, metrics), [today, metrics]);
  const increasingDrivers = drivers.filter((d) => d.delta > 0).slice(0, 3);
  const protectiveDrivers = drivers.filter((d) => d.delta < 0).slice(0, 1);

  const TrendIcon =
    trend === "improving" ? TrendingDown :
    trend === "worsening" ? TrendingUp : Minus;

  const trendText =
    trend === "improving" ? "Improving" :
    trend === "worsening" ? "Worsening" : "Stable";

  const trendColor =
    trend === "improving" ? "text-emerald-500" :
    trend === "worsening" ? "text-red-500" : "text-muted-foreground";

  return (
    <ScrollArea className="h-full">
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Daily Control</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {new Date(today.date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <Sheet open={editOpen} onOpenChange={setEditOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-edit-today">
                <Edit3 className="w-4 h-4 mr-1.5" />
                Edit Today
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Edit Today's Metrics</SheetTitle>
              </SheetHeader>
              <div className="space-y-5 mt-4">

                {/* Recovery */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Recovery</p>
                  <div className="space-y-4">
                    <MetricInput label="HRV (ms)" value={today.hrv} onChange={(v) => updateToday({ hrv: v })} min={10} max={120} />
                    <MetricInput label="Resting HR (bpm)" value={today.restingHR} onChange={(v) => updateToday({ restingHR: v })} min={35} max={110} />
                    <MetricInput label="Sleep Hours" value={today.sleepHours} onChange={(v) => updateToday({ sleepHours: v })} min={0} max={14} step={0.1} />
                    <MetricInput label="Awakenings" value={today.awakenings ?? 0} onChange={(v) => updateToday({ awakenings: v })} min={0} max={10} />
                  </div>
                </div>

                <Separator />

                {/* Sleep Timing */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Sleep Timing</p>
                  <div className="space-y-4">
                    <TimeInput
                      label="Bedtime"
                      value={today.bedtime ?? "22:30"}
                      onChange={(v) => updateToday({ bedtime: v })}
                    />
                    <TimeInput
                      label="Wake Time"
                      value={today.wakeTime ?? "06:30"}
                      onChange={(v) => updateToday({ wakeTime: v })}
                    />
                  </div>
                </div>

                <Separator />

                {/* Fitness */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Fitness</p>
                  <div className="space-y-4">
                    <MetricInput label="VO2max" value={today.vo2max} onChange={(v) => updateToday({ vo2max: v })} min={15} max={70} step={0.1} />
                    <MetricInput label="Zone 2 Minutes" value={today.zone2Minutes} onChange={(v) => updateToday({ zone2Minutes: v })} min={0} max={180} />
                    <div className="flex items-center justify-between">
                      <Label>Strength Session Today</Label>
                      <Switch
                        checked={today.strengthSessions === 1}
                        onCheckedChange={(c) => updateToday({ strengthSessions: c ? 1 : 0 })}
                        data-testid="switch-strength"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>HIIT Session Today</Label>
                      <Switch
                        checked={today.hiitSessions === 1}
                        onCheckedChange={(c) => updateToday({ hiitSessions: c ? 1 : 0 })}
                        data-testid="switch-hiit"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Diet & Behavior */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Diet & Behavior</p>
                  <div className="space-y-4">
                    <MetricInput label="Alcohol Drinks" value={today.alcoholDrinks} onChange={(v) => updateToday({ alcoholDrinks: v })} min={0} max={5} />
                    {today.alcoholDrinks > 0 && (
                      <TimeInput
                        label="Last Drink Time"
                        value={today.alcoholTiming ?? "20:00"}
                        onChange={(v) => updateToday({ alcoholTiming: v })}
                      />
                    )}
                    <div className="flex items-center justify-between">
                      <Label>Late Eating (after 8 PM)</Label>
                      <Switch
                        checked={today.lateEating}
                        onCheckedChange={(c) => updateToday({ lateEating: c })}
                        data-testid="switch-late-eating"
                      />
                    </div>
                    {today.lateEating && (
                      <TimeInput
                        label="Last Meal Time"
                        value={today.lateEatingTime ?? "21:00"}
                        onChange={(v) => updateToday({ lateEatingTime: v })}
                      />
                    )}
                  </div>
                </div>

                <Separator />

                {/* Environment & Metabolic */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Environment & Metabolic</p>
                  <div className="space-y-4">
                    <MetricInput label="AQI" value={today.aqi} onChange={(v) => updateToday({ aqi: v })} min={0} max={300} />
                    <MetricInput label="Glucose Spike Score" value={today.glucoseSpikeScore ?? 0} onChange={(v) => updateToday({ glucoseSpikeScore: v })} min={0} max={100} />
                    <MetricInput label="Sleep Regularity (0-100)" value={today.sleepRegularityScore} onChange={(v) => updateToday({ sleepRegularityScore: v })} min={0} max={100} />
                  </div>
                </div>

              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* ── Main layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column */}
          <div className="lg:col-span-1 space-y-4">

            {/* PAS Gauge */}
            <Card data-testid="card-pas-main">
              <CardContent className="pt-6 pb-4 flex flex-col items-center">
                <PASGauge value={pas} />
                <div className="w-full mt-4">
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-xs text-muted-foreground font-medium">7-Day Trend</span>
                    <div className={`flex items-center gap-1 ${trendColor}`}>
                      <TrendIcon className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">{trendText}</span>
                    </div>
                  </div>
                  <div className="h-16 w-full" data-testid="chart-sparkline">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sparklineData}>
                        <defs>
                          <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <YAxis domain={[0, 100]} hide />
                        <RTooltip
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "6px",
                            fontSize: "12px",
                          }}
                          formatter={(value: number) => [`PAS: ${value}`, ""]}
                          labelFormatter={(_, payload) => {
                            if (payload?.[0]?.payload?.date) return payload[0].payload.date;
                            return "";
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="pas"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          fill="url(#sparkGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recovery Snapshot */}
            <Card data-testid="card-recovery-snapshot">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500" />
                  Recovery Snapshot
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2.5">
                  <RecoveryRow
                    label="HRV"
                    value={`${today.hrv} ms`}
                    delta={`${hrvDiffPct > 0 ? "+" : ""}${hrvDiffPct}%`}
                    deltaPositive={hrvDiffPct >= 0}
                    sub="vs 21d baseline"
                  />
                  <RecoveryRow
                    label="Resting HR"
                    value={`${today.restingHR} bpm`}
                    delta={`${hrDiff > 0 ? "+" : ""}${hrDiff} bpm`}
                    deltaPositive={hrDiff <= 0}
                    sub="vs 21d baseline"
                  />
                  <RecoveryRow
                    label="Sleep last night"
                    value={`${today.sleepHours} hrs`}
                    valueColor={
                      today.sleepHours >= 7 ? "text-emerald-500" :
                      today.sleepHours >= 6 ? "text-amber-500" : "text-red-500"
                    }
                  />
                  <RecoveryRow
                    label="Sleep consistency"
                    value={`${sleepConsistency}/100`}
                    valueColor={
                      sleepConsistency >= 80 ? "text-emerald-500" :
                      sleepConsistency >= 60 ? "text-amber-500" : "text-red-500"
                    }
                    sub="7-day timing variability"
                  />
                  {today.awakenings !== undefined && (
                    <RecoveryRow
                      label="Awakenings"
                      value={`${today.awakenings}×`}
                      valueColor={
                        today.awakenings <= 1 ? "text-emerald-500" :
                        today.awakenings <= 3 ? "text-amber-500" : "text-red-500"
                      }
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ILI */}
            <Card data-testid="card-ili">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2 flex-wrap">
                <CardTitle className="text-sm font-medium">Inflammatory Load</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <MiniGauge value={ili} label="" size={72} />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Composite of HRV depression, sleep disruption, glucose spikes, alcohol, and air quality exposure.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PAS Breakdown */}
            <Card data-testid="card-subscores">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">PAS Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2.5">
                  <SubscoreBar label="Recovery" value={subscores.recovery} weight="30%" />
                  <SubscoreBar label="Metabolic" value={subscores.metabolic} weight="20%" />
                  <SubscoreBar label="Fitness" value={subscores.fitness} weight="25%" />
                  <SubscoreBar label="Inflammatory" value={subscores.inflammatory} weight="15%" />
                  <SubscoreBar label="Environmental" value={subscores.environmental} weight="10%" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-4">

            {/* Top Drivers Today */}
            <Card data-testid="card-top-drivers">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Top Drivers Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  {/* Increasing */}
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                      Increasing PAS
                    </p>
                    <div className="space-y-2">
                      {increasingDrivers.length > 0 ? (
                        increasingDrivers.map((d) => (
                          <div key={d.label} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <TriangleAlert className="w-3 h-3 text-red-500 flex-shrink-0" />
                              <span className="text-xs font-medium">{d.label}</span>
                            </div>
                            <span className="text-xs font-semibold text-red-500 tabular-nums">
                              +{d.delta}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">All scores at neutral</p>
                      )}
                    </div>
                  </div>

                  {/* Protective */}
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                      Protective
                    </p>
                    <div className="space-y-2">
                      {protectiveDrivers.length > 0 ? (
                        protectiveDrivers.map((d) => (
                          <div key={d.label} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <ShieldCheck className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                              <span className="text-xs font-medium">{d.label}</span>
                            </div>
                            <span className="text-xs font-semibold text-emerald-500 tabular-nums">
                              {d.delta}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">No protective factors</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Today's Plan */}
            <h2 className="text-lg font-semibold tracking-tight" data-testid="text-plan-heading">Today's Plan</h2>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <PlanCard plan={plan.exercise} />
              <PlanCard plan={plan.diet} />
              <SupplementCard plan={plan.supplements} />
              <PlanCard plan={plan.sleep} />
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function RecoveryRow({
  label,
  value,
  delta,
  deltaPositive,
  valueColor,
  sub,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
  valueColor?: string;
  sub?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <span className="text-xs text-muted-foreground">{label}</span>
        {sub && <p className="text-[10px] text-muted-foreground/60">{sub}</p>}
      </div>
      <div className="flex items-center gap-1.5 text-right">
        <span className={`text-sm font-semibold tabular-nums ${valueColor ?? ""}`}>{value}</span>
        {delta && (
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 h-4 border-0 tabular-nums ${
              deltaPositive
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
            }`}
          >
            {delta}
          </Badge>
        )}
      </div>
    </div>
  );
}

function MetricInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        data-testid={`input-${label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
      />
    </div>
  );
}

function TimeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      <Input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={`input-${label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
      />
    </div>
  );
}

function SubscoreBar({ label, value, weight }: { label: string; value: number; weight: string }) {
  const getColor = (v: number) => {
    if (v <= 30) return "bg-emerald-500";
    if (v <= 55) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{weight}</span>
          <span className="text-xs font-semibold tabular-nums w-6 text-right">{value}</span>
        </div>
      </div>
      <div className="h-1.5 bg-muted rounded-full">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getColor(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
