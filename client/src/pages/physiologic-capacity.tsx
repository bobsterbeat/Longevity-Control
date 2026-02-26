import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Footprints,
  Heart,
  PersonStanding,
  Timer,
  Trash2,
  Plus,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMetrics } from "@/lib/metricsStore";

import {
  seedCapacityIfEmpty,
  addCapacityResult,
  deleteCapacityResult,
  getResultsForMetric,
  loadProfile,
  saveProfile,
  type CapacityMetricId,
  type CapacityResult,
  type UserProfile,
} from "@/lib/capacity/store";
import {
  computeFRS,
  categoryBg,
  categoryColor,
  categoryToScore,
  CATEGORY_LABELS,
  categoryToPercentileLabel,
  FRS_BAND_COLORS,
  FRS_BAND_LABELS,
  getCapacityCoaching,
  type FitnessCategory,
  type FRSResult,
} from "@/lib/capacity/scoring";

// ─── Tooltip style ────────────────────────────────────────────────────────────

const chartTooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "11px",
  padding: "6px 10px",
};

// ─── FRS Arc Gauge ────────────────────────────────────────────────────────────

const FRS_ZONES = [
  { from: 0,  to: 40,  label: "Low Reserve", color: "#ef4444" },
  { from: 40, to: 60,  label: "Reduced",     color: "#f59e0b" },
  { from: 60, to: 80,  label: "Good",        color: "#22d3ee" },
  { from: 80, to: 100, label: "High Reserve",color: "#10b981" },
];

