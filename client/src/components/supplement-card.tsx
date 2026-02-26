import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { EvidenceBadge } from "./evidence-badge";
import {
  Pill,
  Sparkles,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  Zap,
  Snowflake,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  recommendSupplements,
  evidenceLevelToColor,
  type RankedSupplement,
  type ModalityStatus,
  type SupplementTiming,
} from "@/lib/supplements";
import type { DailyMetrics } from "@shared/schema";

// ─── Props ────────────────────────────────────────────────────────────────────

interface SupplementCardProps {
  today: DailyMetrics;
  ili: number;
  hrvDiffPct: number;
  sleepConsistency: number;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SupplementCard({ today, ili, hrvDiffPct, sleepConsistency }: SupplementCardProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showExp, setShowExp] = useState(false);

  const { ranked, modalities } = useMemo(
    () => recommendSupplements(today, ili, hrvDiffPct, sleepConsistency),
    [today, ili, hrvDiffPct, sleepConsistency]
  );

  // Suggested = conditional items with at least one trigger fired (score > evidence-multiplier alone)
  const suggested = ranked.filter((s) => s.group === "conditional" && s.score >= 2).slice(0, 4);
  const stack = ranked.filter((s) => s.group === "stack");
  const experimental = ranked.filter((s) => s.group === "experimental");

  const toggle = (id: string) => setExpanded((prev) => (prev === id ? null : id));

  return (
    <Card data-testid="card-plan-pill">
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-3">
        <div className="p-2 rounded-md bg-primary/10">
          <Pill className="w-4 h-4 text-primary" />
        </div>
        <CardTitle className="text-base">Supplements & Recovery</CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">

        {/* Suggested Today */}
        {suggested.length > 0 && (
          <section>
            <SectionLabel icon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />} label="Suggested Today" />
            <div className="space-y-2 mt-2">
              {suggested.map((s) => (
                <SupplementRow key={s.id} supplement={s} expanded={expanded} onToggle={toggle} />
              ))}
            </div>
          </section>
        )}

        <Separator />

        {/* Recovery Modalities */}
        <section>
          <SectionLabel icon={<Zap className="w-3.5 h-3.5 text-sky-500" />} label="Recovery Modalities" />
          <div className="grid grid-cols-2 gap-3 mt-2">
            {modalities.map((m) => (
              <ModalityCard key={m.id} modality={m} expanded={expanded} onToggle={toggle} />
            ))}
          </div>
        </section>

        <Separator />

