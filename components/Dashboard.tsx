"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { Category, DolarQuote, Instrument, MarketData } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { DOLAR_SHORT } from "@/lib/names";
import {
  LISTING_TABS,
  LISTING_URL_KEY,
  defaultAsc,
  parseListing,
  updateListing,
  useLocationSearch,
  type SortKey,
} from "@/lib/listing";
import { OverviewCards } from "./OverviewCards";
import { InstrumentTable } from "./InstrumentTable";
import { CurrencyConverter } from "./CurrencyConverter";
import { TopMovers } from "./TopMovers";
import { ChangeBadge } from "./ChangeBadge";
import { formatMoney, timeAgo } from "@/lib/format";

// Reloj para "actualizado hace X". En el servidor y durante la hidratación vale
// null: el HTML se cachea hasta 60s, así que un texto relativo calculado ahí no
// coincide con el del navegador (React #418).
let clock: number | null = null;

function subscribeToClock(onChange: () => void) {
  const tick = () => {
    clock = Date.now();
    onChange();
  };
  tick();
  const id = setInterval(tick, 15_000);
  return () => clearInterval(id);
}

function useNow(): number | null {
  return useSyncExternalStore(
    subscribeToClock,
    () => clock,
    () => null
  );
}

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Puntaje de coincidencia de la búsqueda: exacto > prefijo > contiene.
function matchScore(q: string, key: string, name: string): number {
  if (key === q) return 100;
  if (key.startsWith(q)) return 80;
  if (name.startsWith(q)) return 60;
  if (key.includes(q)) return 40;
  if (name.includes(q)) return 30;
  return -1;
}

type SearchResult =
  | { kind: "instrument"; item: Instrument }
  | { kind: "dolar"; item: DolarQuote; label: string };

function allInstruments(m: MarketData): Instrument[] {
  return [
    ...m.acciones,
    ...m.cedears,
    ...m.bonos,
    ...m.letras,
    ...m.indices,
  ];
}

