"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Instrument } from "@/lib/types";
import type { SortKey } from "@/lib/listing";
import { formatMoney, formatInt } from "@/lib/format";
import { ChangeBadge } from "./ChangeBadge";
import { SparkCell } from "./SparkCell";

const PAGE_SIZE = 25;

// Orden y página vienen de la URL (ver lib/listing.ts): la tabla solo los muestra
// y avisa los cambios.
export function InstrumentTable({
  items,
  sortKey,
  asc,
  page,
  onSortChange,
  onPageChange,
}: {
  items: Instrument[];
  sortKey: SortKey;
  asc: boolean;
  page: number;
  onSortChange: (key: SortKey) => void;
  onPageChange: (page: number) => void;
}) {
  const router = useRouter();

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

  const hasVolume = items.some((i) => i.extra?.volumen != null);
  const hasName = items.some((i) => i.name !== i.symbol);
  const hasSpark = items.some(
    (i) => i.category === "accion" || i.category === "cedear"
  );

  const sortProps = (key: SortKey) => ({
    active: sortKey === key,
    asc,
    onClick: () => onSortChange(key),
  });

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
            onClick={() => onPageChange(Math.max(0, safePage - 1))}
            disabled={safePage === 0}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition enabled:hover:bg-surface disabled:opacity-40"
          >
            ← Anterior
          </button>
          <span className="text-xs text-text-dim tnum">
            {safePage + 1} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages - 1, safePage + 1))}
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
            <Th {...sortProps("symbol")} className="pl-4">
              Símbolo
            </Th>
            <Th {...sortProps("price")} className="text-right">
              Precio
            </Th>
            <Th {...sortProps("changePct")} className="text-right">
              Var. día
            </Th>
            {hasSpark && (
              <th className="hidden px-3 py-2.5 text-right font-semibold sm:table-cell">
                Tendencia 30d
              </th>
            )}
            {hasVolume && (
              <Th
                {...sortProps("volumen")}
                className="hidden text-right pr-4 sm:table-cell"
              >
                Volumen
              </Th>
            )}
          </tr>
        </thead>
        <tbody>
          {pageItems.map((it) => (
            <tr
              key={it.id}
              // Con mouse se puede hacer click en toda la fila; con teclado se
              // usa el enlace del símbolo.
              onClick={() => router.push(`/i/${it.category}/${it.symbol}`)}
              className="cursor-pointer border-b border-border-soft/60 transition last:border-0 hover:bg-surface/50"
            >
              <td className="py-2.5 pl-4">
                <Link
                  href={`/i/${it.category}/${it.symbol}`}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded font-semibold text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  {it.symbol}
                </Link>
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
  active,
  asc,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  active: boolean;
  asc: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <th
      aria-sort={active ? (asc ? "ascending" : "descending") : "none"}
      className={`px-3 py-2.5 font-semibold ${className}`}
    >
      <button
        type="button"
        onClick={onClick}
        className="select-none rounded uppercase tracking-wider transition hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {children}
        {active && <span aria-hidden="true">{asc ? " ↑" : " ↓"}</span>}
      </button>
    </th>
  );
}
