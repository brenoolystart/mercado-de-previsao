import { useEffect, useRef, useCallback, useState } from 'react';
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type Time,
  ColorType,
  CrosshairMode,
  LineStyle,
  AreaSeries,
  LineSeries,
  CandlestickSeries,
} from 'lightweight-charts';

/* ───── types ───── */
export interface ChartSeriesConfig {
  key: string;
  label: string;
  color: string;
}

export interface ChartDataPoint {
  t: number;
  date?: string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  [key: string]: any;
}

interface PredictionMarketChartProps {
  data: ChartDataPoint[];
  lines: ChartSeriesConfig[];
  height?: number;
  domain?: [number, number] | ['auto', 'auto'];
  yFormatter?: (v: number) => string;
  showDates?: boolean;
  className?: string;
  wsSymbol?: string;
  wsTargetKey?: string;
  targetPrice?: number;
  targetLabel?: string;
  chartType?: 'area' | 'candlestick';
  /** Reference price drawn as a dashed horizontal line (Palpitano style) */
  startPrice?: number;
}

const DEFAULT_COLORS = ['#3b82f6', '#facc15', '#fb923c', '#22c55e', '#ef4444'];

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function PredictionMarketChart({
  data,
  lines,
  height = 220,
  domain,
  yFormatter,
  showDates = true,
  className = '',
  wsSymbol,
  wsTargetKey,
  targetPrice,
  targetLabel = 'Target',
  chartType = 'area',
}: PredictionMarketChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesMapRef = useRef<Map<string, ISeriesApi<'Area' | 'Line' | 'Candlestick'>>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const targetLabelRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number>(0);

  const isPercentDomain = !domain || (domain[0] === 0 && domain[1] === 100);
  const isCryptoDomain = domain && domain[0] === 'auto' && domain[1] === 'auto';
  const isCandlestick = chartType === 'candlestick';
  const useAreaSeries = !isCandlestick && lines.length <= 2 && !isCryptoDomain;

  // Tooltip state
  const [tooltipData, setTooltipData] = useState<{
    visible: boolean;
    x: number;
    y: number;
    values: { label: string; value: number; color: string }[];
    time: string;
  }>({ visible: false, x: 0, y: 0, values: [], time: '' });

  // Animate the glowing dot at the last data point
  const updateDotPosition = useCallback(() => {
    if (!chartRef.current || !containerRef.current || !dotRef.current) return;
    const firstSeries = seriesMapRef.current.values().next().value;
    if (!firstSeries) return;

    try {
      const timeScale = chartRef.current.timeScale();
      const dataLen = data.length;
      if (dataLen === 0) return;

      const hasRealTimestamps = data[0]?.t > 1_000_000;
      const lastTime = (hasRealTimestamps ? data[dataLen - 1].t : dataLen) as Time;
      const coordinate = timeScale.timeToCoordinate(lastTime);
      if (coordinate === null) { dotRef.current.style.display = 'none'; return; }

      const lastKey = lines[0]?.key;
      const lastVal = data[dataLen - 1]?.[lastKey];
      if (lastVal == null) { dotRef.current.style.display = 'none'; return; }

      const priceCoord = (firstSeries as any).priceToCoordinate(lastVal);
      if (priceCoord === null) { dotRef.current.style.display = 'none'; return; }

      dotRef.current.style.display = 'block';
      dotRef.current.style.left = `${coordinate}px`;
      dotRef.current.style.top = `${priceCoord}px`;
    } catch {
      if (dotRef.current) dotRef.current.style.display = 'none';
    }
  }, [data, lines]);

  // Update target label position
  const updateTargetLabel = useCallback(() => {
    if (!chartRef.current || !containerRef.current || !targetLabelRef.current || targetPrice == null) return;
    const firstSeries = seriesMapRef.current.values().next().value;
    if (!firstSeries) return;
    try {
      const priceCoord = (firstSeries as any).priceToCoordinate(targetPrice);
      if (priceCoord === null) { targetLabelRef.current.style.display = 'none'; return; }
      targetLabelRef.current.style.display = 'flex';
      targetLabelRef.current.style.top = `${priceCoord}px`;
    } catch {
      if (targetLabelRef.current) targetLabelRef.current.style.display = 'none';
    }
  }, [targetPrice]);

  useEffect(() => {
    if (!containerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesMapRef.current.clear();
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'rgba(156,163,175,0.6)',
        fontSize: 10,
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: 'rgba(255,255,255,0.04)', style: LineStyle.Solid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(255,255,255,0.2)',
          width: 1,
          style: LineStyle.Dashed,
          labelVisible: false,
        },
        horzLine: {
          color: 'rgba(255,255,255,0.15)',
          width: 1,
          style: LineStyle.Dashed,
          labelVisible: false,
        },
      },
      rightPriceScale: {
        visible: true,
        borderVisible: false,
        scaleMargins: { top: 0.08, bottom: 0.08 },
      },
      timeScale: {
        visible: showDates,
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: false,
      handleScale: false,
    });

    chartRef.current = chart;

    lines.forEach((lineConfig, idx) => {
      const color = lineConfig.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];

      const priceFormatOpts = yFormatter
        ? { type: 'custom' as const, formatter: (v: number) => yFormatter(v) }
        : isPercentDomain
          ? { type: 'custom' as const, formatter: (v: number) => `${Math.round(v)}%` }
          : { type: 'price' as const, precision: 2, minMove: 0.01 };

      let series: ISeriesApi<'Area' | 'Line' | 'Candlestick'>;

      if (isCandlestick && idx === 0) {
        // Candlestick series for crypto OHLC data
        series = chart.addSeries(CandlestickSeries, {
          upColor: '#22c55e',
          downColor: '#ef4444',
          borderUpColor: '#22c55e',
          borderDownColor: '#ef4444',
          wickUpColor: '#22c55e',
          wickDownColor: '#ef4444',
          lastValueVisible: false,
          priceLineVisible: false,
          priceFormat: priceFormatOpts,
        });
      } else if (useAreaSeries) {
        // Area series with gradient fill — mimics Polymarket style
        series = chart.addSeries(AreaSeries, {
          lineColor: color,
          lineWidth: 2,
          lineType: 2,
          topColor: hexToRgba(color, 0.28),
          bottomColor: hexToRgba(color, 0.0),
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 5,
          crosshairMarkerBorderWidth: 2,
          crosshairMarkerBorderColor: color,
          crosshairMarkerBackgroundColor: 'rgba(0,0,0,0.8)',
          lastValueVisible: false,
          priceLineVisible: false,
          title: '',
          priceFormat: priceFormatOpts,
        });
      } else {
        // Multi-line markets — use line series (no fill to avoid visual clutter)
        series = chart.addSeries(LineSeries, {
          color,
          lineWidth: 2,
          lineType: 2,
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 5,
          crosshairMarkerBorderWidth: 2,
          crosshairMarkerBorderColor: color,
          crosshairMarkerBackgroundColor: 'rgba(0,0,0,0.8)',
          lastValueVisible: false,
          priceLineVisible: false,
          title: '',
          priceFormat: priceFormatOpts,
        });
      }

      // Add target price dashed line
      if (idx === 0 && targetPrice != null) {
        series.createPriceLine({
          price: targetPrice,
          color: 'rgba(255,255,255,0.25)',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: '',
        });
      }

      // Subtle percentage grid lines for prediction markets
      if (idx === 0 && isPercentDomain) {
        [0, 25, 50, 75, 100].forEach(level => {
          series.createPriceLine({
            price: level,
            color: 'rgba(255,255,255,0.04)',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: false,
            title: '',
          });
        });
      }

      seriesMapRef.current.set(lineConfig.key, series);
    });

    // Crosshair tooltip
    chart.subscribeCrosshairMove((param) => {
      updateDotPosition();
      updateTargetLabel();

      if (!param.time || !param.point || !containerRef.current) {
        setTooltipData(prev => ({ ...prev, visible: false }));
        return;
      }

      const values: { label: string; value: number; color: string }[] = [];
      lines.forEach((lineConfig, idx) => {
        const series = seriesMapRef.current.get(lineConfig.key);
        if (!series) return;
        const d = param.seriesData.get(series);
        if (d && 'value' in d) {
          values.push({
            label: lineConfig.label,
            value: d.value as number,
            color: lineConfig.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
          });
        }
      });

      // Format time
      let timeStr = '';
      const t = param.time as number;
      if (t > 1_000_000) {
        const date = new Date(t * 1000);
        timeStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' });
      }

      const containerRect = containerRef.current.getBoundingClientRect();
      const x = param.point.x;
      const y = param.point.y;
      // Flip tooltip to left if too close to right edge
      const flipX = x > containerRect.width * 0.7;

      setTooltipData({
        visible: values.length > 0,
        x: flipX ? x - 140 : x + 16,
        y: Math.max(10, Math.min(y - 10, height - 60)),
        values,
        time: timeStr,
      });
    });

    const ro = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
        updateDotPosition();
        updateTargetLabel();
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesMapRef.current.clear();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [lines.map(l => l.key + l.color).join(','), isPercentDomain, showDates, height, targetPrice, useAreaSeries, isCandlestick]);

  useEffect(() => {
    if (!chartRef.current || seriesMapRef.current.size === 0) return;

    const hasRealTimestamps = data.length > 0 && data[0]?.t > 1_000_000;

    lines.forEach(lineConfig => {
      const series = seriesMapRef.current.get(lineConfig.key);
      if (!series) return;

      if (isCandlestick) {
        // OHLC candlestick data
        const raw = data
          .filter(d => d.open != null && d.high != null && d.low != null && d.close != null)
          .map((d, i) => ({
            time: (hasRealTimestamps ? d.t : (i + 1)) as Time,
            open: d.open!,
            high: d.high!,
            low: d.low!,
            close: d.close!,
          }));
        const ohlcData: typeof raw = [];
        for (const pt of raw) {
          if (ohlcData.length === 0 || (pt.time as number) > (ohlcData[ohlcData.length - 1].time as number)) {
            ohlcData.push(pt);
          }
        }
        if (ohlcData.length > 0) {
          series.setData(ohlcData);
        }
      } else {
        const raw = data
          .filter(d => d[lineConfig.key] != null)
          .map((d, i) => ({
            time: (hasRealTimestamps ? d.t : (i + 1)) as Time,
            value: d[lineConfig.key] as number,
          }));
        const seriesData: typeof raw = [];
        for (const pt of raw) {
          if (seriesData.length === 0 || (pt.time as number) > (seriesData[seriesData.length - 1].time as number)) {
            seriesData.push(pt);
          }
        }
        if (seriesData.length > 0) {
          series.setData(seriesData);
        }
      }
    });

    if (isPercentDomain) {
      const first = seriesMapRef.current.values().next().value;
      if (first) {
        (first as any).applyOptions({
          autoscaleInfoProvider: () => ({
            priceRange: { minValue: 0, maxValue: 100 },
          }),
        });
      }
    }

    chartRef.current.timeScale().fitContent();

    requestAnimationFrame(() => {
      updateDotPosition();
      updateTargetLabel();
    });
  }, [data, lines, isPercentDomain, isCandlestick, updateDotPosition, updateTargetLabel]);

  useEffect(() => {
    if (!wsSymbol || !wsTargetKey) return;

    const url = `wss://stream.binance.com:9443/ws/${wsSymbol.toLowerCase()}@trade`;
    let lastUpdate = 0;
    let tickCount = data.length;

    const connect = () => {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        const now = Date.now();
        if (now - lastUpdate < 800) return;
        lastUpdate = now;

        try {
          const msg = JSON.parse(event.data);
          const price = parseFloat(msg.p);
          if (!price) return;

          const series = seriesMapRef.current.get(wsTargetKey);
          if (!series) return;

          tickCount++;
          series.update({ time: tickCount as Time, value: price });

          requestAnimationFrame(() => {
            updateDotPosition();
            updateTargetLabel();
          });
        } catch {}
      };

      ws.onerror = () => ws.close();
      ws.onclose = () => {
        setTimeout(() => { if (wsRef.current === ws) connect(); }, 3000);
      };
    };

    connect();

    return () => {
      const ws = wsRef.current;
      wsRef.current = null;
      ws?.close();
    };
  }, [wsSymbol, wsTargetKey, data.length, updateDotPosition, updateTargetLabel]);

  // Continuously animate the dot pulse
  useEffect(() => {
    const tick = () => {
      updateDotPosition();
      updateTargetLabel();
      animFrameRef.current = requestAnimationFrame(tick);
    };
    const timeout = setTimeout(() => {
      animFrameRef.current = requestAnimationFrame(tick);
    }, 500);
    return () => {
      clearTimeout(timeout);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [updateDotPosition, updateTargetLabel]);

  const primaryColor = lines[0]?.color || DEFAULT_COLORS[0];

  /* ── Legend ── */
  const legend = lines.length > 1 ? (
    <div className="flex items-center gap-4 mb-1 px-1">
      {lines.map((l, i) => (
        <div key={l.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: l.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length] }}
          />
          <span>{l.label}</span>
        </div>
      ))}
    </div>
  ) : null;

  return (
    <div className={`w-full relative ${className}`}>
      {legend}
      <div className="relative" style={{ height }}>
        <div ref={containerRef} className="w-full h-full" />

        {/* Interactive tooltip */}
        {tooltipData.visible && (
          <div
            ref={tooltipRef}
            className="absolute pointer-events-none z-20"
            style={{
              left: tooltipData.x,
              top: tooltipData.y,
            }}
          >
            <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg min-w-[100px]">
              {tooltipData.time && (
                <div className="text-[10px] text-muted-foreground mb-1">{tooltipData.time}</div>
              )}
              {tooltipData.values.map((v, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: v.color }} />
                  <span className="text-muted-foreground">{v.label}</span>
                  <span className="font-semibold text-foreground ml-auto">
                    {isPercentDomain ? `${Math.round(v.value)}%` : yFormatter ? yFormatter(v.value) : v.value.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Animated glowing dot at last data point */}
        <div
          ref={dotRef}
          className="absolute pointer-events-none"
          style={{
            display: 'none',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
          }}
        >
          <span
            className="block rounded-full animate-pulse"
            style={{
              width: 10,
              height: 10,
              backgroundColor: primaryColor,
              boxShadow: `0 0 8px 3px ${primaryColor}80, 0 0 16px 6px ${primaryColor}40`,
            }}
          />
        </div>

        {/* Target price label */}
        {targetPrice != null && (
          <div
            ref={targetLabelRef}
            className="absolute right-12 pointer-events-none"
            style={{
              display: 'none',
              transform: 'translateY(-50%)',
              zIndex: 9,
            }}
          >
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded"
              style={{
                backgroundColor: 'rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              {targetLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
