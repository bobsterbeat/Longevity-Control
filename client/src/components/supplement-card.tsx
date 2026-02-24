import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { EvidenceBadge } from "./evidence-badge";
import { PlanCategory, PlanItem } from "@shared/schema";
import { Pill, ChevronDown, ChevronUp, AlertTriangle, FlaskConical, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function TimingBadge({ timing }: { timing?: "AM" | "PM" | "anytime" }) {
  if (!timing || timing === "anytime") return null;
  return (
    <Badge
      variant="outline"
      className={`text-[10px] px-1.5 py-0 h-4 font-semibold border-0 ${
        timing === "AM"
          ? "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
          : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
      }`}
    >
      {timing}
    </Badge>
  );
}

function SupplementItem({ item }: { item: PlanItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-md bg-muted/40 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <TimingBadge timing={item.timing} />
            <EvidenceBadge color={item.evidenceColor} />
          </div>
          <p className="text-sm font-medium leading-snug">{item.text}</p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 flex-shrink-0 mt-0.5"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </Button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{item.why}</p>
            {item.cautions && (
              <div className="flex items-start gap-1.5 mt-2 p-2 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/40">
                <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  {item.cautions}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface SupplementCardProps {
  plan: PlanCategory;
}

export function SupplementCard({ plan }: SupplementCardProps) {
  const [showExp, setShowExp] = useState(false);

  const suggestedItems = plan.items.filter((i) => !i.isExperimental && i.group === "suggested");
  const stackItems = plan.items.filter((i) => !i.isExperimental && i.group === "stack");
  const experimentalItems = plan.items.filter((i) => i.isExperimental === true);

  return (
    <Card data-testid="card-plan-pill">
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-3">
        <div className="p-2 rounded-md bg-primary/10">
          <Pill className="w-4 h-4 text-primary" />
        </div>
        <CardTitle className="text-base">{plan.title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Suggested Today — context-specific based on today's state */}
        {suggestedItems.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3 h-3 text-primary" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Suggested Today
              </p>
            </div>
            <div className="space-y-2">
              {suggestedItems.map((item, idx) => (
                <SupplementItem key={idx} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Daily Stack — always-on protocol */}
        {stackItems.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Daily Stack
            </p>
            <div className="space-y-2">
              {stackItems.map((item, idx) => (
                <SupplementItem key={idx} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Experimental / Emerging — toggle-gated */}
        {experimentalItems.length > 0 && (
          <div className="border-t border-border/60 pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5 text-orange-500" />
                <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                  Experimental / Emerging
                </p>
              </div>
              <Switch
                checked={showExp}
                onCheckedChange={setShowExp}
                data-testid="switch-experimental-supplements"
              />
            </div>

            <AnimatePresence>
              {showExp && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden space-y-2"
                >
                  <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                    Orange-tier items have limited human evidence. Treat as exploratory — consult a physician before starting.
                  </p>
                  {experimentalItems.map((item, idx) => (
                    <SupplementItem key={idx} item={item} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
