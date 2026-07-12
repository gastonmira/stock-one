"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { History, HistoryRange } from "@/lib/sources";
import { formatMoney, formatPct } from "@/lib/format";

const RANGES: HistoryRange[] = ["1M", "6M", "1A", "5A"];
const RANGE_LABEL: Record<HistoryRange, string> = {
  "1M": "1 mes",
  "6M": "6 meses",
  "1A": "1 año",
  "5A": "5 años",
};

// Geometría del viewBox
const VB_W = 820;
const VB_H = 320;
const PAD = { left: 60, right: 18, top: 16, bottom: 30 };
const PLOT_W = VB_W - PAD.left - PAD.right;
const PLOT_H = VB_H - PAD.top - PAD.bottom;

function fmtDate(sec: number, range: HistoryRange): string {
  const d = new Date(sec * 1000);
  if (range === "1A" || range === "5A") {
    return d.toLocaleDateString("es-AR", { month: "short", year: "2-digit" });
  }
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

export function PriceChart({
  symbol,
  currency,
  isIndex,
  initial,
  initialRange = "6M",
}: {
  symbol: string;
  currency: "ARS" | "USD";
  isIndex: boolean;
  initial: History;
  initialRange?: HistoryRange;
}) {
  const [range, setRange] = useState<HistoryRange>(initialRange);
  const [data, setData] = useState<History>(initial);
  const [loading, setLoading] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const cache = useRef<Map<HistoryRange, History>>(
    new Map([[initialRange, initial]])
  );
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const cached = cache.current.get(range);
    if (cached) {
      setData(cached);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(
      `/api/history?symbol=${encodeURIComponent(symbol)}&range=${range}${
        isIndex ? "&index=1" : ""
      }`,
      { cache: "force-cache" }
    )
      .then((r) => (r.ok ? r.json() : { t: [], c: [] }))
      .then((d: History) => {
        if (cancelled) return;
        cache.current.set(range, d);
        setData(d);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [range, symbol, isIndex]);

  const geom = useMemo(() => {
    const { c, t } = data;
    if (c.length < 2) return null;
    const min = Math.min(...c);
    const max = Math.max(...c);
    const span = max - min || 1;
    const stepX = PLOT_W / (c.length - 1);
    const points = c.map((v, i) => {
      const x = PAD.left + i * stepX;
      const y = PAD.top + PLOT_H - ((v - min) / span) * PLOT_H;
      return [x, y] as const;
    });
    const line = points
      .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`)
      .join(" ");
    const area = `${line} L${points[points.length - 1][0].toFixed(1)} ${
      PAD.top + PLOT_H
    } L${PAD.left} ${PAD.top + PLOT_H} Z`;
    const up = c[c.length - 1] >= c[0];
    const changePct = c[0] !== 0 ? ((c[c.length - 1] - c[0]) / c[0]) * 100 : 0;
    // ticks X (5) y Y (4)
    const xTicks = Array.from({ length: 5 }, (_, i) => {
      const idx = Math.round((i / 4) * (c.length - 1));
      return { x: points[idx][0], label: fmtDate(t[idx], range) };
    });
    const yTicks = Array.from({ length: 4 }, (_, i) => {
      const val = min + (span * i) / 3;
      const y = PAD.top + PLOT_H - (i / 3) * PLOT_H;
      return { y, val };
    });
    return { points, line, area, up, min, max, changePct, xTicks, yTicks };
  }, [data, range]);

  const color = geom?.up ? "var(--up)" : "var(--down)";

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!geom || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const vbX = ((e.clientX - rect.left) / rect.width) * VB_W;
    const rel = (vbX - PAD.left) / PLOT_W;
    const idx = Math.round(rel * (data.c.length - 1));
    setHover(Math.max(0, Math.min(data.c.length - 1, idx)));
  }

  const hoverPoint = geom && hover != null ? geom.points[hover] : null;

  return (
    <div className="rounded-2xl border border-border bg-surface/50 p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          {geom ? (
            <div className="flex items-baseline gap-2">
              <span className="tnum text-lg font-bold">
                {formatMoney(
                  hover != null ? data.c[hover] : data.c[data.c.length - 1],
                  currency
                )}
              </span>
              <span
                className="tnum text-sm font-semibold"
                style={{ color }}
              >
                {formatPct(geom.changePct)} · {RANGE_LABEL[range]}
              </span>
            </div>
          ) : (
            <span className="text-sm text-text-mute">
              Sin histórico disponible
            </span>
          )}
          {hover != null && geom && (
            <div className="text-xs text-text-mute tnum">
              {new Date(data.t[hover] * 1000).toLocaleDateString("es-AR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          )}
        </div>
        <div className="flex gap-1 rounded-lg bg-bg-elev/70 p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => {
                setRange(r);
                setHover(null);
              }}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                r === range
                  ? "bg-brand text-bg"
                  : "text-text-dim hover:text-text"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-surface/40 text-xs text-text-mute">
            Cargando…
          </div>
        )}
        {geom ? (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            className="w-full touch-none"
            style={{ aspectRatio: `${VB_W} / ${VB_H}` }}
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          >
            <defs>
              <linearGradient id="chartfill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.28" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Grid + labels Y */}
            {geom.yTicks.map((tk, i) => (
              <g key={i}>
                <line
                  x1={PAD.left}
                  y1={tk.y}
                  x2={VB_W - PAD.right}
                  y2={tk.y}
                  stroke="var(--border-soft)"
                  strokeWidth="1"
                  strokeDasharray="3 4"
                />
                <text
                  x={PAD.left - 8}
                  y={tk.y + 4}
                  textAnchor="end"
                  className="tnum"
                  fontSize="12"
                  fill="var(--text-mute)"
                >
                  {tk.val.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                </text>
              </g>
            ))}

            {/* Labels X */}
            {geom.xTicks.map((tk, i) => (
              <text
                key={i}
                x={tk.x}
                y={VB_H - 8}
                textAnchor="middle"
                fontSize="12"
                fill="var(--text-mute)"
              >
                {tk.label}
              </text>
            ))}

            <path d={geom.area} fill="url(#chartfill)" />
            <path
              d={geom.line}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Hover */}
            {hoverPoint && (
              <g>
                <line
                  x1={hoverPoint[0]}
                  y1={PAD.top}
                  x2={hoverPoint[0]}
                  y2={PAD.top + PLOT_H}
                  stroke="var(--text-mute)"
                  strokeWidth="1"
                />
                <circle
                  cx={hoverPoint[0]}
                  cy={hoverPoint[1]}
                  r="4"
                  fill={color}
                  stroke="var(--bg)"
                  strokeWidth="2"
                />
              </g>
            )}
          </svg>
        ) : (
          <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border text-sm text-text-mute">
            Histórico no disponible para este instrumento.
          </div>
        )}
      </div>
    </div>
  );
}
