import { useEffect, useState } from "react";
import { getPASLabel } from "@/lib/scoring";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface PASGaugeProps {
  value: number;
  size?: number;
  showLabel?: boolean;
}

const ZONES = [
  { from: 0, to: 25, label: "Slow", color: "#10b981" },
  { from: 25, to: 40, label: "Moderate", color: "#34d399" },
  { from: 40, to: 55, label: "Elevated", color: "#fbbf24" },
  { from: 55, to: 70, label: "Fast", color: "#f97316" },
  { from: 70, to: 100, label: "Rapid", color: "#ef4444" },
];

export function PASGauge({ value, size = 240, showLabel = true }: PASGaugeProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  const { text: velocityText, color: velocityColor } = getPASLabel(value);

  // Semicircle: 180° sweep from left (180°) → right (0°) through the top
  const trackWidth = 14;
  const radius = (size - 60) / 2;   // extra margin for tick labels
  const cx = size / 2;
  const cy = size / 2;               // center at flat bottom edge
  const startAngle = 180;
  const endAngle = 0;
  const totalAngle = 180;
  const svgHeight = cy + 12;         // top half + needle-base margin

  const polarToCartesian = (angle: number, r: number = radius) => {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
  };

  const describeArc = (start: number, end: number, r: number = radius) => {
    const s = polarToCartesian(start, r);
    const e = polarToCartesian(end, r);
    // sweep=1 = clockwise in SVG (y-down) → draws through the top
    return `M ${s.x} ${s.y} A ${r} ${r} 0 0 1 ${e.x} ${e.y}`;
  };

  const valueToAngle = (v: number) => startAngle - (v / 100) * totalAngle;

  const needleAngle = valueToAngle(animatedValue);
  const needleRad = (needleAngle * Math.PI) / 180;
  const needleLength = radius - 22;
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
    <div className="flex flex-col items-center" data-testid="gauge-pas">
      <div className="relative" style={{ width: size, height: svgHeight + 50 }}>
        <svg width={size} height={svgHeight} viewBox={`0 0 ${size} ${svgHeight}`} overflow="visible">
          <defs>
            <filter id="needleShadow">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.2" />
            </filter>
          </defs>

          {/* Zone tracks (dim background) */}
          {ZONES.map((zone) => (
            <path
              key={zone.label}
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
                key={`active-${zone.label}`}
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
              <line key={`sep-${i}`} x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y}
                stroke="hsl(var(--background))" strokeWidth="2" />
            );
          })}

          {/* Tick labels */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const angle = valueToAngle(tick);
            const labelRadius = radius + trackWidth / 2 + 14;
            const pt = polarToCartesian(angle, labelRadius);
            const anchor = tick === 0 ? "end" : tick === 100 ? "start" : "middle";
            return (
              <text key={tick} x={pt.x} y={pt.y} textAnchor={anchor} dominantBaseline="middle"
                fill="hsl(var(--muted-foreground))" fontSize="10" fontWeight="500">
                {tick}
              </text>
            );
          })}

          {/* Needle */}
          <polygon
            points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
            fill={getValueColor(animatedValue)}
            style={{ transition: "all 1.2s cubic-bezier(0.4, 0, 0.2, 1)", filter: "url(#needleShadow)" }}
          />
          <circle cx={cx} cy={cy} r={6} fill={getValueColor(animatedValue)}
            stroke="hsl(var(--background))" strokeWidth="2"
            style={{ transition: "fill 1s ease" }} />
        </svg>

        {/* Value + label below arc center */}
        <div className="absolute flex flex-col items-center" style={{ left: 0, right: 0, top: svgHeight + 6 }}>
          <span
            className="text-4xl font-bold tabular-nums tracking-tight"
            style={{ color: getValueColor(value), transition: "color 0.5s ease" }}
            data-testid="text-pas-value"
          >
            {value}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">PAS</span>
          <span className="text-xs text-muted-foreground mt-1 tabular-nums">
            {(value / 50).toFixed(1)}× avg aging rate
          </span>
        </div>
      </div>

      {showLabel && (
        <div className="flex flex-col items-center mt-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Aging Velocity:</span>
            <span className={`text-sm font-semibold ${velocityColor}`} data-testid="text-velocity-label">
              {velocityText}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground" data-testid="button-pas-info">
                  <Info className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-medium mb-1">Physiologic Aging Score (PAS)</p>
                <p className="text-xs text-muted-foreground mb-2">
                  A 7-day rolling composite score (0–100) estimating your pace of biological aging relative to average.
                  <strong className="text-foreground"> 50 = average aging rate (1.0×)</strong> for a healthy adult.
                  A score of 35 means you're aging at roughly 0.7× the average rate — 30% slower than typical.
                  A score of 70 would mean 1.4× — 40% faster.
                </p>
                <p className="text-xs text-muted-foreground">
                  Combines: recovery (HRV, sleep), metabolic (glucose), fitness (VO2max, exercise),
                  inflammatory (alcohol, sleep debt), and environmental (air quality) signals.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-3 mt-2">
            {ZONES.map((zone) => (
              <div key={zone.label} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: zone.color }} />
                <span className="text-[10px] text-muted-foreground">{zone.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface MiniGaugeProps {
  value: number;
  label: string;
  size?: number;
}

export function MiniGauge({ value, label, size = 100 }: MiniGaugeProps) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / 100) * circumference;

  const getColor = (val: number) => {
    if (val <= 30) return "#10b981";
    if (val <= 55) return "#fbbf24";
    return "#ef4444";
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getColor(value)}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold" style={{ color: getColor(value) }}>
            {value}
          </span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </div>
  );
}
