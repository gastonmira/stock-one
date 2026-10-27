const AR = "es-AR";

export function formatMoney(
  value: number | null | undefined,
  currency: "ARS" | "USD" = "ARS",
  maxDigits = 2
): string {
  if (value == null || Number.isNaN(value)) return "—";
  const symbol = currency === "USD" ? "US$" : "$";
  const digits = Math.abs(value) < 1 ? Math.max(maxDigits, 2) : maxDigits;
  return `${symbol}${value.toLocaleString(AR, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  })}`;
}

export function formatNumber(
  value: number | null | undefined,
  maxDigits = 2
): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toLocaleString(AR, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDigits,
  });
}

export function formatPct(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString(AR, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

export function formatInt(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return Math.round(value).toLocaleString(AR);
}

export function timeAgo(
  iso: string | null | undefined,
  now: number = Date.now()
): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const secs = Math.max(0, Math.floor((now - then) / 1000));
  if (secs < 60) return `hace ${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `hace ${mins} min`;
  const hs = Math.floor(mins / 60);
  if (hs < 24) return `hace ${hs} h`;
  const days = Math.floor(hs / 24);
  return `hace ${days} d`;
}
