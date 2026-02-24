import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EvidenceBadge } from "./evidence-badge";
import { PlanCategory } from "@shared/schema";
import { Activity, UtensilsCrossed, Pill, Moon, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const iconMap: Record<string, typeof Activity> = {
  activity: Activity,
  utensils: UtensilsCrossed,
  pill: Pill,
  moon: Moon,
};

interface PlanCardProps {
  plan: PlanCategory;
}

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

export function PlanCard({ plan }: PlanCardProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const Icon = iconMap[plan.icon] || Activity;

  return (
    <Card data-testid={`card-plan-${plan.icon}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="p-2 rounded-md bg-primary/10">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <CardTitle className="text-base">{plan.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {plan.items.map((item, idx) => (
          <div
            key={idx}
            className="rounded-md bg-muted/40 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium flex-1">{item.text}</p>
              <div className="flex items-center gap-1 flex-shrink-0">
                <TimingBadge timing={item.timing} />
                <EvidenceBadge color={item.evidenceColor} />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                  data-testid={`button-expand-${plan.icon}-${idx}`}
                >
                  {expandedIdx === idx ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {expandedIdx === idx && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    {item.why}
                  </p>
                  {item.cautions && (
                    <div className="flex items-start gap-1.5 mt-2 p-2 rounded-md bg-muted/60">
                      <AlertTriangle className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        {item.cautions}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
