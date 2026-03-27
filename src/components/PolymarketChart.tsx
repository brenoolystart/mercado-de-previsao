import { useMemo, useState, useCallback, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip,
} from 'recharts';

/* ───── types ───── */
export interface ChartLine {
  key: string;
  label: string;
  color: string;
}

export interface ChartDataPoint {
  t: number; // index or timestamp
  date: string; // formatted label
  [key: string]: any; // dynamic keys for lines
}

interface PolymarketChartProps {
  data: ChartDataPoint[];
  lines: ChartLine[];
  height?: number;
  domain?: [number, number] | ['auto', 'auto'];
  yFormatter?: (v: number) => string;
  showDates?: boolean;
  className?: string;
}

/* ───── custom crosshair tooltip ───── */
function CustomTooltip({ active, payload, label, lines }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="text-muted-foreground mb-1 font-medium">{payload[0]?.payload?.date}</p>
      {payload.map((entry: any, i: number) => {
        const line = lines?.find((l: ChartLine) => l.key === entry.dataKey);
        return (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-foreground font-semibold">
              {line?.label || entry.dataKey}: {typeof entry.value === 'number' ? `${Math.round(entry.value)}%` : entry.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ───── custom cursor (vertical dashed line) ───── */
function CustomCursor({ points, height }: any) {
  if (!points?.[0]) return null;
  return (
    <line
      x1={points[0].x} y1={0} x2={points[0].x} y2={height}
      stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="4 3" opacity={0.5}
    />
  );
}

/* ───── main component ───── */
export function PolymarketChart({
  data, lines, height = 220, domain = [0, 100],
  yFormatter = (v) => `${v}%`, showDates = true, className = '',
}: PolymarketChartProps) {
  const refLines = domain[0] === 0 && domain[1] === 100
    ? [0, 25, 50, 75, 100]
    : domain[0] === 'auto' ? [] : [];

  // Calculate evenly spaced X-axis ticks (show ~4-5 labels)
  const xTicks = useMemo(() => {
    if (!showDates || data.length < 5) return undefined;
    const step = Math.max(1, Math.floor(data.length / 4));
    return data.filter((_, i) => i % step === 0 || i === data.length - 1).map(d => d.t);
  }, [data, showDates]);

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 40, left: 0, bottom: showDates ? 20 : 0 }}>
          {/* Horizontal dashed reference lines */}
          {refLines.map((val) => (
            <ReferenceLine
              key={val}
              y={val}
              stroke="hsl(var(--border))"
              strokeDasharray="3 3"
              strokeWidth={1}
            />
          ))}

          {/* X-axis with date labels */}
          {showDates ? (
            <XAxis
              dataKey="t"
              ticks={xTicks}
              tickFormatter={(t) => {
                const point = data.find(d => d.t === t);
                return point?.date || '';
              }}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              dy={8}
            />
          ) : (
            <XAxis dataKey="t" hide />
          )}

          {/* Y-axis on right side */}
          <YAxis
            orientation="right"
            domain={domain}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={yFormatter}
            width={35}
            ticks={refLines.length > 0 ? refLines : undefined}
          />

          {/* Tooltip with crosshair cursor */}
          <Tooltip
            content={<CustomTooltip lines={lines} />}
            cursor={<CustomCursor />}
            isAnimationActive={false}
          />

          {/* Data lines */}
          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              stroke={line.color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
