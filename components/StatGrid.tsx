import type { History } from "@/lib/sources";
import type { Instrument } from "@/lib/types";
import { formatMoney, formatInt } from "@/lib/format";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-soft bg-surface/40 px-4 py-3">
      <div className="text-xs text-text-mute">{label}</div>
      <div className="tnum mt-0.5 text-base font-semibold">{value}</div>
    </div>
  );
}

export function StatGrid({
  inst,
  history,
}: {
  inst: Instrument;
  history: History;
}) {
  const cur = inst.currency;
  const bid = inst.extra?.bid;
  const ask = inst.extra?.ask;
  const vol = inst.extra?.volumen;

  const closes = history.c;
  const hi = closes.length ? Math.max(...closes) : null;
  const lo = closes.length ? Math.min(...closes) : null;
  const prevClose =
    closes.length >= 2 ? closes[closes.length - 2] : null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <Stat label="Último precio" value={formatMoney(inst.price, cur)} />
      {bid != null && (
        <Stat label="Compra (bid)" value={formatMoney(Number(bid), cur)} />
      )}
      {ask != null && (
        <Stat label="Venta (ask)" value={formatMoney(Number(ask), cur)} />
      )}
      {vol != null && (
        <Stat label="Volumen" value={formatInt(Number(vol))} />
      )}
      {hi != null && (
        <Stat label="Máx (rango)" value={formatMoney(hi, cur)} />
      )}
      {lo != null && (
        <Stat label="Mín (rango)" value={formatMoney(lo, cur)} />
      )}
      {prevClose != null && (
        <Stat label="Cierre previo" value={formatMoney(prevClose, cur)} />
      )}
    </div>
  );
}
