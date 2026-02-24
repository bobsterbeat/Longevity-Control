import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const colorMap = {
  green: {
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    label: "Strong Evidence",
    description: "Supported by multiple high-quality studies and clinical guidelines.",
  },
  yellow: {
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    label: "Moderate Evidence",
    description: "Supported by some studies. May benefit most people but individual response varies.",
  },
  orange: {
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
    label: "Emerging / Experimental",
    description: "Based on early research, animal studies, or limited human trials. Approach with caution.",
  },
  red: {
    className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    label: "Caution",
    description: "Not recommended or has significant risks. Consult healthcare provider.",
  },
};

interface EvidenceBadgeProps {
  color: "green" | "yellow" | "orange" | "red";
  showLabel?: boolean;
}

export function EvidenceBadge({ color, showLabel = false }: EvidenceBadgeProps) {
  const config = colorMap[color];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={`${config.className} border-0 text-xs no-default-active-elevate cursor-default`}
          data-testid={`badge-evidence-${color}`}
        >
          {showLabel ? config.label : color === "green" ? "Strong" : color === "yellow" ? "Moderate" : color === "orange" ? "Emerging" : "Caution"}
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="font-medium">{config.label}</p>
        <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function EvidenceLegend() {
  return (
    <div className="space-y-3">
      {(Object.entries(colorMap) as [keyof typeof colorMap, (typeof colorMap)[keyof typeof colorMap]][]).map(
        ([color, config]) => (
          <div key={color} className="flex items-start gap-3">
            <EvidenceBadge color={color} showLabel />
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>
        )
      )}
    </div>
  );
}
