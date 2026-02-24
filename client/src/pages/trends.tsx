import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMetrics } from "@/lib/metricsStore";
import { computeDailyPAS, computeILI } from "@/lib/scoring";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TrendingDown, TrendingUp, Calendar, Dumbbell, Wind, Droplets } from "lucide-react";

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

export default function TrendsPage() {
  const { metrics, interventions } = useMetrics();
  const [showHRV, setShowHRV] = useState(true);
  const [showSleep, setShowSleep] = useState(true);
  const [showHR, setShowHR] = useState(false);

  const last30 = useMemo(() => metrics.slice(-30), [metrics]);

  const pasData = useMemo(
    () =>
      last30.map((m) => ({
        date: new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        pas: computeDailyPAS(m, metrics),
        ili: computeILI(m, metrics),
      })),
    [last30, metrics]
  );

  const recoveryData = useMemo(
    () =>
      last30.map((m) => ({
        date: new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        hrv: m.hrv,
        sleep: m.sleepHours,
        hr: m.restingHR,
      })),
    [last30]
  );

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

  const aqiData = useMemo(
    () =>
      last30.map((m) => ({
        date: new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        aqi: m.aqi,
      })),
    [last30]
  );

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

          <TabsContent value="recovery" className="space-y-4">
            <Card data-testid="card-chart-recovery">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2 flex-wrap">
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
              </CardHeader>
              <CardContent>
                <div className="h-72" data-testid="chart-recovery">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={recoveryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <RTooltip contentStyle={chartTooltipStyle} />
                      <Legend />
                      {showHRV && <Line type="monotone" dataKey="hrv" name="HRV (ms)" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />}
                      {showSleep && <Line type="monotone" dataKey="sleep" name="Sleep (hrs)" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />}
                      {showHR && <Line type="monotone" dataKey="hr" name="Resting HR" stroke="hsl(var(--chart-5))" strokeWidth={2} dot={false} />}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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
      </div>
    </ScrollArea>
  );
}
