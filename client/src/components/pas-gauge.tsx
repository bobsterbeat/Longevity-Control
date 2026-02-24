import { useEffect, useState } from "react";
import { getPASLabel } from "@/lib/scoring";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface PASGaugeProps {
  value: number;
  size?: number;
  showLabel?: boolean;
}

export function PASGauge({ value, size = 260, showLabel = true }: PASGaugeProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  const { text: velocityText, color: velocityColor } = getPASLabel(value);

  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2 + 10;

  const startAngle = 220;
  const endAngle = -40;
  const totalAngle = startAngle - endAngle;

  const polarToCartesian = (angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy - radius * Math.sin(rad),
    };
  };

  const describeArc = (start: number, end: number) => {
    const s = polarToCartesian(start);
    const e = polarToCartesian(end);
    const largeArc = start - end > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 0 ${e.x} ${e.y}`;
  };

  const valueAngle = startAngle - (animatedValue / 100) * totalAngle;
  const trackPath = describeArc(startAngle, endAngle);
  const valuePath = describeArc(startAngle, Math.max(valueAngle, endAngle));

  const getGaugeColor = (val: number) => {
    if (val <= 25) return "#10b981";
    if (val <= 40) return "#34d399";
    if (val <= 55) return "#fbbf24";
    if (val <= 70) return "#f97316";
    return "#ef4444";
  };

  return (
    <div className="flex flex-col items-center" data-testid="gauge-pas">
      <div className="relative" style={{ width: size, height: size * 0.72 }}>
        <svg width={size} height={size * 0.72} viewBox={`0 0 ${size} ${size * 0.72}`}>
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="35%" stopColor="#fbbf24" />
              <stop offset="65%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
            <filter id="gaugeShadow">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.15" />
            </filter>
          </defs>

          <path
            d={trackPath}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          <path
            d={valuePath}
            fill="none"
            stroke={getGaugeColor(animatedValue)}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{
              transition: "all 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
              filter: "url(#gaugeShadow)",
            }}
          />

          {[0, 25, 50, 75, 100].map((tick) => {
            const angle = startAngle - (tick / 100) * totalAngle;
            const outerPoint = polarToCartesian(angle);
            const innerRadius = radius - strokeWidth / 2 - 6;
            const innerRad = (angle * Math.PI) / 180;
            const innerPoint = {
              x: cx + innerRadius * Math.cos(innerRad),
              y: cy - innerRadius * Math.sin(innerRad),
            };
            const labelRadius = radius + strokeWidth / 2 + 12;
            const labelPoint = {
              x: cx + labelRadius * Math.cos(innerRad),
              y: cy - labelRadius * Math.sin(innerRad),
            };
            return (
              <g key={tick}>
                <line
                  x1={outerPoint.x}
                  y1={outerPoint.y}
                  x2={innerPoint.x}
                  y2={innerPoint.y}
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth="1"
                  opacity="0.3"
                />
                <text
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
              </g>
            );
          })}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <span
            className="text-5xl font-bold tabular-nums tracking-tight"
            style={{
              color: getGaugeColor(value),
              transition: "color 0.5s ease",
            }}
            data-testid="text-pas-value"
          >
            {value}
          </span>
        </div>
      </div>

      {showLabel && (
        <div className="flex flex-col items-center -mt-1">
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
