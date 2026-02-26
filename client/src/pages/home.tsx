import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { PASGauge } from "@/components/pas-gauge";
import { EvidenceBadge } from "@/components/evidence-badge";
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
import {
  TrendingDown, TrendingUp, Minus, Edit3,
  Heart, Moon,
  Activity, UtensilsCrossed, Pill, Info,
} from "lucide-react";
import type { PlanItem } from "@shared/schema";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  const driverMap = useMemo(() => Object.fromEntries(drivers.map((d) => [d.label, d.delta])), [drivers]);

  // Trigger signals (mirror rules.ts logic for label generation)
  const hrv21 = useMemo(() => getBaseline(metrics, "hrv"), [metrics]);
  const hr21  = useMemo(() => getBaseline(metrics, "restingHR"), [metrics]);
  const hrvBelow       = hrv21 > 0 && today.hrv < hrv21 * 0.85;
  const hrAbove        = hr21 > 0 && today.restingHR > hr21 * 1.08;
  const poorSleep      = today.sleepHours < 6.5;
  const highGlucose    = (today.glucoseSpikeScore ?? 0) > 70;
  const isRecoveryDay  = hrvBelow || poorSleep || hrAbove;
  const trendingUp     = trend === "worsening";
  const sleepDebt      = Math.max(0, 8 - today.sleepHours);
  const hrvSuppr       = hrv21 > 0 ? ((hrv21 - today.hrv) / hrv21) * 100 : 0;
  const hrElev         = hr21 > 0 ? ((today.restingHR - hr21) / hr21) * 100 : 0;
  const lowConsistency = today.sleepRegularityScore < 70;

  const exerciseTriggers: string[] = [];
  if (today.aqi > 100) exerciseTriggers.push(`AQI ${today.aqi}`);
  else if (isRecoveryDay) {
    if (hrvBelow) exerciseTriggers.push(`HRV ${hrvDiffPct}%`);
    if (poorSleep) exerciseTriggers.push(`Sleep ${today.sleepHours}h`);
    if (hrAbove)   exerciseTriggers.push(`HR +${Math.abs(hrDiff)} bpm`);
  } else if (trendingUp) exerciseTriggers.push("PAS trending up");

  const dietTriggers: string[] = [];
  if (highGlucose)            dietTriggers.push("Glucose spike");
  if (today.lateEating)        dietTriggers.push("Late eating");
  if (today.alcoholDrinks > 0) dietTriggers.push(`${today.alcoholDrinks} drink${today.alcoholDrinks > 1 ? "s" : ""}`);

  const sleepTriggers: string[] = [];
  if (sleepDebt > 0.5)      sleepTriggers.push(`Debt ${sleepDebt.toFixed(1)}h`);
  if (hrvSuppr > 15)         sleepTriggers.push(`HRV −${Math.round(hrvSuppr)}%`);
  if (hrElev > 8)            sleepTriggers.push(`HR +${Math.round(hrElev)}%`);
  if (lowConsistency)        sleepTriggers.push("Low consistency");
  if (today.alcoholDrinks > 0) sleepTriggers.push("Alcohol");

  const suppTriggers = isRecoveryDay ? ["Recovery day"] : [];

  const TrendIcon  = trend === "improving" ? TrendingDown : trend === "worsening" ? TrendingUp : Minus;
  const trendText  = trend === "improving" ? "Improving"  : trend === "worsening" ? "Worsening" : "Stable";
  const trendColor = trend === "improving" ? "text-emerald-500" : trend === "worsening" ? "text-red-500" : "text-muted-foreground";
  const iliColor   = ili <= 30 ? "text-emerald-500" : ili <= 55 ? "text-amber-500" : "text-red-500";

  return (
    <ScrollArea className="h-full">
      <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Daily Control</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {new Date(today.date).toLocaleDateString("en-US", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
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
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Sleep Timing</p>
                  <div className="space-y-4">
                    <TimeInput label="Bedtime" value={today.bedtime ?? "22:30"} onChange={(v) => updateToday({ bedtime: v })} />
                    <TimeInput label="Wake Time" value={today.wakeTime ?? "06:30"} onChange={(v) => updateToday({ wakeTime: v })} />
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Fitness</p>
                  <div className="space-y-4">
                    <MetricInput label="VO2max" value={today.vo2max} onChange={(v) => updateToday({ vo2max: v })} min={15} max={70} step={0.1} />
                    <MetricInput label="Zone 2 Minutes" value={today.zone2Minutes} onChange={(v) => updateToday({ zone2Minutes: v })} min={0} max={180} />
                    <div className="flex items-center justify-between">
                      <Label>Strength Session Today</Label>
                      <Switch checked={today.strengthSessions === 1} onCheckedChange={(c) => updateToday({ strengthSessions: c ? 1 : 0 })} data-testid="switch-strength" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>HIIT Session Today</Label>
                      <Switch checked={today.hiitSessions === 1} onCheckedChange={(c) => updateToday({ hiitSessions: c ? 1 : 0 })} data-testid="switch-hiit" />
                    </div>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Diet & Behavior</p>
                  <div className="space-y-4">
                    <MetricInput label="Alcohol Drinks" value={today.alcoholDrinks} onChange={(v) => updateToday({ alcoholDrinks: v })} min={0} max={5} />
                    {today.alcoholDrinks > 0 && (
                      <TimeInput label="Last Drink Time" value={today.alcoholTiming ?? "20:00"} onChange={(v) => updateToday({ alcoholTiming: v })} />
                    )}
                    <div className="flex items-center justify-between">
                      <Label>Late Eating (after 8 PM)</Label>
                      <Switch checked={today.lateEating} onCheckedChange={(c) => updateToday({ lateEating: c })} data-testid="switch-late-eating" />
                    </div>
                    {today.lateEating && (
                      <TimeInput label="Last Meal Time" value={today.lateEatingTime ?? "21:00"} onChange={(v) => updateToday({ lateEatingTime: v })} />
                    )}
                  </div>
                </div>
                <Separator />
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

        {/* ── Hero: Recovery Snapshot | Aging Velocity ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Recovery Snapshot */}
          <Card data-testid="card-recovery-snapshot">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500" />
                Recovery Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <RecoveryRow label="HRV" value={`${today.hrv} ms`} delta={`${hrvDiffPct > 0 ? "+" : ""}${hrvDiffPct}%`} deltaPositive={hrvDiffPct >= 0} sub="vs 21d baseline" />
                <RecoveryRow label="Resting HR" value={`${today.restingHR} bpm`} delta={`${hrDiff > 0 ? "+" : ""}${hrDiff} bpm`} deltaPositive={hrDiff <= 0} sub="vs 21d baseline" />
                <RecoveryRow label="Sleep" value={`${today.sleepHours} hrs`} valueColor={today.sleepHours >= 7 ? "text-emerald-500" : today.sleepHours >= 6 ? "text-amber-500" : "text-red-500"} />
                <RecoveryRow label="Consistency" value={`${sleepConsistency}/100`} valueColor={sleepConsistency >= 80 ? "text-emerald-500" : sleepConsistency >= 60 ? "text-amber-500" : "text-red-500"} sub="7-day timing" />
                {today.awakenings !== undefined && (
                  <RecoveryRow label="Awakenings" value={`${today.awakenings}×`} valueColor={today.awakenings <= 1 ? "text-emerald-500" : today.awakenings <= 3 ? "text-amber-500" : "text-red-500"} />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Aging Velocity */}
          <Card data-testid="card-pas-main">
            <CardHeader className="pb-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="text-base font-semibold">Aging Velocity</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-0.5 ${trendColor}`}>
                      <TrendIcon className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">{trendText}</span>
                    </div>
                    <span className="text-muted-foreground/30 text-xs">·</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex items-center gap-1 cursor-default">
                          <span className="text-xs text-muted-foreground">Inflammatory load</span>
                          <span className={`text-sm font-bold tabular-nums ${iliColor}`}>{ili}</span>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-medium mb-1">Inflammatory Load Index (ILI)</p>
                        <p className="text-xs text-muted-foreground">A composite of today's inflammatory signals: sleep debt, HRV suppression, alcohol intake, late eating, and air quality. Scored 0–100. Lower is better.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Physiologic Aging Score — 50 = average rate (1.0×). Below 50 means aging slower than average; above 50 means faster.
                </p>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
              <PASGauge value={pas} size={240} showLabel={false} />

            </CardContent>
          </Card>
        </div>

        {/* ── PAS Subscores strip ── */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <h2 className="text-sm font-semibold">PAS Breakdown</h2>
            <p className="text-xs text-muted-foreground">The 5 signals that combine into your Aging Score — each bar shows today's load (lower = better)</p>
          </div>
          <div className="grid grid-cols-5 gap-2" data-testid="card-subscores">
            {[
              { label: "Recovery",     value: subscores.recovery,     weight: "30%" },
              { label: "Metabolic",    value: subscores.metabolic,    weight: "20%" },
              { label: "Fitness",      value: subscores.fitness,      weight: "25%" },
              { label: "Inflammatory", value: subscores.inflammatory, weight: "15%" },
              { label: "Environmental",value: subscores.environmental,weight: "10%" },
            ].map((s) => (
              <CompactSubscore key={s.label} label={s.label} value={s.value} weight={s.weight} driverDelta={driverMap[s.label] ?? 0} />
            ))}
          </div>
        </div>

        {/* ── Today's Recommendations ── */}
        <div>
          <h2 className="text-base font-semibold tracking-tight mb-3" data-testid="text-plan-heading">
            Today's Recommendations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RecommendationCard title="Exercise" icon={Activity}        triggers={exerciseTriggers} items={plan.exercise.items} />
            <RecommendationCard title="Diet"     icon={UtensilsCrossed} triggers={dietTriggers}     items={plan.diet.items} />
            <RecommendationCard title="Sleep"    icon={Moon}            triggers={sleepTriggers}    items={plan.sleep.items} />
            <RecommendationCard title="Supplements" icon={Pill}         triggers={suppTriggers}     items={plan.supplements.items} showGroups />
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function TimingBadge({ timing }: { timing?: "AM" | "PM" | "anytime" }) {
  if (!timing || timing === "anytime") return null;
  return (
    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 font-semibold border-0 ${
      timing === "AM"
        ? "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
        : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
    }`}>{timing}</Badge>
  );
}

function RecoveryRow({ label, value, delta, deltaPositive, valueColor, sub }: {
  label: string; value: string; delta?: string; deltaPositive?: boolean; valueColor?: string; sub?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <span className="text-sm text-muted-foreground">{label}</span>
        {sub && <p className="text-[10px] text-muted-foreground/60">{sub}</p>}
      </div>
      <div className="flex items-center gap-1.5 text-right">
        <span className={`tabular-nums text-xl font-bold ${valueColor ?? ""}`}>{value}</span>
        {delta && (
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border-0 tabular-nums ${
            deltaPositive
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
              : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
          }`}>{delta}</Badge>
        )}
      </div>
    </div>
  );
}

function CompactSubscore({ label, value, weight, driverDelta = 0 }: {
  label: string; value: number; weight: string; driverDelta?: number;
}) {
  const color = value <= 30 ? "#10b981" : value <= 55 ? "#f59e0b" : "#ef4444";
  return (
    <div className="bg-muted/30 rounded-lg p-3 space-y-2">
      <div className="flex items-baseline justify-between gap-1">
        <span className="text-[10px] text-muted-foreground font-medium truncate">{label}</span>
        <span className="text-sm font-bold tabular-nums flex-shrink-0" style={{ color }}>{value}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <div className="flex items-center justify-between gap-1">
        <span className="text-[9px] text-muted-foreground">{weight}</span>
        {driverDelta > 2 && (
          <span className="text-[9px] font-semibold text-amber-500 tabular-nums">+{driverDelta} pts</span>
        )}
        {driverDelta < -2 && (
          <span className="text-[9px] font-semibold text-emerald-500 tabular-nums">{driverDelta} pts</span>
        )}
      </div>
    </div>
  );
}

function RecItem({ item }: { item: PlanItem }) {
  return (
    <div className="rounded-md bg-muted/40 p-3 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium flex-1 leading-snug">{item.text}</p>
        <div className="flex items-center gap-1 flex-shrink-0">
          <TimingBadge timing={item.timing} />
          <EvidenceBadge color={item.evidenceColor} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{item.why}</p>
      {item.cautions && (
        <div className="flex items-start gap-1.5 p-2 rounded bg-muted/60">
          <Info className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">{item.cautions}</p>
        </div>
      )}
    </div>
  );
}

function RecommendationCard({
  title, icon: Icon, triggers, items, showGroups = false,
}: {
  title: string; icon: React.ElementType; triggers: string[]; items: PlanItem[]; showGroups?: boolean;
}) {
  const suggested    = showGroups ? items.filter((i) => i.group === "suggested")                    : [];
  const stack        = showGroups ? items.filter((i) => i.group === "stack" && !i.isExperimental)   : [];
  const experimental = showGroups ? items.filter((i) => i.isExperimental)                           : [];
  const allItems     = showGroups ? [] : items;

  return (
    <Card data-testid={`card-plan-${title.toLowerCase()}`}>
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-start gap-2">
          <div className="p-1.5 rounded-md bg-primary/10 flex-shrink-0 mt-0.5">
            <Icon className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-sm">{title}</CardTitle>
              {triggers.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {triggers.map((t) => (
                    <Badge key={t} variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-0 bg-muted text-muted-foreground">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {allItems.map((item, i) => <RecItem key={i} item={item} />)}

        {showGroups && suggested.length > 0 && (
          <>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pt-1">Suggested today</p>
            {suggested.map((item, i) => <RecItem key={`sug-${i}`} item={item} />)}
          </>
        )}
        {showGroups && stack.length > 0 && (
          <>
            {suggested.length > 0 && <Separator className="my-1" />}
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pt-1">Daily stack</p>
            {stack.map((item, i) => <RecItem key={`stk-${i}`} item={item} />)}
          </>
        )}
        {showGroups && experimental.length > 0 && (
          <>
            <Separator className="my-1" />
            <p className="text-[10px] font-semibold text-orange-500 uppercase tracking-wider pt-1">Experimental</p>
            {experimental.map((item, i) => <RecItem key={`exp-${i}`} item={item} />)}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function MetricInput({ label, value, onChange, min, max, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))}
        min={min} max={max} step={step}
        data-testid={`input-${label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`} />
    </div>
  );
}

function TimeInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      <Input type="time" value={value} onChange={(e) => onChange(e.target.value)}
        data-testid={`input-${label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`} />
    </div>
  );
}
