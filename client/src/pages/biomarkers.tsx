import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  ReferenceArea,
  ReferenceLine,
} from "recharts";
import {
  FlaskConical,
  Plus,
  Upload,
  ChevronDown,
  ChevronUp,
  Trash2,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import {
  BIOMARKERS,
  CATEGORY_LABELS,
  type BiomarkerDefinition,
  type BiomarkerCategory,
} from "@/lib/labs/biomarkers";
import {
  seedIfEmpty,
  getAllResults,
  getResultsForBiomarker,
  getLatestResults,
  addResult,
  deleteResult,
  importFromCSV,
  type LabResult,
} from "@/lib/labs/store";
import {
  computeLBS,
  scoreBiomarker,
  bandColor,
  bandBg,
  bandLabel,
  lbsColor,
  lbsLabel,
  type LBSResult,
} from "@/lib/labs/scoring";
import { getRecommendations, priorityColor, categoryIcon } from "@/lib/labs/recommendations";

// ─── Constants ───────────────────────────────────────────────────────────────

const chartTooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "11px",
  padding: "6px 10px",
};

const CATEGORIES: BiomarkerCategory[] = ["inflammation", "metabolic", "cardiovascular", "organ"];

const CATEGORY_COLORS: Record<BiomarkerCategory, string> = {
  inflammation: "text-red-600 dark:text-red-400",
  metabolic: "text-amber-600 dark:text-amber-400",
  cardiovascular: "text-sky-600 dark:text-sky-400",
  organ: "text-emerald-600 dark:text-emerald-400",
};

const CATEGORY_BG: Record<BiomarkerCategory, string> = {
  inflammation: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
  metabolic: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800",
  cardiovascular: "bg-sky-50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-800",
  organ: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800",
};

