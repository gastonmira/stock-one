import Link from "next/link";
import type { Instrument } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { ChangeBadge } from "./ChangeBadge";

function MoverRow({ i }: { i: Instrument }) {
  return (
    <Link
      href={`/i/${i.category}/${i.symbol}`}
      className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition hover:bg-surface/60"
    >
      <div className="min-w-0">
        <div className="font-semibold text-brand">{i.symbol}</div>
        {i.name !== i.symbol && (
          <div className="truncate text-xs text-text-mute">{i.name}</div>
        )}
      </div>
      <div className="flex items-center gap-2.5">
        <span className="tnum text-sm">{formatMoney(i.price, i.currency)}</span>
        <ChangeBadge pct={i.changePct} />
      </div>
    </Link>
  );
}

function Column({
  title,
  items,
}: {
  title: string;
  items: Instrument[];
}) {
  return (
    <div className="rounded-2xl border border-border-soft bg-surface/40 p-3">
      <h3 className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-text-mute">
        {title}
      </h3>
      <div className="space-y-0.5">
        {items.map((i) => (
          <MoverRow key={i.id} i={i} />
        ))}
      </div>
    </div>
  );
}

export function TopMovers({ instruments }: { instruments: Instrument[] }) {
  const eligible = instruments.filter(
    (i) =>
      i.changePct != null &&
      i.price > 0 &&
      Number(i.extra?.volumen ?? 0) > 0
  );
  if (eligible.length < 4) return null;

  const gainers = [...eligible]
    .sort((a, b) => (b.changePct ?? 0) - (a.changePct ?? 0))
    .slice(0, 5);
  const losers = [...eligible]
    .sort((a, b) => (a.changePct ?? 0) - (b.changePct ?? 0))
    .slice(0, 5);

  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-mute">
        Top del día · acciones
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Column title="🔥 Mayores subas" items={gainers} />
        <Column title="🧊 Mayores bajas" items={losers} />
      </div>
    </section>
  );
}
