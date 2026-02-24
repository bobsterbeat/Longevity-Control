import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskCategory } from "@shared/schema";
import { Heart, Brain, Bone } from "lucide-react";

const iconMap: Record<string, typeof Heart> = {
  cardiometabolic: Heart,
  neurocognitive: Brain,
  musculoskeletal: Bone,
};

const levelConfig = {
  low: { color: "#10b981", bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400" },
  moderate: { color: "#f59e0b", bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600 dark:text-amber-400" },
  high: { color: "#ef4444", bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-600 dark:text-red-400" },
};

interface RiskDialProps {
  risk: RiskCategory;
  iconKey: string;
}

export function RiskDial({ risk, iconKey }: RiskDialProps) {
  const Icon = iconMap[iconKey] || Heart;
  const config = levelConfig[risk.level];

  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius;
  const progress = (risk.score / 100) * circumference;

  const startAngle = 180;
  const polarToCartesian = (angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: size / 2 + radius * Math.cos(rad),
      y: size / 2 + 4 - radius * Math.sin(rad),
    };
  };

  const start = polarToCartesian(startAngle);
  const valueAngle = startAngle - (risk.score / 100) * 180;
  const end = polarToCartesian(Math.max(valueAngle, 0));
  const largeArc = risk.score > 50 ? 1 : 0;

  const trackStart = polarToCartesian(180);
  const trackEnd = polarToCartesian(0);

  return (
    <Card data-testid={`card-risk-${iconKey}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-md ${config.bg}`}>
            <Icon className={`w-4 h-4 ${config.text}`} />
          </div>
          <CardTitle className="text-sm">{risk.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <div className="relative" style={{ width: size, height: size * 0.55 }}>
            <svg width={size} height={size * 0.55} viewBox={`0 0 ${size} ${size * 0.58}`}>
              <path
                d={`M ${trackStart.x} ${trackStart.y} A ${radius} ${radius} 0 0 0 ${trackEnd.x} ${trackEnd.y}`}
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
              <path
                d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`}
                fill="none"
                stroke={config.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                style={{ transition: "all 0.8s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-end justify-center pb-0">
              <span className="text-xl font-bold" style={{ color: config.color }}>
                {risk.level.charAt(0).toUpperCase() + risk.level.slice(1)}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2 leading-relaxed">
            {risk.description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