export function Dashboard({ initial }: { initial: MarketData }) {
  const [market, setMarket] = useState<MarketData>(initial);
  // Categoría, página, orden y búsqueda viven en la URL (lib/listing.ts).
  const search = useLocationSearch();
  const listing = useMemo(() => parseListing(search), [search]);
  const { cat: tab, q: query } = listing;
  const setQuery = (q: string) => updateListing({ q });
  const now = useNow();
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-refresh cada 60s
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/market", { cache: "no-store" });
        if (res.ok) setMarket(await res.json());
      } catch {
        /* silencioso */
      }
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  // Atajo "/" para enfocar búsqueda
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") updateListing({ q: "" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Recordar la URL del listado para el "← Volver" de las fichas.
  useEffect(() => {
    try {
      sessionStorage.setItem(LISTING_URL_KEY, `/${search}`);
    } catch {}
  }, [search]);

  const all = useMemo(() => allInstruments(market), [market]);

  const results = useMemo((): SearchResult[] | null => {
    const q = normalize(query.trim());
    if (!q) return null;
    // Dólares: por etiqueta corta ("MEP") o por nombre ("dólar bolsa").
    const dolares = market.dolares.map((d) => {
      const label = DOLAR_SHORT[d.casa] ?? d.nombre;
      const score = Math.max(
        matchScore(q, normalize(label), normalize(`dolar ${d.nombre}`)),
        matchScore(q, normalize(`dolar ${label}`), "")
      );
      return { r: { kind: "dolar", item: d, label } as SearchResult, score };
    });
    const instruments = all.map((i) => ({
      r: { kind: "instrument", item: i } as SearchResult,
      score: matchScore(q, i.symbol.toLowerCase(), normalize(i.name)),
    }));
    return [...dolares, ...instruments]
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 40)
      .map((x) => x.r);
  }, [all, market.dolares, query]);

  const byCategory: Record<Category, Instrument[]> = {
    dolar: [],
    accion: market.acciones,
    cedear: market.cedears,
    bono: market.bonos,
    letra: market.letras,
    indice: market.indices,
  };

  const refreshedAt = now == null ? null : timeAgo(market.generatedAt, now);

  return (
    <div className="space-y-8">
      <OverviewCards
        dolares={market.dolares}
        riesgoPais={market.riesgoPais}
        inflacion={market.inflacion}
        indices={market.indices}
        commodities={market.commodities}
      />

      {/* Búsqueda */}
      <div className="relative">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface/70 px-4 py-3 backdrop-blur focus-within:border-brand/50">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            className="shrink-0 text-text-mute"
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar acción, CEDEAR, bono, índice… (ej: ALUA, Apple, MEP)"
            className="w-full bg-transparent text-base outline-none placeholder:text-text-mute"
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              className="rounded-md px-2 py-1 text-xs text-text-mute hover:bg-surface-2/60"
            >
              Esc
            </button>
          ) : (
            <kbd className="hidden rounded-md border border-border px-1.5 py-0.5 text-xs text-text-mute sm:block">
              /
            </kbd>
          )}
        </div>

        {results && (
          <div className="mt-3 rounded-2xl border border-border bg-bg-elev/95 p-2 shadow-xl backdrop-blur">
            {results.length === 0 ? (
              <div className="p-6 text-center text-sm text-text-mute">
                Sin resultados para “{query}”.
              </div>
            ) : (
              <ul className="max-h-[420px] divide-y divide-border-soft/60 overflow-y-auto">
                {results.map((res) =>
                  res.kind === "dolar" ? (
                    <li
                      key={`dolar:${res.item.casa}`}
                      className="flex items-center justify-between gap-3 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-brand">
                            Dólar {res.label}
                          </span>
                          <span className="rounded bg-surface-2/60 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-text-mute">
                            {CATEGORY_LABELS.dolar}
                          </span>
                        </div>
                        <div className="truncate text-xs text-text-mute">
                          compra {formatMoney(res.item.compra, "ARS")}
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1.5 text-right">
                        <span className="tnum font-medium">
                          {formatMoney(res.item.venta, "ARS")}
                        </span>
                        <span className="text-xs text-text-mute">venta</span>
                      </div>
                    </li>
                  ) : (
                  <li key={res.item.id}>
                    <Link
                      href={`/i/${res.item.category}/${res.item.symbol}`}
                      className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-surface/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-brand">
                            {res.item.symbol}
                          </span>
                          <span className="rounded bg-surface-2/60 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-text-mute">
                            {CATEGORY_LABELS[res.item.category]}
                          </span>
                        </div>
                        {res.item.name !== res.item.symbol && (
                          <div className="truncate text-xs text-text-mute">
                            {res.item.name}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <span className="tnum font-medium">
                          {formatMoney(res.item.price, res.item.currency)}
                        </span>
                        <ChangeBadge pct={res.item.changePct} />
                      </div>
                    </Link>
                  </li>
                  )
                )}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Conversor + Top movers (ocultos durante la búsqueda) */}
      {!results && (
        <>
          <CurrencyConverter dolares={market.dolares} />
          <TopMovers instruments={market.acciones} />
        </>
      )}

      {/* Tabs + tablas */}
      {!results && (
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {LISTING_TABS.map((t) => {
                const active = t === tab;
                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={active}
                    onClick={() => updateListing({ cat: t, page: 0 })}
                    className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
                      active
                        ? "bg-brand text-bg"
                        : "bg-surface/60 text-text-dim hover:bg-surface hover:text-text"
                    }`}
                  >
                    {CATEGORY_LABELS[t]}
                    <span className="ml-1.5 text-xs opacity-70">
                      {byCategory[t].length}
                    </span>
                  </button>
                );
              })}
            </div>
            <span className="text-xs text-text-mute">
              {refreshedAt ? `Actualizado ${refreshedAt}` : "Datos en vivo"} · se
              refresca solo cada 60s
            </span>
          </div>
          <InstrumentTable
            items={byCategory[tab]}
            sortKey={listing.sort}
            asc={listing.asc}
            page={listing.page}
            onSortChange={(key: SortKey) =>
              updateListing({
                sort: key,
                asc: key === listing.sort ? !listing.asc : defaultAsc(key),
                page: 0,
              })
            }
            onPageChange={(page) => updateListing({ page })}
          />
        </div>
      )}
    </div>
  );
}
