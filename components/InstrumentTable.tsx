"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Instrument } from "@/lib/types";
import { formatMoney, formatInt } from "@/lib/format";
import { ChangeBadge } from "./ChangeBadge";
import { SparkCell } from "./SparkCell";

type SortKey = "symbol" | "price" | "changePct" | "volumen";

const PAGE_SIZE = 25;

export function InstrumentTable({ items }: { items: Instrument[] }) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>("volumen");
  const [asc, setAsc] = useState(false);
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    const arr = [...items];
    arr.sort((a, b) => {
      let av: number | string;
      let bv: number | string;
      if (sortKey === "symbol") {
        av = a.symbol;
        bv = b.symbol;
      } else if (sortKey === "volumen") {
        av = Number(a.extra?.volumen ?? 0);
        bv = Number(b.extra?.volumen ?? 0);
      } else {
        av = a[sortKey] ?? -Infinity;
        bv = b[sortKey] ?? -Infinity;
      }
      if (typeof av === "string" && typeof bv === "string") {
        return asc ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return asc ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return arr;
  }, [items, sortKey, asc]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = useMemo(
    () => sorted.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE),
    [sorted, safePage]
  );

  // Volver a la primera página al cambiar de tab o de orden.
  useEffect(() => {
    setPage(0);
  }, [items, sortKey, asc]);

  function toggle(key: SortKey) {
    if (key === sortKey) setAsc((v) => !v);
    else {
      setSortKey(key);
      setAsc(key === "symbol");
    }
  }

  const hasVolume = items.some((i) => i.extra?.volumen != null);
  const hasName = items.some((i) => i.name !== i.symbol);
  const hasSpark = items.some(
    (i) => i.category === "accion" || i.category === "cedear"
  );

  const arrow = (key: SortKey) =>
    sortKey === key ? (asc ? " ↑" : " ↓") : "";

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border-soft bg-surface/40 p-8 text-center text-sm text-text-mute">
        No hay datos disponibles en este momento.
      </div>
    );
  }

  const pager =
    totalPages > 1 ? (
      <div className="flex items-center justify-between gap-3 bg-surface/40 px-4 py-3 text-sm">
        <span className="text-xs text-text-mute tnum">
          {safePage * PAGE_SIZE + 1}–
          {Math.min((safePage + 1) * PAGE_SIZE, sorted.length)} de{" "}
          {sorted.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition enabled:hover:bg-surface disabled:opacity-40"
          >
            ← Anterior
          </button>
          <span className="text-xs text-text-dim tnum">
            {safePage + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition enabled:hover:bg-surface disabled:opacity-40"
          >
            Siguiente →
          </button>
        </div>
      </div>
    ) : null;

  return (
    <div className="overflow-hidden rounded-xl border border-border-soft">
      {pager && <div className="border-b border-border-soft">{pager}</div>}
      <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-border bg-surface/60 text-left text-xs uppercase tracking-wider text-text-mute">
            <Th onClick={() => toggle("symbol")} className="pl-4">
              Símbolo{arrow("symbol")}
            </Th>
            <Th onClick={() => toggle("price")} className="text-right">
              Precio{arrow("price")}
            </Th>
            <Th onClick={() => toggle("changePct")} className="text-right">
              Var. día{arrow("changePct")}
            </Th>
            {hasSpark && (
              <th className="hidden px-3 py-2.5 text-right font-semibold sm:table-cell">
                Tendencia 30d
              </th>
            )}
            {hasVolume && (
              <Th
                onClick={() => toggle("volumen")}
                className="hidden text-right pr-4 sm:table-cell"
              >
                Volumen{arrow("volumen")}
              </Th>
            )}
          </tr>
        </thead>
        <tbody>
          {pageItems.map((it) => (
            <tr
              key={it.id}
              onClick={() => router.push(`/i/${it.category}/${it.symbol}`)}
              className="cursor-pointer border-b border-border-soft/60 transition last:border-0 hover:bg-surface/50"
            >
              <td className="py-2.5 pl-4">
                <div className="font-semibold text-brand">{it.symbol}</div>
                {hasName && it.name !== it.symbol && (
                  <div className="truncate text-xs text-text-mute max-w-[180px]">
                    {it.name}
                  </div>
                )}
              </td>
              <td className="py-2.5 text-right tnum font-medium">
                {formatMoney(it.price, it.currency)}
              </td>
              <td className="py-2.5 text-right">
                <ChangeBadge pct={it.changePct} />
              </td>
              {hasSpark && (
                <td className="hidden py-2.5 pr-3 sm:table-cell">
                  <div className="flex justify-end">
                    <SparkCell
                      symbol={it.symbol}
                      category={it.category}
                      up={(it.changePct ?? 0) >= 0}
                    />
                  </div>
                </td>
              )}
              {hasVolume && (
                <td className="hidden py-2.5 pr-4 text-right tnum text-text-dim sm:table-cell">
                  {it.extra?.volumen != null
                    ? formatInt(Number(it.extra.volumen))
                    : "—"}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {pager && <div className="border-t border-border-soft">{pager}</div>}
    </div>
  );
}

function Th({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <th
      onClick={onClick}
      className={`cursor-pointer select-none px-3 py-2.5 font-semibold transition hover:text-text ${className}`}
    >
      {children}
    </th>
  );
}
