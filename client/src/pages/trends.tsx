import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useMetrics } from "@/lib/metricsStore";
import { computeDailyPAS, computeILI, getBaseline, getBaselineSD } from "@/lib/scoring";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, Legend, ReferenceLine, ReferenceArea,
} from "recharts";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  TrendingDown, TrendingUp, Calendar, Dumbbell, Wind, Droplets,
  BarChart2, Wine, UtensilsCrossed, Activity,
} from "lucide-react";

const chartTooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
  padding: "8px 12px",
};

const categoryColors: Record<string, string> = {
  sleep: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  exercise: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  diet: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  alcohol: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  stress: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
};

type BaselineWindow = 7 | 21 | 42;

export default function TrendsPage() {
  const { metrics, interventions } = useMetrics();
  const [showHRV, setShowHRV] = useState(true);
  const [showSleep, setShowSleep] = useState(true);
  const [showHR, setShowHR] = useState(false);
  const [baselineWindow, setBaselineWindow] = useState<BaselineWindow>(21);
  const [showZScore, setShowZScore] = useState(false);

  const last30 = useMemo(() => metrics.slice(-30), [metrics]);

  // ── PAS / ILI ──────────────────────────────────────────────────────────────
  const pasData = useMemo(
    () =>
      last30.map((m) => ({
        date: new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        pas: computeDailyPAS(m, metrics),
        ili: computeILI(m, metrics),
      })),
    [last30, metrics]
  );

  // ── Recovery baselines ─────────────────────────────────────────────────────
  const hrvMean = useMemo(() => getBaseline(metrics, "hrv", baselineWindow), [metrics, baselineWindow]);
  const hrMean = useMemo(() => getBaseline(metrics, "restingHR", baselineWindow), [metrics, baselineWindow]);
  const sleepMean = useMemo(() => getBaseline(metrics, "sleepHours", baselineWindow), [metrics, baselineWindow]);
  const hrvSD = useMemo(() => getBaselineSD(metrics, "hrv", baselineWindow), [metrics, baselineWindow]);
  const hrSD = useMemo(() => getBaselineSD(metrics, "restingHR", baselineWindow), [metrics, baselineWindow]);
  const sleepSD = useMemo(() => getBaselineSD(metrics, "sleepHours", baselineWindow), [metrics, baselineWindow]);

  const recoveryData = useMemo(() => {
    return last30.map((m) => {
      if (showZScore) {
        return {
          date: new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          hrv: hrvSD > 0 ? Math.round(((m.hrv - hrvMean) / hrvSD) * 100) / 100 : 0,
          sleep: sleepSD > 0 ? Math.round(((m.sleepHours - sleepMean) / sleepSD) * 100) / 100 : 0,
          hr: hrSD > 0 ? Math.round(((m.restingHR - hrMean) / hrSD) * 100) / 100 : 0,
        };
      }
      return {
        date: new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        hrv: m.hrv,
        sleep: m.sleepHours,
        hr: m.restingHR,
      };
    });
  }, [last30, showZScore, hrvMean, hrMean, sleepMean, hrvSD, hrSD, sleepSD]);

  // ── Glucose ────────────────────────────────────────────────────────────────
  const glucoseData = useMemo(
    () =>
      last30
        .filter((m) => m.glucoseSpikeScore !== undefined)
        .map((m) => ({
          date: new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          glucoseSpike: m.glucoseSpikeScore,
          fasting: m.fastingGlucose,
          lateEating: m.lateEating ? 1 : 0,
        })),
    [last30]
  );

  // ── Training ───────────────────────────────────────────────────────────────
  const trainingData = useMemo(
    () =>
      last30.map((m) => ({
        date: new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        zone2: m.zone2Minutes,
        strength: m.strengthSessions * 30,
        hiit: m.hiitSessions * 20,
      })),
    [last30]
  );

  // ── AQI ────────────────────────────────────────────────────────────────────
  const aqiData = useMemo(
    () =>
      last30.map((m) => ({
        date: new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        aqi: m.aqi,
      })),
    [last30]
  );

  // ── Weekly Insights ────────────────────────────────────────────────────────
  const weeklyInsights = useMemo(() => {
    const allM = metrics.slice(0, -1); // exclude today
    const insights: Array<{
      text: string;
      subtext: string;
      direction: "positive" | "negative" | "neutral";
      n: number;
      icon: "wine" | "food" | "activity";
    }> = [];

    // 1. Alcohol nights → next-day HRV
    const alcoholNextHRV: number[] = [];
    const noAlcoholNextHRV: number[] = [];
    for (let i = 0; i < allM.length - 1; i++) {
      const next = allM[i + 1];
      if (allM[i].alcoholDrinks > 0) alcoholNextHRV.push(next.hrv);
      else noAlcoholNextHRV.push(next.hrv);
    }
    if (alcoholNextHRV.length >= 3 && noAlcoholNextHRV.length >= 3) {
      const alcAvg = alcoholNextHRV.reduce((a, b) => a + b, 0) / alcoholNextHRV.length;
      const normAvg = noAlcoholNextHRV.reduce((a, b) => a + b, 0) / noAlcoholNextHRV.length;
      const diff = alcAvg - normAvg;
      if (Math.abs(diff) >= 2) {
        insights.push({
          text: `Alcohol nights → next-day HRV ${diff > 0 ? "+" : ""}${diff.toFixed(1)} ms vs sober nights`,
          subtext: `${alcoholNextHRV.length} alcohol nights analyzed`,
          direction: diff < -2 ? "negative" : "neutral",
          n: alcoholNextHRV.length,
          icon: "wine",
        });
      }
    }

    // 2. Late eating → next-day glucose spike score
    const lateEatSpikes: number[] = [];
    const normalEatSpikes: number[] = [];
    for (let i = 0; i < allM.length - 1; i++) {
      const next = allM[i + 1];
      if (next.glucoseSpikeScore !== undefined) {
        if (allM[i].lateEating) lateEatSpikes.push(next.glucoseSpikeScore);
        else normalEatSpikes.push(next.glucoseSpikeScore);
      }
    }
    if (lateEatSpikes.length >= 3 && normalEatSpikes.length >= 3) {
      const lateAvg = lateEatSpikes.reduce((a, b) => a + b, 0) / lateEatSpikes.length;
      const normAvg = normalEatSpikes.reduce((a, b) => a + b, 0) / normalEatSpikes.length;
      const diff = lateAvg - normAvg;
      if (Math.abs(diff) >= 3) {
        insights.push({
          text: `Late eating → next-day spike score ${diff > 0 ? "+" : ""}${diff.toFixed(0)} pts vs normal eating`,
          subtext: `${lateEatSpikes.length} late-eating nights analyzed`,
          direction: diff > 3 ? "negative" : "neutral",
          n: lateEatSpikes.length,
          icon: "food",
        });
      }
    }

    // 3. Zone 2 sessions → 48h PAS change
    const zone2PAS: number[] = [];
    const noZone2PAS: number[] = [];
    for (let i = 0; i < allM.length - 2; i++) {
      const pasToday = computeDailyPAS(allM[i], metrics);
      const pasPlus2 = computeDailyPAS(allM[i + 2], metrics);
      const delta = pasPlus2 - pasToday;
      if (allM[i].zone2Minutes >= 30) zone2PAS.push(delta);
      else noZone2PAS.push(delta);
    }
    if (zone2PAS.length >= 4) {
      const avgDelta = zone2PAS.reduce((a, b) => a + b, 0) / zone2PAS.length;
      if (Math.abs(avgDelta) >= 1) {
        insights.push({
          text: `Zone 2 (30+ min) → 48h PAS ${avgDelta > 0 ? "+" : ""}${avgDelta.toFixed(1)} pts on average`,
          subtext: `${zone2PAS.length} zone 2 sessions analyzed`,
          direction: avgDelta < -1 ? "positive" : avgDelta > 1 ? "negative" : "neutral",
          n: zone2PAS.length,
          icon: "activity",
        });
      }
    }

    return insights.slice(0, 3);
  }, [metrics]);

  const insightIconMap = {
    wine: Wine,
    food: UtensilsCrossed,
    activity: Activity,
  };

  // ── Y axis domain for z-score mode ─────────────────────────────────────────
  const recoveryYDomain = showZScore ? [-3, 3] : undefined;

  return (
    <ScrollArea className="h-full">
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-trends-title">Trends</h1>
          <p className="text-sm text-muted-foreground mt-0.5">30-day performance and health metrics</p>
        </div>

        <Tabs defaultValue="pas" className="space-y-4">
          <TabsList data-testid="tabs-trends">
            <TabsTrigger value="pas" data-testid="tab-pas">PAS & ILI</TabsTrigger>
            <TabsTrigger value="recovery" data-testid="tab-recovery">Recovery</TabsTrigger>
            <TabsTrigger value="glucose" data-testid="tab-glucose">Glucose</TabsTrigger>
            <TabsTrigger value="training" data-testid="tab-training">Training</TabsTrigger>
            <TabsTrigger value="environment" data-testid="tab-environment">Environment</TabsTrigger>
          </TabsList>

          {/* ── PAS & ILI ── */}
          <TabsContent value="pas" className="space-y-4">
            <Card data-testid="card-chart-pas">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Physiologic Aging Score (30 days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72" data-testid="chart-pas-trend">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={pasData}>
                      <defs>
                        <linearGradient id="pasGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="iliGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--chart-4))" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="hsl(var(--chart-4))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <RTooltip contentStyle={chartTooltipStyle} />
                      <Legend />
                      <Area type="monotone" dataKey="pas" name="PAS" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#pasGrad)" />
                      <Area type="monotone" dataKey="ili" name="ILI" stroke="hsl(var(--chart-4))" strokeWidth={1.5} fill="url(#iliGrad)" strokeDasharray="4 4" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Recovery ── */}
          <TabsContent value="recovery" className="space-y-4">
            <Card data-testid="card-chart-recovery">
              <CardHeader className="space-y-3 pb-2">
                <div className="flex flex-row items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="text-base">HRV / Sleep / Resting HR</CardTitle>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Switch checked={showHRV} onCheckedChange={setShowHRV} data-testid="switch-hrv-toggle" />
                      <Label className="text-xs">HRV</Label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Switch checked={showSleep} onCheckedChange={setShowSleep} data-testid="switch-sleep-toggle" />
                      <Label className="text-xs">Sleep</Label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Switch checked={showHR} onCheckedChange={setShowHR} data-testid="switch-hr-toggle" />
                      <Label className="text-xs">HR</Label>
                    </div>
                  </div>
                </div>

                {/* Controls row */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  {/* Baseline window */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Baseline:</span>
                    {([7, 21, 42] as BaselineWindow[]).map((w) => (
                      <Button
                        key={w}
                        variant={baselineWindow === w ? "default" : "outline"}
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setBaselineWindow(w)}
                        data-testid={`button-baseline-${w}`}
                      >
                        {w}d
                      </Button>
                    ))}
                  </div>
                  {/* Z-score toggle */}
                  <div className="flex items-center gap-1.5">
                    <Switch
                      checked={showZScore}
                      onCheckedChange={setShowZScore}
                      data-testid="switch-zscore"
                    />
                    <Label className="text-xs">Z-score</Label>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {/* Baseline summary chips */}
                <div className="flex gap-2 flex-wrap mb-3">
                  {showHRV && !showZScore && (
                    <Badge variant="outline" className="text-xs bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 border-sky-200/50">
                      HRV baseline: {Math.round(hrvMean)} ± {Math.round(hrvSD)} ms
                    </Badge>
                  )}
                  {showHR && !showZScore && (
                    <Badge variant="outline" className="text-xs bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200/50">
                      RHR baseline: {Math.round(hrMean)} ± {Math.round(hrSD)} bpm
                    </Badge>
                  )}
                  {showSleep && !showZScore && (
                    <Badge variant="outline" className="text-xs bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-violet-200/50">
                      Sleep baseline: {sleepMean.toFixed(1)} ± {sleepSD.toFixed(1)} hrs
                    </Badge>
                  )}
                  {showZScore && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Z-score · 0 = baseline · ±1 SD shaded
                    </Badge>
                  )}
                </div>

                <div className="h-72" data-testid="chart-recovery">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={recoveryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis
                        domain={recoveryYDomain}
                        tick={{ fontSize: 11 }}
                        stroke="hsl(var(--muted-foreground))"
                        tickFormatter={showZScore ? (v: number) => v.toFixed(1) : undefined}
                      />
                      <RTooltip
                        contentStyle={chartTooltipStyle}
                        formatter={(value: number, name: string) =>
                          showZScore
                            ? [`${value.toFixed(2)} SD`, name]
                            : [value, name]
                        }
                      />
                      <Legend />

                      {/* ±1 SD baseline band in z-score mode */}
                      {showZScore && (
                        <ReferenceArea
                          y1={-1}
                          y2={1}
                          fill="hsl(var(--muted))"
                          fillOpacity={0.3}
                          label={{ value: "±1 SD", position: "insideTopRight", fontSize: 10 }}
                        />
                      )}

                      {/* Baseline reference lines in raw mode */}
                      {showHRV && !showZScore && (
                        <ReferenceLine
                          y={hrvMean}
                          stroke="hsl(var(--chart-1))"
                          strokeDasharray="5 3"
                          strokeOpacity={0.5}
                          label={{ value: `HRV ${Math.round(hrvMean)}`, position: "insideTopRight", fontSize: 9 }}
                        />
                      )}
                      {showHR && !showZScore && (
                        <ReferenceLine
                          y={hrMean}
                          stroke="hsl(var(--chart-5))"
                          strokeDasharray="5 3"
                          strokeOpacity={0.5}
                          label={{ value: `HR ${Math.round(hrMean)}`, position: "insideBottomRight", fontSize: 9 }}
                        />
                      )}

                      {showHRV && (
                        <Line
                          type="monotone"
                          dataKey="hrv"
                          name={showZScore ? "HRV (z)" : "HRV (ms)"}
                          stroke="hsl(var(--chart-1))"
                          strokeWidth={2}
                          dot={false}
                        />
                      )}
                      {showSleep && (
                        <Line
                          type="monotone"
                          dataKey="sleep"
                          name={showZScore ? "Sleep (z)" : "Sleep (hrs)"}
                          stroke="hsl(var(--chart-3))"
                          strokeWidth={2}
                          dot={false}
                        />
                      )}
                      {showHR && (
                        <Line
                          type="monotone"
                          dataKey="hr"
                          name={showZScore ? "HR (z)" : "Resting HR"}
                          stroke="hsl(var(--chart-5))"
                          strokeWidth={2}
                          dot={false}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Glucose ── */}
          <TabsContent value="glucose" className="space-y-4">
            <Card data-testid="card-chart-glucose">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-muted-foreground" />
                  <CardTitle className="text-base">Glucose Spikes & Meal Timing</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {glucoseData.length > 0 ? (
                  <div className="h-72" data-testid="chart-glucose">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={glucoseData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <RTooltip contentStyle={chartTooltipStyle} />
                        <Legend />
                        <Bar dataKey="glucoseSpike" name="Spike Score" fill="hsl(var(--chart-4))" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">No glucose data available. Connect a CGM or enter data manually.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Training ── */}
          <TabsContent value="training" className="space-y-4">
            <Card data-testid="card-chart-training">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-muted-foreground" />
                  <CardTitle className="text-base">Training Load</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-72" data-testid="chart-training">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trainingData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" label={{ value: "Minutes", angle: -90, position: "insideLeft", style: { fontSize: 11 } }} />
                      <RTooltip contentStyle={chartTooltipStyle} />
                      <Legend />
                      <Bar dataKey="zone2" name="Zone 2" fill="hsl(var(--chart-1))" stackId="a" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="strength" name="Strength" fill="hsl(var(--chart-2))" stackId="a" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="hiit" name="HIIT" fill="hsl(var(--chart-5))" stackId="a" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Environment ── */}
          <TabsContent value="environment" className="space-y-4">
            <Card data-testid="card-chart-aqi">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-muted-foreground" />
                  <CardTitle className="text-base">Air Quality Index (AQI)</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-72" data-testid="chart-aqi">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={aqiData}>
                      <defs>
                        <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis domain={[0, 200]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <RTooltip contentStyle={chartTooltipStyle} />
                      <Area type="monotone" dataKey="aqi" name="AQI" stroke="hsl(var(--chart-2))" strokeWidth={2} fill="url(#aqiGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ── Intervention Timeline ── */}
        <Card data-testid="card-interventions">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-base">Intervention Timeline</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-4">
                {interventions.map((iv, idx) => (
                  <div key={idx} className="flex items-start gap-4 pl-1">
                    <div className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center z-10 flex-shrink-0">
                      {iv.pasChange < 0 ? (
                        <TrendingDown className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <TrendingUp className="w-3 h-3 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{iv.description}</span>
                        <Badge
                          variant="outline"
                          className={`${categoryColors[iv.category]} border-0 text-xs no-default-active-elevate`}
                        >
                          {iv.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {new Date(iv.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        <span className={`text-xs font-medium ${iv.pasChange < 0 ? "text-emerald-500" : "text-red-500"}`}>
                          PAS {iv.pasChange > 0 ? "+" : ""}{iv.pasChange}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Weekly Insights ── */}
        {weeklyInsights.length > 0 && (
          <Card data-testid="card-weekly-insights">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-base">Weekly Insights</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Simple correlations from your last 60 days — no ML, just pattern counting.
              </p>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border/60">
                {weeklyInsights.map((insight, idx) => {
                  const IconComp = insightIconMap[insight.icon];
                  return (
                    <div key={idx} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                      <div className={`p-2 rounded-md flex-shrink-0 ${
                        insight.direction === "negative"
                          ? "bg-red-100 dark:bg-red-900/30"
                          : insight.direction === "positive"
                          ? "bg-emerald-100 dark:bg-emerald-900/30"
                          : "bg-muted"
                      }`}>
                        <IconComp className={`w-3.5 h-3.5 ${
                          insight.direction === "negative"
                            ? "text-red-600 dark:text-red-400"
                            : insight.direction === "positive"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground"
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug">{insight.text}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{insight.subtext}</p>
                      </div>
                      <Badge variant="outline" className="text-xs text-muted-foreground flex-shrink-0">
                        n={insight.n}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}