function FRSGauge({ value, size = 220 }: { value: number; size?: number }) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(value), 120);
    return () => clearTimeout(t);
  }, [value]);

  // Semicircle: 180° sweep from left (180°) → right (0°) through the top
  const trackWidth = 14;
  const radius = (size - 60) / 2;   // leaves room for tick labels outside
  const cx = size / 2;
  const cy = size / 2;              // center sits at the flat edge (bottom of arc)
  const startAngle = 180;
  const endAngle = 0;
  const totalAngle = 180;
  const svgHeight = cy + 12;        // just the top half + tiny margin for needle base

  const polarToCartesian = (angle: number, r = radius) => ({
    x: cx + r * Math.cos((angle * Math.PI) / 180),
    y: cy - r * Math.sin((angle * Math.PI) / 180),
  });

  const describeArc = (start: number, end: number, r = radius) => {
    const s = polarToCartesian(start, r);
    const e = polarToCartesian(end, r);
    // large-arc=0, sweep=1 (clockwise in SVG y-down space) → draws through the top
    return `M ${s.x} ${s.y} A ${r} ${r} 0 0 1 ${e.x} ${e.y}`;
  };

  const valueToAngle = (v: number) => startAngle - (v / 100) * totalAngle;

  const needleAngle = valueToAngle(animated);
  const needleRad = (needleAngle * Math.PI) / 180;
  const needleLen = radius - 18;
  const tip = { x: cx + needleLen * Math.cos(needleRad), y: cy - needleLen * Math.sin(needleRad) };
  const perp = needleRad + Math.PI / 2;
  const bw = 3.5;
  const b1 = { x: cx + bw * Math.cos(perp), y: cy - bw * Math.sin(perp) };
  const b2 = { x: cx - bw * Math.cos(perp), y: cy + bw * Math.sin(perp) };

  const activeZone = FRS_ZONES.find((z) => value >= z.from && value < z.to) ?? FRS_ZONES[FRS_ZONES.length - 1];

  return (
    <div className="flex flex-col items-center" data-testid="gauge-frs">
      <div className="relative" style={{ width: size, height: svgHeight + 50 }}>
        <svg width={size} height={svgHeight} viewBox={`0 0 ${size} ${svgHeight}`} overflow="visible">
          {/* Track zones (dim) */}
          {FRS_ZONES.map((z) => (
            <path
              key={z.label}
              d={describeArc(valueToAngle(z.from), valueToAngle(z.to))}
              fill="none"
              stroke={z.color}
              strokeWidth={trackWidth}
              strokeLinecap="butt"
              opacity={0.2}
            />
          ))}
          {/* Active fill */}
          {FRS_ZONES.map((z) => {
            if (animated < z.from) return null;
            const clamp = Math.min(animated, z.to);
            return (
              <path
                key={`a-${z.label}`}
                d={describeArc(valueToAngle(z.from), valueToAngle(clamp))}
                fill="none"
                stroke={z.color}
                strokeWidth={trackWidth}
                strokeLinecap="butt"
                style={{ transition: "all 1s cubic-bezier(0.4,0,0.2,1)" }}
              />
            );
          })}
          {/* Zone separators */}
          {FRS_ZONES.slice(1).map((z) => {
            const angle = valueToAngle(z.from);
            const outer = polarToCartesian(angle, radius + trackWidth / 2 + 1);
            const inner = polarToCartesian(angle, radius - trackWidth / 2 - 1);
            return (
              <line key={`s-${z.label}`} x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y}
                stroke="hsl(var(--background))" strokeWidth="2" />
            );
          })}
          {/* Tick labels */}
          {[0, 40, 60, 80, 100].map((tick) => {
            const angle = valueToAngle(tick);
            const r2 = radius + trackWidth / 2 + 13;
            const pt = polarToCartesian(angle, r2);
            // "0" and "100" sit at the horizontal ends — nudge them inward slightly
            const anchor = tick === 0 ? "end" : tick === 100 ? "start" : "middle";
            return (
              <text key={tick} x={pt.x} y={pt.y} textAnchor={anchor} dominantBaseline="middle"
                fill="hsl(var(--muted-foreground))" fontSize="9" fontWeight="500">{tick}</text>
            );
          })}
          {/* Needle */}
          <polygon points={`${tip.x},${tip.y} ${b1.x},${b1.y} ${b2.x},${b2.y}`}
            fill={activeZone.color}
            style={{ transition: "all 1.1s cubic-bezier(0.4,0,0.2,1)", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))" }} />
          <circle cx={cx} cy={cy} r={5} fill={activeZone.color}
            stroke="hsl(var(--background))" strokeWidth="2"
            style={{ transition: "fill 0.8s ease" }} />
        </svg>
        {/* Value + label below the arc center */}
        <div className="absolute flex flex-col items-center" style={{ left: 0, right: 0, top: svgHeight + 6 }}>
          <span className="text-4xl font-black tabular-nums leading-none" style={{ color: activeZone.color, transition: "color 0.6s" }}>
            {value}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">FRS</span>
        </div>
      </div>
      {/* Zone legend */}
      <div className="flex items-center gap-3 mt-1">
        {FRS_ZONES.map((z) => (
          <div key={z.label} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: z.color }} />
            <span className="text-[9px] text-muted-foreground">{z.label.split(" ")[0]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Timer widget ─────────────────────────────────────────────────────────────

type TimerMode = "countdown" | "stopwatch";

function TimerWidget({
  mode,
  duration,           // seconds (for countdown)
  onComplete,         // fires when countdown hits 0 or user stops stopwatch
  label,
}: {
  mode: TimerMode;
  duration?: number;
  onComplete: (elapsed: number) => void;
  label: string;
}) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setElapsed(0);
  }, []);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const start = () => {
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        if (mode === "countdown" && duration && next >= duration) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          onComplete(duration);
          return duration;
        }
        return next;
      });
    }, 1000);
  };

  const stop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    if (mode === "stopwatch") onComplete(elapsed);
  };

  const remaining = mode === "countdown" && duration ? Math.max(0, duration - elapsed) : elapsed;
  const pct = mode === "countdown" && duration ? (elapsed / duration) * 100 : Math.min((elapsed / 120) * 100, 100);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="rounded-md bg-muted/40 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold">{label}</p>
        <span className="text-2xl font-black tabular-nums" style={{ fontVariantNumeric: "tabular-nums" }}>
          {fmt(remaining)}
        </span>
      </div>
      <Progress value={pct} className="h-1.5" />
      <div className="flex gap-2">
        {!running ? (
          <Button size="sm" className="h-7 text-xs" onClick={start} disabled={mode === "countdown" && duration ? elapsed >= duration : false}>
            <Timer className="w-3 h-3 mr-1" />
            {elapsed === 0 ? "Start" : "Resume"}
          </Button>
        ) : (
          <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={stop}>
            Stop
          </Button>
        )}
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={reset}>Reset</Button>
      </div>
      {mode === "countdown" && duration && elapsed >= duration && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
          ✓ Time up — enter your rep count below
        </p>
      )}
    </div>
  );
}

// ─── Metric card config ───────────────────────────────────────────────────────

interface MetricConfig {
  id: CapacityMetricId;
  label: string;
  unit: string;
  icon: React.ReactNode;
  description: string;
  testInstructions: string;
  timerMode?: TimerMode;
  timerDuration?: number;
  timerLabel?: string;
  coachingNote: string;
  referenceLines?: Array<{ value: number; label: string }>;
  unitOptions?: string[];
  altMetric?: CapacityMetricId;       // alternative test
  altLabel?: string;
  altUnit?: string;
  altTimerMode?: TimerMode;
}