        {/* Daily Stack */}
        <section>
          <SectionLabel icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />} label="Daily Stack" />
          <div className="space-y-2 mt-2">
            {stack.map((s) => (
              <SupplementRow key={s.id} supplement={s} expanded={expanded} onToggle={toggle} compact />
            ))}
          </div>
        </section>

        {/* Experimental Toggle */}
        <div className="border-t border-border/60 pt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5 text-orange-500" />
              <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                Experimental / Emerging
              </p>
            </div>
            <Switch checked={showExp} onCheckedChange={setShowExp} data-testid="switch-experimental-supplements" />
          </div>

          <AnimatePresence>
            {showExp && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                  Limited human evidence. Treat as exploratory — consult a physician before starting.
                </p>
                <div className="space-y-2">
                  {experimental.map((s) => (
                    <SupplementRow key={s.id} supplement={s} expanded={expanded} onToggle={toggle} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-[10px] text-muted-foreground italic border-t pt-3">
          Not medical advice. Consult your healthcare provider before starting any supplement, especially if on medications or managing a health condition.
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{label}</span>
    </div>
  );
}

// ─── Timing Badge ─────────────────────────────────────────────────────────────

function TimingBadge({ timing }: { timing: SupplementTiming }) {
  const labels: Record<SupplementTiming, string> = {
    AM: "AM",
    PM: "PM",
    bedtime: "Bedtime",
    "with-meals": "With meals",
    "pre-exercise": "Pre-exercise",
  };
  const isAM = timing === "AM";
  const isDark = timing === "PM" || timing === "bedtime";
  const className = isAM
    ? "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
    : isDark
    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
    : "bg-muted text-muted-foreground";
  return (
    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border-0 ${className}`}>
      {labels[timing]}
    </Badge>
  );
}

// ─── Supplement Row ───────────────────────────────────────────────────────────

function SupplementRow({
  supplement,
  expanded,
  onToggle,
  compact = false,
}: {
  supplement: RankedSupplement;
  expanded: string | null;
  onToggle: (id: string) => void;
  compact?: boolean;
}) {
  const isOpen = expanded === supplement.id;

  return (
    <div className="rounded-md bg-muted/40 overflow-hidden">
      <button
        className="w-full flex items-start justify-between gap-2 p-3 text-left hover:bg-muted/60 transition-colors"
        onClick={() => onToggle(supplement.id)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <TimingBadge timing={supplement.timing} />
            <EvidenceBadge color={evidenceLevelToColor[supplement.evidenceLevel]} />
            {supplement.safetyBadges.map((b) => (
              <Badge
                key={b}
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-4 border-0 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
              >
                {b}
              </Badge>
            ))}
          </div>
          <p className="text-sm font-medium leading-snug">{supplement.name}</p>
          {!compact && supplement.rationale.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">{supplement.rationale[0]}</p>
          )}
          {compact && (
            <p className="text-xs text-muted-foreground mt-0.5">{supplement.timingNote.split(".")[0]}</p>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3 border-t border-border/40">
              <DetailList label="Mechanisms" items={supplement.mechanisms} />

              <div>
                <DetailHeading label="Evidence" />
                <p className="text-xs text-muted-foreground leading-relaxed">{supplement.evidenceNote}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <DetailHeading label="Dose" />
                  <p className="text-xs">{supplement.dose}</p>
                </div>
                <div>
                  <DetailHeading label="Onset" />
                  <p className="text-xs">{supplement.onset}</p>
                </div>
              </div>

              <div>
                <DetailHeading label="Timing" />
                <p className="text-xs text-muted-foreground">{supplement.timingNote}</p>
              </div>

              {supplement.avoidIf.length > 0 && (
                <div className="rounded bg-red-50 dark:bg-red-950/30 p-2">
                  <p className="text-[10px] font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Avoid If
                  </p>
                  <ul className="space-y-0.5">
                    {supplement.avoidIf.map((a, i) => (
                      <li key={i} className="text-xs text-red-700 dark:text-red-300">
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {supplement.interactions.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                    <Info className="w-3 h-3" /> Drug Interactions
                  </p>
                  <ul className="space-y-0.5">
                    {supplement.interactions.map((item, i) => (
                      <li key={i} className="text-xs text-muted-foreground">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {supplement.sideEffects.length > 0 && (
                <DetailList label="Side Effects" items={supplement.sideEffects} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Modality Card ────────────────────────────────────────────────────────────

function ModalityCard({
  modality,
  expanded,
  onToggle,
}: {
  modality: ModalityStatus;
  expanded: string | null;
  onToggle: (id: string) => void;
}) {
  const isOpen = expanded === modality.id;
  const isCold = modality.icon === "cold";

  const containerStyles: Record<string, string> = {
    recommended: "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20",
    caution: "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20",
    hold: "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20",
  };

  const badgeStyles: Record<string, string> = {
    recommended: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    caution: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    hold: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  };

  const Icon = isCold ? Snowflake : Flame;
  const iconColor = isCold ? "text-sky-500" : "text-orange-500";
  const statusLabel =
    modality.status === "recommended" ? "Recommended" : modality.status === "caution" ? "Caution" : "Hold today";

  return (
    <div className={`rounded-md border overflow-hidden ${containerStyles[modality.status]}`}>
      <button
        className="w-full p-3 text-left"
        onClick={() => onToggle(modality.id)}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <Icon className={`w-4 h-4 ${iconColor}`} />
          <span className="text-sm font-medium">{modality.name}</span>
        </div>
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 h-4 border-0 mb-1.5 ${badgeStyles[modality.status]}`}
        >
          {statusLabel}
        </Badge>
        <p className="text-xs text-muted-foreground leading-snug">{modality.reason}</p>
        <p className="text-xs font-medium mt-1.5">{modality.protocol}</p>
        <div className="flex justify-end mt-1">
          {isOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3 border-t border-border/30">
              <DetailList label="Mechanisms" items={modality.mechanisms} />
              <div>
                <DetailHeading label="Evidence" />
                <p className="text-xs text-muted-foreground leading-relaxed">{modality.evidenceNote}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function DetailHeading({ label }: { label: string }) {
  return (
    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 mt-2">{label}</p>
  );
}

function DetailList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <DetailHeading label={label} />
      <ul className="space-y-0.5">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-muted-foreground">
            • {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
