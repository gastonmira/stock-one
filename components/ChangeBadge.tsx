import { formatPct } from "@/lib/format";

export function ChangeBadge({
  pct,
  size = "sm",
}: {
  pct: number | null | undefined;
  size?: "sm" | "md";
}) {
  if (pct == null || Number.isNaN(pct)) {
    return <span className="text-text-mute tnum">—</span>;
  }
  const up = pct > 0;
  const flat = pct === 0;
  const color = flat ? "text-text-dim" : up ? "text-up" : "text-down";
  const bg = flat
    ? "bg-surface-2/60"
    : up
      ? "bg-[var(--up-bg)]"
      : "bg-[var(--down-bg)]";
  const arrow = flat ? "→" : up ? "▲" : "▼";
  const pad = size === "md" ? "px-2.5 py-1 text-sm" : "px-2 py-0.5 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-semibold tnum ${pad} ${color} ${bg}`}
    >
      <span className="text-[0.7em]">{arrow}</span>
      {formatPct(pct)}
    </span>
  );
}
