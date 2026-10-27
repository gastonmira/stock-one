import type { DolarQuote, Instrument, RiesgoPais } from "@/lib/types";
import { formatMoney, formatInt, formatPct } from "@/lib/format";
import { DOLAR_SHORT, INSTRUMENT_INFO } from "@/lib/names";
import { ChangeBadge } from "./ChangeBadge";
import { InfoButton } from "./InfoButton";
import { Sparkline } from "./Sparkline";

function DolarCard({ q }: { q: DolarQuote }) {
  const spread =
    q.compra && q.venta ? ((q.venta - q.compra) / q.compra) * 100 : null;
  const label = DOLAR_SHORT[q.casa] ?? q.nombre;
  return (
    <div className="fadein rounded-2xl border border-border bg-surface/70 p-4 backdrop-blur transition hover:border-brand/40 hover:bg-surface">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-semibold text-text-dim">
          Dólar {label}
        </span>
        <span className="h-2 w-2 shrink-0 rounded-full bg-brand/70" />
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="tnum text-2xl font-bold tracking-tight sm:text-3xl">
          {formatMoney(q.venta, "ARS", 2)}
        </span>
        <span className="text-xs text-text-mute">venta</span>
      </div>
      <div className="mt-1 flex items-center gap-3 text-xs text-text-mute tnum">
        <span>compra {formatMoney(q.compra, "ARS", 2)}</span>
        {spread != null && <span>· spread {formatPct(spread)}</span>}
      </div>
    </div>
  );
}

function RiesgoCard({
  riesgo,
  inflacion,
}: {
  riesgo: RiesgoPais | null;
  inflacion: number | null;
}) {
  return (
    <div className="fadein rounded-2xl border border-border bg-surface/70 p-4 backdrop-blur transition hover:border-brand/40 hover:bg-surface">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-semibold text-text-dim">
          Riesgo país
        </span>
        <span className="h-2 w-2 shrink-0 rounded-full bg-brand/70" />
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="tnum text-2xl font-bold tracking-tight sm:text-3xl">
          {riesgo ? formatInt(riesgo.valor) : "—"}
        </span>
        <span className="text-xs text-text-mute">pb</span>
      </div>
      <div className="mt-1 text-xs text-text-mute tnum">
        {inflacion != null
          ? `Inflación mensual ${formatPct(inflacion)}`
          : riesgo?.fecha
            ? `al ${riesgo.fecha}`
            : ""}
      </div>
    </div>
  );
}

function IndexChip({ i }: { i: Instrument }) {
  const up = (i.changePct ?? 0) >= 0;
  const info = INSTRUMENT_INFO[i.symbol];
  return (
    <div className="fadein flex items-center justify-between gap-3 rounded-xl border border-border-soft bg-surface/50 px-3.5 py-2.5">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-xs font-semibold text-text-dim">
            {i.name}
          </span>
          {info && <InfoButton description={info} label={i.name} />}
        </div>
        <div className="tnum text-base font-bold">
          {i.price.toLocaleString("es-AR", { maximumFractionDigits: 2 })}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {i.spark && i.spark.length > 1 && (
          <div className="hidden sm:block">
            <Sparkline data={i.spark} up={up} width={70} height={28} />
          </div>
        )}
        <ChangeBadge pct={i.changePct} />
      </div>
    </div>
  );
}

export function OverviewCards({
  dolares,
  riesgoPais,
  inflacion,
  indices,
  commodities,
}: {
  dolares: DolarQuote[];
  riesgoPais: RiesgoPais | null;
  inflacion: number | null;
  indices: Instrument[];
  commodities: Instrument[];
}) {
  const featured = dolares.filter((d) =>
    ["blue", "bolsa", "contadoconliqui", "oficial"].includes(d.casa)
  );
  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {featured.map((q) => (
          <DolarCard key={q.casa} q={q} />
        ))}
        <RiesgoCard riesgo={riesgoPais} inflacion={inflacion} />
      </div>

      {indices.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-mute">
            Índices USA
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {indices.map((i) => (
              <IndexChip key={i.id} i={i} />
            ))}
          </div>
        </div>
      )}

      {commodities.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-mute">
            Commodities
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {commodities.map((c) => (
              <IndexChip key={c.id} i={c} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