const CATEGORY_PROGRESS: Record<BiomarkerCategory, string> = {
  inflammation: "[&>div]:bg-red-500",
  metabolic: "[&>div]:bg-amber-500",
  cardiovascular: "[&>div]:bg-sky-500",
  organ: "[&>div]:bg-emerald-500",
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BiomarkersPage() {
  const { toast } = useToast();
  const [tick, setTick] = useState(0); // bump to force re-render after data changes
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BiomarkerCategory | "all">("all");
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);

  // Seed on first load
  useEffect(() => {
    seedIfEmpty();
    setTick((t) => t + 1);
  }, []);

  const lbsResult = useMemo<LBSResult>(() => computeLBS(), [tick]);
  const recommendations = useMemo(() => getRecommendations(lbsResult), [lbsResult]);

  const refresh = () => setTick((t) => t + 1);

  // Visible biomarkers based on filters
  const visibleBiomarkers = useMemo(() => {
    return BIOMARKERS.filter((b) => {
      if (b.isAdvanced && !showAdvanced) return false;
      if (selectedCategory !== "all" && b.category !== selectedCategory) return false;
      return true;
    });
  }, [showAdvanced, selectedCategory]);

  return (
    <ScrollArea className="h-full">
      <div className="p-4 max-w-5xl mx-auto space-y-4 pb-8">
        {/* Page Header */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-md bg-primary/10">
            <FlaskConical className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Biomarkers</h1>
            <p className="text-xs text-muted-foreground">Longevity lab tracking &amp; analysis</p>
          </div>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="labs">Labs</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
          </TabsList>

          {/* ── Overview Tab ────────────────────────────────────────────────── */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <OverviewTab lbsResult={lbsResult} recommendations={recommendations} />
          </TabsContent>

          {/* ── Labs Tab ─────────────────────────────────────────────────────── */}
          <TabsContent value="labs" className="mt-4">
            <div className="space-y-3">
              {/* Controls row */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Category filter */}
                <div className="flex gap-1.5 flex-wrap">
                  {(["all", ...CATEGORIES] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat as typeof selectedCategory)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        selectedCategory === cat
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {cat === "all" ? "All" : CATEGORY_LABELS[cat as BiomarkerCategory]}
                    </button>
                  ))}
                </div>

                <div className="flex-1" />

                {/* Advanced toggle */}
                <div className="flex items-center gap-1.5">
                  <Switch
                    checked={showAdvanced}
                    onCheckedChange={setShowAdvanced}
                    id="show-advanced"
                  />
                  <Label htmlFor="show-advanced" className="text-xs text-muted-foreground">
                    Advanced
                  </Label>
                </div>

                {/* CSV Import */}
                <CsvImportDialog
                  open={csvDialogOpen}
                  onOpenChange={setCsvDialogOpen}
                  onImported={() => { refresh(); setCsvDialogOpen(false); }}
                  toast={toast}
                />
              </div>

              {/* Biomarker cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {visibleBiomarkers.map((def) => (
                  <BiomarkerLabCard
                    key={def.id}
                    def={def}
                    tick={tick}
                    onResultAdded={refresh}
                    onResultDeleted={refresh}
                    toast={toast}
                  />
                ))}
              </div>

              {visibleBiomarkers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No biomarkers match the current filter.
                </p>
              )}
            </div>
          </TabsContent>

          {/* ── Education Tab ─────────────────────────────────────────────────── */}
          <TabsContent value="education" className="mt-4">
            <EducationTab />
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ lbsResult, recommendations }: { lbsResult: LBSResult; recommendations: ReturnType<typeof getRecommendations> }) {
  return (
    <div className="space-y-4">
      {/* LBS Score card */}
      <Card>
        <CardContent className="pt-6 pb-4">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Big score */}
            <div className="flex flex-col items-center text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1 font-semibold">
                Longevity Biology Score
              </p>
              {lbsResult.hasData ? (
                <>
                  <p className={`text-7xl font-black tabular-nums leading-none ${lbsColor(lbsResult.lbs)}`}>
                    {lbsResult.lbs}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">/100</p>
                  <Badge
                    variant="outline"
                    className={`mt-2 border-0 text-xs ${lbsColor(lbsResult.lbs)} ${
                      lbsResult.lbs >= 80
                        ? "bg-emerald-100 dark:bg-emerald-900/30"
                        : lbsResult.lbs >= 65
                        ? "bg-sky-100 dark:bg-sky-900/30"
                        : lbsResult.lbs >= 50
                        ? "bg-amber-100 dark:bg-amber-900/30"
                        : "bg-red-100 dark:bg-red-900/30"
                    }`}
                  >
                    {lbsLabel(lbsResult.lbs)}
                  </Badge>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-4xl font-black text-muted-foreground">—</p>
                  <p className="text-xs text-muted-foreground mt-2">No lab data yet</p>
                </div>
              )}
            </div>

            <div className="flex-1 w-full">
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                Composite score weighted across Inflammation (30%), Metabolic (35%), Cardiovascular (25%), and Organ Function (10%). Higher is better.
              </p>
              <div className="space-y-2.5">
                {CATEGORIES.map((cat) => {
                  const cs = lbsResult.categories[cat];
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-xs font-medium ${CATEGORY_COLORS[cat]}`}>
                          {CATEGORY_LABELS[cat]}
                        </span>
                        <span className="text-xs font-bold tabular-nums">
                          {cs.biomarkerScores.length > 0 ? cs.score : "—"}
                        </span>
                      </div>
                      <Progress
                        value={cs.biomarkerScores.length > 0 ? cs.score : 0}
                        className={`h-1.5 ${CATEGORY_PROGRESS[cat]}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category cards 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        {CATEGORIES.map((cat) => {
          const cs = lbsResult.categories[cat];
          return (
            <Card key={cat} className={`border ${CATEGORY_BG[cat]}`}>
              <CardContent className="p-4">
                <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${CATEGORY_COLORS[cat]}`}>
                  {CATEGORY_LABELS[cat]}
                </p>
                <div className="flex items-end gap-2">
                  <p className={`text-3xl font-black tabular-nums leading-none ${CATEGORY_COLORS[cat]}`}>
                    {cs.biomarkerScores.length > 0 ? cs.score : "—"}
                  </p>
                  {cs.biomarkerScores.length > 0 && (
                    <p className="text-xs text-muted-foreground mb-0.5">/100</p>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {cs.biomarkerScores.length} biomarker{cs.biomarkerScores.length !== 1 ? "s" : ""} tracked
                </p>
                {/* Mini breakdown */}
                <div className="mt-2 space-y-1">
                  {cs.biomarkerScores.slice(0, 3).map((bs) => {
                    const def = BIOMARKERS.find((b) => b.id === bs.biomarkerId);
                    return (
                      <div key={bs.biomarkerId} className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">{def?.shortName ?? bs.biomarkerId}</span>
                        <span className={`text-[10px] font-semibold ${bandColor(bs.band)}`}>
                          {bandLabel(bs.band)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Next Best Actions */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Next Best Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recommendations.map((action) => (
              <div
                key={action.id}
                className="rounded-md bg-muted/40 p-3 space-y-1.5"
              >
                <div className="flex items-start gap-2 flex-wrap">
                  <span className="text-base leading-none">{categoryIcon(action.category)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <p className="text-sm font-semibold leading-snug">{action.title}</p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 h-4 border-0 ${priorityColor(action.priority)}`}
                      >
                        {action.priority}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 h-4 border-0 bg-muted text-muted-foreground"
                      >
                        {action.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{action.description}</p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 italic">
                      Expected: {action.expectedImpact}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <p className="text-[10px] text-muted-foreground italic text-center pb-2">
        Not medical advice. Scores are educational tools. Consult your healthcare provider for interpretation.
      </p>
    </div>
  );
}

// ─── Biomarker Lab Card ───────────────────────────────────────────────────────

function BiomarkerLabCard({
  def,
  tick,
  onResultAdded,
  onResultDeleted,
  toast,
}: {
  def: BiomarkerDefinition;
  tick: number;
  onResultAdded: () => void;
  onResultDeleted: () => void;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().slice(0, 10));
  const [valueStr, setValueStr] = useState("");
  const [notes, setNotes] = useState("");

  const results = useMemo(() => getResultsForBiomarker(def.id), [def.id, tick]);
  const latestResults = useMemo(() => getLatestResults(), [tick]);

  // For computed biomarkers, compute the value on the fly
  let displayValue: number | null = null;
  let displayResult: LabResult | null = null;

  if (def.isComputed && def.computedFrom) {
    if (def.id === "tg-hdl-ratio") {
      const tg = latestResults["tg"]?.value;
      const hdl = latestResults["hdl"]?.value;
      if (tg != null && hdl != null && hdl > 0) {
        displayValue = parseFloat((tg / hdl).toFixed(2));
      }
    }
  } else {
    displayResult = latestResults[def.id] ?? null;
    displayValue = displayResult?.value ?? null;
  }

  const bandScore = displayValue != null ? scoreBiomarker(def, displayValue) : null;

  const chartData = useMemo(
    () =>
      results.map((r) => ({
        date: new Date(r.dateISO).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value: r.value,
      })),
    [results]
  );

  // Compute Y-axis reference area bounds
  const cfg = def.scoring;
  let idealY1: number | undefined;
  let idealY2: number | undefined;
  let acceptY1: number | undefined;
  let acceptY2: number | undefined;
  let flagY: number | undefined;

  if (cfg.type === "lower") {
    idealY1 = 0;
    idealY2 = cfg.ideal;
    acceptY1 = cfg.ideal;
    acceptY2 = cfg.acceptable;
    flagY = cfg.flag;
  } else if (cfg.type === "higher") {
    idealY1 = cfg.ideal;
    idealY2 = undefined; // extends to top
    acceptY1 = cfg.acceptable;
    acceptY2 = cfg.ideal;
    flagY = cfg.flag;
  } else {
    idealY1 = cfg.idealMin;
    idealY2 = cfg.idealMax;
    acceptY1 = cfg.acceptableMin;
    acceptY2 = cfg.acceptableMax;
  }

  const handleAdd = () => {
    const val = parseFloat(valueStr);
    if (isNaN(val) || !dateStr) {
      toast({ title: "Invalid input", description: "Please enter a valid date and value.", variant: "destructive" });
      return;
    }
    addResult({ biomarkerId: def.id, dateISO: dateStr, value: val, unit: def.unit, source: "manual", notes: notes || undefined });
    setValueStr("");
    setNotes("");
    setShowForm(false);
    onResultAdded();
    toast({ title: "Result added", description: `${def.name}: ${val} ${def.unit}` });
  };

  const handleDelete = (id: string) => {
    deleteResult(id);
    onResultDeleted();
    toast({ title: "Result deleted" });
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-sm font-semibold">{def.name}</p>
              {def.isAdvanced && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-0 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                  Advanced
                </Badge>
              )}
              {def.isComputed && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-0 bg-muted text-muted-foreground">
                  Computed
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">
              {CATEGORY_LABELS[def.category]} · Tier {def.tier}
            </p>
          </div>

          {/* Latest value */}
          <div className="text-right flex-shrink-0">
            {displayValue != null ? (
              <>
                <p className={`text-xl font-black tabular-nums leading-tight ${bandScore ? bandColor(bandScore.band) : ""}`}>
                  {displayValue}
                </p>
                <p className="text-[10px] text-muted-foreground">{def.unit}</p>
                {bandScore && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 h-4 border-0 mt-0.5 ${bandBg(bandScore.band)} ${bandColor(bandScore.band)}`}
                  >
                    {bandLabel(bandScore.band)}
                  </Badge>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
          </div>
        </div>

        {/* Trend Chart */}
        {chartData.length >= 2 ? (
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={40} />
                <RTooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(v: number) => [`${v} ${def.unit}`, def.shortName]}
                />
                {/* Ideal band */}
                {idealY1 != null && idealY2 != null && (
                  <ReferenceArea y1={idealY1} y2={idealY2} fill="#10b981" fillOpacity={0.08} />
                )}
                {/* Acceptable band */}
                {acceptY1 != null && acceptY2 != null && (
                  <ReferenceArea y1={acceptY1} y2={acceptY2} fill="#f59e0b" fillOpacity={0.08} />
                )}
                {/* Flag line */}
                {flagY != null && (
                  <ReferenceLine y={flagY} stroke="#ef4444" strokeDasharray="4 2" strokeOpacity={0.6} />
                )}
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "hsl(var(--primary))" }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : chartData.length === 1 ? (
          <div className="text-xs text-muted-foreground text-center py-3 bg-muted/30 rounded">
            Add a second result to see trend chart
          </div>
        ) : (
          <div className="text-xs text-muted-foreground text-center py-3 bg-muted/30 rounded">
            No results yet
          </div>
        )}

        {/* Target reference */}
        <p className="text-[10px] text-muted-foreground leading-relaxed border-l-2 border-border pl-2">
          {def.targetDescription}
        </p>

        {/* Action buttons */}
        {!def.isComputed && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs flex-1"
              onClick={() => { setShowForm((v) => !v); setShowHistory(false); }}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Result
            </Button>
            {results.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => { setShowHistory((v) => !v); setShowForm(false); }}
              >
                History ({results.length})
                {showHistory ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
              </Button>
            )}
          </div>
        )}

        {/* Add Result Form */}
        {showForm && !def.isComputed && (
          <div className="border rounded-md p-3 space-y-2 bg-muted/30">
            <p className="text-xs font-semibold">Add Result</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-muted-foreground mb-1 block">Date</Label>
                <Input
                  type="date"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground mb-1 block">Value ({def.unit})</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g. 1.2"
                  value={valueStr}
                  onChange={(e) => setValueStr(e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">Notes (optional)</Label>
              <Input
                placeholder="e.g. fasting, Quest Diagnostics"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="h-7 text-xs" onClick={handleAdd}>Save</Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {/* History */}
        {showHistory && results.length > 0 && (
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-2 font-medium text-muted-foreground">Date</th>
                  <th className="text-right p-2 font-medium text-muted-foreground">Value</th>
                  <th className="text-left p-2 font-medium text-muted-foreground">Notes</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {[...results].reverse().slice(0, 10).map((r) => {
                  const bs = scoreBiomarker(def, r.value);
                  return (
                    <tr key={r.id} className="border-t border-border/50">
                      <td className="p-2 text-muted-foreground">{r.dateISO}</td>
                      <td className={`p-2 text-right font-semibold tabular-nums ${bandColor(bs.band)}`}>
                        {r.value} <span className="text-muted-foreground font-normal text-[10px]">{r.unit}</span>
                      </td>
                      <td className="p-2 text-muted-foreground truncate max-w-[100px]">{r.notes ?? "—"}</td>
                      <td className="p-2">
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── CSV Import Dialog ────────────────────────────────────────────────────────

function CsvImportDialog({
  open,
  onOpenChange,
  onImported,
  toast,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImported: () => void;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>("");
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setPreview(text.slice(0, 400));
      const res = importFromCSV(text);
      setResult(res);
      if (res.imported > 0) onImported();
      toast({
        title: `Imported ${res.imported} results`,
        description: res.errors.length > 0 ? `${res.skipped} rows skipped` : undefined,
      });
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
          <Upload className="w-3 h-3" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Lab Results from CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="rounded-md bg-muted p-3 text-xs space-y-1">
            <p className="font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">Required columns</p>
            <code className="block text-[11px]">date, biomarker, value</code>
            <p className="font-semibold text-muted-foreground uppercase tracking-wide text-[10px] mt-2">Optional columns</p>
            <code className="block text-[11px]">unit, source, notes</code>
            <p className="text-muted-foreground mt-2 text-[10px]">
              Date must be YYYY-MM-DD format. Biomarker names are fuzzy-matched (e.g. "hs-crp", "hsCRP", "HbA1c", "A1c").
            </p>
          </div>

          <div className="rounded-md bg-muted p-3 text-xs">
            <p className="font-semibold text-muted-foreground uppercase tracking-wide text-[10px] mb-1">Example CSV</p>
            <code className="block text-[11px] whitespace-pre leading-relaxed">
{`date,biomarker,value,unit,notes
2026-01-15,hs-crp,0.82,mg/L,Quest Diagnostics
2026-01-15,HbA1c,5.3,%,fasting
2026-01-15,ApoB,90,mg/dL,`}
            </code>
          </div>

          <div>
            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
            <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Choose CSV file
            </Button>
          </div>

          {result && (
            <div className="rounded-md border p-3 text-xs space-y-1">
              <p className="text-emerald-600 dark:text-emerald-400 font-semibold">✓ {result.imported} rows imported</p>
              {result.skipped > 0 && <p className="text-amber-600">{result.skipped} rows skipped</p>}
              {result.errors.slice(0, 5).map((e, i) => (
                <p key={i} className="text-red-600">{e}</p>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Education Tab ────────────────────────────────────────────────────────────

function EducationTab() {
  const [selectedCategory, setSelectedCategory] = useState<BiomarkerCategory | "all">("all");

  const visible = BIOMARKERS.filter(
    (b) => selectedCategory === "all" || b.category === selectedCategory
  );

  return (
    <div className="space-y-3">
      {/* Category filter */}
      <div className="flex gap-1.5 flex-wrap">
        {(["all", ...CATEGORIES] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat as typeof selectedCategory)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              selectedCategory === cat
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            {cat === "all" ? "All" : CATEGORY_LABELS[cat as BiomarkerCategory]}
          </button>
        ))}
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {visible.map((def) => (
          <AccordionItem
            key={def.id}
            value={def.id}
            className="border rounded-md overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-2 text-left">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold">{def.name}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 h-4 border-0 ${CATEGORY_COLORS[def.category]} ${CATEGORY_BG[def.category]}`}
                    >
                      {CATEGORY_LABELS[def.category]}
                    </Badge>
                    {def.isAdvanced && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-0 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                        Advanced
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {def.unit} · Recheck: {def.recheckFrequency.split(".")[0]}
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4 pt-2">
                <EduSection label="What it measures" content={def.whatItMeasures} />
                <EduSection label="Why it matters" content={def.whyItMatters} />
                <EduSection label="Mechanism" content={def.mechanism} />

                <div className="rounded-md bg-muted/50 border border-border/60 p-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Target</p>
                  <p className="text-xs leading-relaxed">{def.targetDescription}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <EduList label="What raises it" items={def.whatRaisesIt} icon={<TrendingUp className="w-3 h-3 text-red-500" />} />
                  <EduList label="What lowers it" items={def.whatLowersIt} icon={<TrendingDown className="w-3 h-3 text-emerald-500" />} />
                </div>

                {def.references.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Key References</p>
                    <ul className="space-y-0.5">
                      {def.references.map((ref, i) => (
                        <li key={i} className="text-[10px] text-muted-foreground leading-relaxed">• {ref}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

// ─── Education helpers ────────────────────────────────────────────────────────

function EduSection({ label, content }: { label: string; content: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <p className="text-xs leading-relaxed text-foreground">{content}</p>
    </div>
  );
}

function EduList({ label, items, icon }: { label: string; items: string[]; icon: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1 mb-1">
        {icon}
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      </div>
      <ul className="space-y-0.5">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-muted-foreground leading-relaxed">• {item}</li>
        ))}
      </ul>
    </div>
  );
}