const METRIC_CONFIGS: MetricConfig[] = [
  {
    id: "vo2max",
    label: "VO2max",
    unit: "mL/kg/min",
    icon: <Activity className="w-4 h-4 text-sky-500" />,
    description: "Maximum oxygen uptake — the most powerful predictor of longevity in healthy individuals. Each 3.5 mL/kg/min increase in VO2max is associated with ~15% reduction in all-cause mortality.",
    testInstructions: "Enter your wearable estimate (Garmin, Apple Watch, Polar, Whoop), or use a formal submaximal lab test. Most wearables are accurate to ±5–10%.",
    coachingNote: "Target ≥40 mL/kg/min for men, ≥35 for women. Build via 150–180 min/week Zone 2 aerobic training. Each 10% VO2max improvement ≈ 2-year reduction in biological age.",
    referenceLines: [{ value: 40, label: "Target" }],
  },
  {
    id: "grip-strength",
    label: "Grip Strength",
    unit: "kg",
    icon: <Dumbbell className="w-4 h-4 text-orange-500" />,
    description: "Grip strength is a proxy for overall muscular strength and is independently predictive of cardiovascular mortality, hospitalisation, and frailty — more strongly than many traditional risk factors.",
    testInstructions: "Use a hand dynamometer (squeeze 3 times, record the best value). No dynamometer? Use the dead hang alternative below.",
    coachingNote: "Aim for ≥35 kg (men), ≥22 kg (women). Compound pulling movements (rows, deadlifts, farmer's carries, pull-ups) are most effective. Any grip improvement = functional reserve improvement.",
    unitOptions: ["kg", "lb"],
    altMetric: "dead-hang",
    altLabel: "Dead Hang (alternative)",
    altUnit: "s",
    altTimerMode: "stopwatch",
    referenceLines: [{ value: 35, label: "Target" }],
  },
  {
    id: "sit-to-stand",
    label: "30-sec Sit-to-Stand",
    unit: "reps",
    icon: <PersonStanding className="w-4 h-4 text-amber-500" />,
    description: "Number of times you can fully stand from a chair and return to sitting in 30 seconds. A validated measure of lower-body power, mobility, and fall-risk (Rikli & Jones, 2001).",
    testInstructions: "Sit in a chair with arms folded. Start the 30-second timer. Count full stands (fully upright) + returns to seated. Do not use armrests.",
    coachingNote: "Target ≥15 reps (men 40-49), ≥13 reps (women 40-49). Squats, lunges, and step-ups directly transfer. A score <10 is associated with significantly elevated fall risk.",
    timerMode: "countdown",
    timerDuration: 30,
    timerLabel: "30-second countdown",
    referenceLines: [{ value: 15, label: "Target" }],
  },
  {
    id: "step-test",
    label: "1-min Step Test",
    unit: "steps",
    icon: <Footprints className="w-4 h-4 text-violet-500" />,
    description: "Number of full steps (alternating legs, knee reaching hip height) in 60 seconds. Indicates functional cardiovascular fitness and lower-body coordination.",
    testInstructions: "Stand in place. March in place for 60 seconds, raising each knee to approximately hip height. Count each time the right knee rises (= 1 step per side). Or count total alternating knee raises.",
    coachingNote: "Target ≥90 steps in 60 seconds. Stair climbing, walking lunges, and brisk walking improve this score rapidly.",
    timerMode: "countdown",
    timerDuration: 60,
    timerLabel: "60-second countdown",
    referenceLines: [{ value: 90, label: "Target" }],
  },
  {
    id: "balance",
    label: "Single-Leg Balance",
    unit: "s",
    icon: <Heart className="w-4 h-4 text-rose-500" />,
    description: "Time you can stand on one leg (eyes open). <10 seconds is associated with significantly elevated fall risk and higher all-cause mortality in people over 50. A 2022 study (Brito et al., BMJ) found <10s linked to ~84% higher mortality risk.",
    testInstructions: "Stand barefoot on one leg, arms at sides, eyes open. Start the stopwatch. Stop when the raised foot touches down or you grab something. Test both legs; record the better result.",
    coachingNote: "Target ≥20 seconds. Practice daily: try single-leg brushing teeth. Single-leg deadlifts and yoga significantly improve this. Eyes-closed is the progression.",
    timerMode: "stopwatch",
    timerLabel: "Hold until you touch down",
    referenceLines: [{ value: 20, label: "Target" }],
  },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PhysiologicCapacityPage() {
  const { metrics } = useMetrics();
  const { toast } = useToast();
  const today = metrics[metrics.length - 1];

  const [tick, setTick] = useState(0);
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile());
  const [profileEditing, setProfileEditing] = useState(false);
  const [draftAge, setDraftAge] = useState(String(profile.age));
  const [draftSex, setDraftSex] = useState<"male" | "female">(profile.sex);

  useEffect(() => {
    seedCapacityIfEmpty();
    setTick((t) => t + 1);
  }, []);

  const frsResult = useMemo<FRSResult>(
    () => computeFRS(today.restingHR),
    [tick, today.restingHR, profile]
  );
  const coaching = useMemo(() => getCapacityCoaching(frsResult), [frsResult]);

  const refresh = () => setTick((t) => t + 1);

  const saveProfileChanges = () => {
    const age = parseInt(draftAge, 10);
    if (isNaN(age) || age < 18 || age > 100) {
      toast({ title: "Invalid age", description: "Enter a value between 18 and 100.", variant: "destructive" });
      return;
    }
    const newProfile = { age, sex: draftSex };
    saveProfile(newProfile);
    setProfile(newProfile);
    setProfileEditing(false);
    refresh();
  };

  const activeZone = FRS_ZONES.find((z) => frsResult.frs >= z.from && frsResult.frs < z.to) ?? FRS_ZONES[FRS_ZONES.length - 1];

  const subscores = [
    { label: "VO2max", score: frsResult.vo2max, weight: "35%" },
    { label: "Strength", score: frsResult.grip, weight: "25%" },
    { label: "Mobility", score: frsResult.mobility, weight: "20%" },
    { label: "Balance", score: frsResult.balance, weight: "10%" },
    { label: "Resting HR", score: frsResult.restingHR, weight: "10%" },
  ];

  return (
    <ScrollArea className="h-full">
      <div className="p-4 max-w-4xl mx-auto space-y-4 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-primary/10">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Physiologic Capacity</h1>
              <p className="text-xs text-muted-foreground">Functional reserve &amp; performance testing</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setProfileEditing((v) => !v)}>
            Age {profile.age} · {profile.sex === "male" ? "M" : "F"}
            {profileEditing ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
          </Button>
        </div>

        {/* Profile editor */}
        {profileEditing && (
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground mb-3">
                Scores are age- and sex-adjusted using validated normative data.{" "}
                <a href="/reference" className="underline hover:text-foreground transition-colors">View full reference tables →</a>
              </p>
              <div className="flex items-end gap-3 flex-wrap">
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">Age</Label>
                  <Input
                    type="number"
                    min={18}
                    max={100}
                    value={draftAge}
                    onChange={(e) => setDraftAge(e.target.value)}
                    className="h-8 w-20 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">Biological sex</Label>
                  <Select value={draftSex} onValueChange={(v) => setDraftSex(v as "male" | "female")}>
                    <SelectTrigger className="h-8 w-28 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button size="sm" className="h-8 text-xs" onClick={saveProfileChanges}>Save</Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setProfileEditing(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* FRS Score Card */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <FRSGauge value={frsResult.frs} size={200} />

              <div className="flex-1 w-full space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-0.5">
                    Functional Reserve Score
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-black" style={{ color: activeZone.color }}>
                      {FRS_BAND_LABELS[frsResult.frsBand]}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Weighted across VO2max, strength, mobility, balance &amp; resting HR
                  </p>
                </div>

                {/* Subscore bars */}
                <div className="space-y-2">
                  {subscores.map(({ label, score, weight }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium">{label}</span>
                          <span className="text-[10px] text-muted-foreground">({weight})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {score.hasData ? (
                            <>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 h-4 border-0 ${categoryBg(score.category)} ${categoryColor(score.category)}`}
                              >
                                {CATEGORY_LABELS[score.category]}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground tabular-nums">
                                {categoryToPercentileLabel(score.category)}
                              </span>
                              <span className="text-xs font-bold tabular-nums">{score.score}</span>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </div>
                      <Progress
                        value={score.hasData ? score.score : 0}
                        className="h-1.5"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {METRIC_CONFIGS.map((cfg) => (
            <MetricCard
              key={cfg.id}
              config={cfg}
              tick={tick}
              profile={profile}
              onResultAdded={refresh}
              onResultDeleted={refresh}
              toast={toast}
            />
          ))}
        </div>

        {/* Coaching */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              Coaching Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {coaching.map((item, i) => (
              <div key={i} className="rounded-md bg-muted/40 p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <p className="text-sm font-semibold">{item.title}</p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 h-4 border-0 ${
                          item.priority === "high"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                            : "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300"
                        }`}
                      >
                        {item.priority}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-0 bg-muted text-muted-foreground">
                        {item.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <p className="text-[10px] text-muted-foreground italic text-center pb-2">
          Not medical advice. Functional tests are self-assessment tools. Consult your healthcare provider before starting a new exercise programme.
        </p>
      </div>
    </ScrollArea>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({
  config,
  tick,
  profile,
  onResultAdded,
  onResultDeleted,
  toast,
}: {
  config: MetricConfig;
  tick: number;
  profile: UserProfile;
  onResultAdded: () => void;
  onResultDeleted: () => void;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [showForm, setShowForm] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAlt, setShowAlt] = useState(false);
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().slice(0, 10));
  const [valueStr, setValueStr] = useState("");
  const [unit, setUnit] = useState(config.unit);
  const [altDateStr, setAltDateStr] = useState(() => new Date().toISOString().slice(0, 10));
  const [altValueStr, setAltValueStr] = useState("");
  const [timerDone, setTimerDone] = useState(false);

  const results = useMemo(() => getResultsForMetric(config.id), [config.id, tick]);
  const altResults = useMemo(
    () => (config.altMetric ? getResultsForMetric(config.altMetric) : []),
    [config.altMetric, tick]
  );

  const latest = results[results.length - 1];
  const chartData = results.map((r) => ({
    date: new Date(r.dateISO).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: r.value,
  }));

  const handleAdd = (isAlt = false) => {
    const rawVal = isAlt ? altValueStr : valueStr;
    const rawDate = isAlt ? altDateStr : dateStr;
    const val = parseFloat(rawVal);
    if (isNaN(val) || !rawDate) {
      toast({ title: "Invalid input", description: "Enter a valid date and value.", variant: "destructive" });
      return;
    }
    const metricId = isAlt ? (config.altMetric as CapacityMetricId) : config.id;
    const u = isAlt ? (config.altUnit ?? "s") : unit;
    addCapacityResult({ metricId, dateISO: rawDate, value: val, unit: u, source: "manual" });
    if (isAlt) { setAltValueStr(""); } else { setValueStr(""); setTimerDone(false); }
    onResultAdded();
    toast({ title: "Result saved", description: `${isAlt ? config.altLabel : config.label}: ${val} ${u}` });
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    deleteCapacityResult(id);
    onResultDeleted();
    toast({ title: "Result deleted" });
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {config.icon}
            <div>
              <p className="text-sm font-semibold leading-tight">{config.label}</p>
              <p className="text-[10px] text-muted-foreground">{config.unit}</p>
            </div>
          </div>
          {/* Latest value */}
          {latest && (() => {
            // We need to compute the score for display
            // This is a simplified re-computation
            return (
              <div className="text-right flex-shrink-0">
                <p className="text-xl font-black tabular-nums leading-tight text-foreground">
                  {latest.value}
                </p>
                <p className="text-[10px] text-muted-foreground">{latest.unit}</p>
              </div>
            );
          })()}
          {!latest && <p className="text-sm text-muted-foreground">No data</p>}
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed">{config.description}</p>

        {/* Trend chart */}
        {chartData.length >= 2 ? (
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 2, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={38} />
                <RTooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`${v} ${unit}`, config.label]} />
                {config.referenceLines?.map((rl) => (
                  <ReferenceLine key={rl.value} y={rl.value} stroke="#10b981" strokeDasharray="4 2" strokeOpacity={0.7}
                    label={{ value: rl.label, position: "right", fontSize: 8, fill: "#10b981" }} />
                ))}
                <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2}
                  dot={{ r: 3, fill: "hsl(var(--primary))" }} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : chartData.length === 1 ? (
          <p className="text-xs text-muted-foreground text-center py-2 bg-muted/30 rounded">
            Add a second result to see trend
          </p>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-2 bg-muted/30 rounded">
            No results yet
          </p>
        )}

        {/* Coaching note */}
        <p className="text-[10px] text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-2">
          {config.coachingNote}
        </p>

        {/* Action bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="h-7 text-xs"
            onClick={() => { setShowForm((v) => !v); setShowInstructions(false); setShowHistory(false); }}>
            <Plus className="w-3 h-3 mr-1" />
            Add Result
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs"
            onClick={() => { setShowInstructions((v) => !v); setShowForm(false); setShowHistory(false); }}>
            <Info className="w-3 h-3 mr-1" />
            How to test
          </Button>
          {results.length > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs"
              onClick={() => { setShowHistory((v) => !v); setShowForm(false); setShowInstructions(false); }}>
              History ({results.length})
              {showHistory ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
            </Button>
          )}
        </div>

        {/* How to test */}
        {showInstructions && (
          <div className="rounded-md bg-muted/40 p-3 text-xs leading-relaxed space-y-2">
            <p className="font-semibold">How to test</p>
            <p className="text-muted-foreground">{config.testInstructions}</p>
            {config.altMetric && (
              <Button variant="ghost" size="sm" className="h-6 text-xs px-2 mt-1"
                onClick={() => setShowAlt((v) => !v)}>
                {showAlt ? "Hide" : "Show"} {config.altLabel}
              </Button>
            )}
          </div>
        )}

        {/* Add result form */}
        {showForm && (
          <div className="border rounded-md p-3 space-y-2 bg-muted/30">
            <p className="text-xs font-semibold">Add Result</p>

            {/* Timer (if configured) */}
            {config.timerMode && (
              <TimerWidget
                mode={config.timerMode}
                duration={config.timerDuration}
                label={config.timerLabel ?? "Timer"}
                onComplete={(elapsed) => {
                  setTimerDone(true);
                  if (config.timerMode === "stopwatch") {
                    setValueStr(String(elapsed));
                  }
                }}
              />
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-muted-foreground mb-1 block">Date</Label>
                <Input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} className="h-7 text-xs" />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground mb-1 block">
                  Value ({unit}){config.timerMode === "stopwatch" && timerDone ? " (auto-filled)" : ""}
                </Label>
                <div className="flex gap-1">
                  <Input
                    type="number"
                    step="any"
                    placeholder={`e.g. ${config.id === "vo2max" ? "42" : config.id === "grip-strength" ? "36" : "15"}`}
                    value={valueStr}
                    onChange={(e) => setValueStr(e.target.value)}
                    className="h-7 text-xs flex-1"
                  />
                  {config.unitOptions && config.unitOptions.length > 1 && (
                    <Select value={unit} onValueChange={setUnit}>
                      <SelectTrigger className="h-7 w-14 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {config.unitOptions.map((u) => (
                          <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="h-7 text-xs" onClick={() => handleAdd(false)}>Save</Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setShowForm(false); setTimerDone(false); }}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Alternative test form */}
        {showAlt && config.altMetric && (
          <div className="border border-dashed rounded-md p-3 space-y-2 bg-muted/20">
            <p className="text-xs font-semibold">{config.altLabel}</p>
            {config.altTimerMode && (
              <TimerWidget
                mode={config.altTimerMode}
                label="Hold until you put the foot down"
                onComplete={(elapsed) => setAltValueStr(String(elapsed))}
              />
            )}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-muted-foreground mb-1 block">Date</Label>
                <Input type="date" value={altDateStr} onChange={(e) => setAltDateStr(e.target.value)} className="h-7 text-xs" />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground mb-1 block">Seconds</Label>
                <Input type="number" step="any" value={altValueStr} onChange={(e) => setAltValueStr(e.target.value)} className="h-7 text-xs" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="h-7 text-xs" onClick={() => handleAdd(true)}>Save</Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowAlt(false)}>Cancel</Button>
            </div>
            {altResults.length > 0 && (
              <p className="text-[10px] text-muted-foreground">
                Latest: {altResults[altResults.length - 1].value}s ({altResults[altResults.length - 1].dateISO})
              </p>
            )}
          </div>
        )}

        {/* History table */}
        {showHistory && results.length > 0 && (
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-2 font-medium text-muted-foreground">Date</th>
                  <th className="text-right p-2 font-medium text-muted-foreground">Value</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {[...results].reverse().slice(0, 8).map((r) => (
                  <tr key={r.id} className="border-t border-border/40">
                    <td className="p-2 text-muted-foreground">{r.dateISO}</td>
                    <td className="p-2 text-right font-semibold tabular-nums">
                      {r.value} <span className="text-muted-foreground font-normal text-[10px]">{r.unit}</span>
                    </td>
                    <td className="p-2">
                      <button onClick={() => handleDelete(r.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Re-export for health-risk page
export { FRS_ZONES };
