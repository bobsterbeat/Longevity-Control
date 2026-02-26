import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskCategory } from "@shared/schema";
import { Heart, Brain, Bone } from "lucide-react";

const iconMap: Record<string, typeof Heart> = {
  cardiometabolic: Heart,
  neurocognitive: Brain,
  musculoskeletal: Bone,
};

const ZONES = [
  { from: 0,  to: 33,  color: "#10b981" },
  { from: 33, to: 66,  color: "#f59e0b" },
  { from: 66, to: 100, color: "#ef4444" },
];

const levelConfig = {
  low:      { color: "#10b981", text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  moderate: { color: "#f59e0b", text: "text-amber-600 dark:text-amber-400",     bg: "bg-amber-50 dark:bg-amber-900/20"   },
  high:     { color: "#ef4444", text: "text-red-600 dark:text-red-400",         bg: "bg-red-50 dark:bg-red-900/20"       },
};

interface RiskDialProps {
  risk: RiskCategory;
  iconKey: string;
}

export function RiskDial({ risk, iconKey }: RiskDialProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimatedValue(risk.score), 100);
    return () => clearTimeout(t);
  }, [risk.score]);

  const Icon = iconMap[iconKey] || Heart;
  const config = levelConfig[risk.level];

  const size = 200;
  const trackWidth = 14;
  const radius = (size - 60) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const svgHeight = cy + 12;

  const polarToCartesian = (angle: number, r: number = radius) => {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
  };

  const describeArc = (start: number, end: number, r: number = radius) => {
    const s = polarToCartesian(start, r);
    const e = polarToCartesian(end, r);
    return `M ${s.x} ${s.y} A ${r} ${r} 0 0 1 ${e.x} ${e.y}`;
  };

  const valueToAngle = (v: number) => 180 - (v / 100) * 180;

  const needleAngle = valueToAngle(animatedValue);
  const needleRad = (needleAngle * Math.PI) / 180;
  const needleLength = radius - 18;
  const needleTip = {
    x: cx + needleLength * Math.cos(needleRad),
    y: cy - needleLength * Math.sin(needleRad),
  };
  const needleBaseWidth = 4;
  const perpRad = needleRad + Math.PI / 2;
  const needleBase1 = { x: cx + needleBaseWidth * Math.cos(perpRad), y: cy - needleBaseWidth * Math.sin(perpRad) };
  const needleBase2 = { x: cx - needleBaseWidth * Math.cos(perpRad), y: cy + needleBaseWidth * Math.sin(perpRad) };

  const getValueColor = (val: number) => {
    const zone = ZONES.find((z) => val >= z.from && val < z.to) || ZONES[ZONES.length - 1];
    return zone.color;
  };

  return (
    <Card data-testid={`card-risk-${iconKey}`}>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
        <div className={`p-2 rounded-md ${config.bg}`}>
          <Icon className={`w-4 h-4 ${config.text}`} />
        </div>
        <CardTitle className="text-sm">{risk.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <div className="relative" style={{ width: size, height: svgHeight + 50 }}>
            <svg width={size} height={svgHeight} viewBox={`0 0 ${size} ${svgHeight}`} overflow="visible">
              <defs>
                <filter id={`riskShadow-${iconKey}`}>
                  <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.2" />
                </filter>
              </defs>

              {/* Zone tracks (dim) */}
              {ZONES.map((zone) => (
                <path
                  key={zone.color}
                  d={describeArc(valueToAngle(zone.from), valueToAngle(zone.to))}
                  fill="none"
                  stroke={zone.color}
                  strokeWidth={trackWidth}
                  strokeLinecap="butt"
                  opacity={0.25}
                />
              ))}

              {/* Active fill */}
              {ZONES.map((zone) => {
                if (animatedValue < zone.from) return null;
                const clamped = Math.min(Math.max(animatedValue, zone.from), zone.to);
                return (
                  <path
                    key={`active-${zone.color}`}
                    d={describeArc(valueToAngle(zone.from), valueToAngle(clamped))}
                    fill="none"
                    stroke={zone.color}
                    strokeWidth={trackWidth}
                    strokeLinecap="butt"
                    style={{ transition: "all 1s cubic-bezier(0.4, 0, 0.2, 1)" }}
                  />
                );
              })}

              {/* Zone separators */}
              {ZONES.map((zone, i) => {
                if (i === 0) return null;
                const angle = valueToAngle(zone.from);
                const outer = polarToCartesian(angle, radius + trackWidth / 2 + 1);
                const inner = polarToCartesian(angle, radius - trackWidth / 2 - 1);
                return (
                  <line key={i} x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y}
                    stroke="hsl(var(--background))" strokeWidth="2" />
                );
              })}

              {/* End labels: Low / High */}
              {([{ v: 0, label: "Low" }, { v: 100, label: "High" }] as const).map(({ v, label }) => {
                const pt = polarToCartesian(valueToAngle(v), radius + trackWidth / 2 + 14);
                return (
                  <text key={v} x={pt.x} y={pt.y}
                    textAnchor={v === 0 ? "end" : "start"}
                    dominantBaseline="middle"
                    fill="hsl(var(--muted-foreground))" fontSize="10" fontWeight="500">
                    {label}
                  </text>
                );
              })}

              {/* Needle */}
              <polygon
                points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
                fill={getValueColor(animatedValue)}
                style={{ transition: "all 1.2s cubic-bezier(0.4, 0, 0.2, 1)", filter: `url(#riskShadow-${iconKey})` }}
              />
              <circle cx={cx} cy={cy} r={6} fill={getValueColor(animatedValue)}
                stroke="hsl(var(--background))" strokeWidth="2"
                style={{ transition: "fill 1s ease" }} />
            </svg>

            {/* Score + level label */}
            <div className="absolute flex flex-col items-center" style={{ left: 0, right: 0, top: svgHeight + 6 }}>
              <span className="text-3xl font-bold tabular-nums" style={{ color: config.color }}>
                {risk.score}
              </span>
              <span className={`text-sm font-semibold ${config.text}`}>
                {risk.level.charAt(0).toUpperCase() + risk.level.slice(1)} Risk
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-1 leading-relaxed" style={{ maxWidth: size }}>
            {risk.description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
