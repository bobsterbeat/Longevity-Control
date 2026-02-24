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

export function PASGauge({ value, size = 260, showLabel = true }: PASGaugeProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  const { text: velocityText, color: velocityColor } = getPASLabel(value);

  const trackWidth = 14;
  const radius = (size - 40) / 2;
  const cx = size / 2;
  const cy = size / 2 + 16;

  const startAngle = 220;
  const endAngle = -40;
  const totalAngle = startAngle - endAngle;

  const polarToCartesian = (angle: number, r: number = radius) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy - r * Math.sin(rad),
    };
  };

  const describeArc = (start: number, end: number, r: number = radius) => {
    const s = polarToCartesian(start, r);
    const e = polarToCartesian(end, r);
    const largeArc = start - end > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 0 ${e.x} ${e.y}`;
  };

  const needleAngle = startAngle - (animatedValue / 100) * totalAngle;
  const needleRad = (needleAngle * Math.PI) / 180;
  const needleLength = radius - 24;
  const needleTip = {
    x: cx + needleLength * Math.cos(needleRad),
    y: cy - needleLength * Math.sin(needleRad),
  };
  const needleBaseWidth = 4;
  const perpRad = needleRad + Math.PI / 2;
  const needleBase1 = {
    x: cx + needleBaseWidth * Math.cos(perpRad),
    y: cy - needleBaseWidth * Math.sin(perpRad),
  };
  const needleBase2 = {
    x: cx - needleBaseWidth * Math.cos(perpRad),
    y: cy + needleBaseWidth * Math.sin(perpRad),
  };

  const getValueColor = (val: number) => {
    const zone = ZONES.find(z => val >= z.from && val < z.to) || ZONES[ZONES.length - 1];
    return zone.color;
  };

  return (
    <div className="flex flex-col items-center" data-testid="gauge-pas">
      <div className="relative" style={{ width: size, height: size * 0.78 }}>
        <svg width={size} height={size * 0.78} viewBox={`0 0 ${size} ${size * 0.78}`}>
          <defs>
            <filter id="needleShadow">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.2" />
            </filter>
            <filter id="glowFilter">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {ZONES.map((zone) => {
            const zoneStart = startAngle - (zone.from / 100) * totalAngle;
            const zoneEnd = startAngle - (zone.to / 100) * totalAngle;
            return (
              <path
                key={zone.label}
                d={describeArc(zoneStart, zoneEnd)}
                fill="none"
                stroke={zone.color}
                strokeWidth={trackWidth}
                strokeLinecap="butt"
                opacity={0.25}
              />
            );
          })}

          {ZONES.map((zone) => {
            const zoneStart = startAngle - (zone.from / 100) * totalAngle;
            const clampedValue = Math.min(Math.max(animatedValue, zone.from), zone.to);
            const zoneEnd = startAngle - (clampedValue / 100) * totalAngle;
            if (animatedValue < zone.from) return null;
            return (
              <path
                key={`active-${zone.label}`}
                d={describeArc(zoneStart, zoneEnd)}
                fill="none"
                stroke={zone.color}
                strokeWidth={trackWidth}
                strokeLinecap="butt"
                style={{ transition: "all 1s cubic-bezier(0.4, 0, 0.2, 1)" }}
              />
            );
          })}

          {ZONES.map((zone, i) => {
            if (i === 0) return null;
            const angle = startAngle - (zone.from / 100) * totalAngle;
            const outer = polarToCartesian(angle, radius + trackWidth / 2 + 1);
            const inner = polarToCartesian(angle, radius - trackWidth / 2 - 1);
            return (
              <line
                key={`sep-${i}`}
                x1={outer.x}
                y1={outer.y}
                x2={inner.x}
                y2={inner.y}
                stroke="hsl(var(--background))"
                strokeWidth="2"
              />
            );
          })}

          {[0, 25, 50, 75, 100].map((tick) => {
            const angle = startAngle - (tick / 100) * totalAngle;
            const labelRadius = radius + trackWidth / 2 + 14;
            const rad = (angle * Math.PI) / 180;
            const labelPoint = {
              x: cx + labelRadius * Math.cos(rad),
              y: cy - labelRadius * Math.sin(rad),
            };
            return (
              <text
                key={tick}
                x={labelPoint.x}
                y={labelPoint.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="hsl(var(--muted-foreground))"
                fontSize="10"
                fontWeight="500"
              >
                {tick}
              </text>
            );
          })}

          {ZONES.map((zone) => {
            const midVal = (zone.from + zone.to) / 2;
            const angle = startAngle - (midVal / 100) * totalAngle;
            const labelR = radius - trackWidth / 2 - 14;
            const rad = (angle * Math.PI) / 180;
            const pt = {
              x: cx + labelR * Math.cos(rad),
              y: cy - labelR * Math.sin(rad),
            };
            const rotDeg = -angle + 90;
            return (
              <text
                key={`lbl-${zone.label}`}
                x={pt.x}
                y={pt.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="hsl(var(--muted-foreground))"
                fontSize="7"
                fontWeight="600"
                letterSpacing="0.5"
                opacity="0.6"
                transform={`rotate(${rotDeg}, ${pt.x}, ${pt.y})`}
              >
                {zone.label.toUpperCase()}
              </text>
            );
          })}

          <polygon
            points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
            fill={getValueColor(animatedValue)}
            style={{
              transition: "all 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
              filter: "url(#needleShadow)",
            }}
          />
          <circle
            cx={cx}
            cy={cy}
            r={6}
            fill={getValueColor(animatedValue)}
            stroke="hsl(var(--background))"
            strokeWidth="2"
            style={{ transition: "fill 1s ease" }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-end pb-0">
          <span
            className="text-4xl font-bold tabular-nums tracking-tight"
            style={{
              color: getValueColor(value),
              transition: "color 0.5s ease",
            }}
            data-testid="text-pas-value"
          >
            {value}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">PAS</span>
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
                <p className="text-xs text-muted-foreground">
                  PAS is a 7-day rolling composite score (0-100) that estimates your pace of biological aging.
                  Lower is better. It combines recovery signals (HRV, sleep), metabolic markers (glucose),
                  fitness protection (VO2max, exercise), inflammatory behaviors (alcohol, sleep debt),
                  and environmental load (air quality). Think of it as a daily speedometer for how fast
                  you're aging - not a diagnosis, but a directional guide.
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
