"use client";

import { useMemo, useState } from "react";
import type { DolarQuote } from "@/lib/types";
import { formatNumber } from "@/lib/format";

const CASAS: { casa: string; label: string }[] = [
  { casa: "blue", label: "Blue" },
  { casa: "bolsa", label: "MEP" },
  { casa: "contadoconliqui", label: "CCL" },
  { casa: "oficial", label: "Oficial" },
];

// Formatea lo que se escribe con separador de miles es-AR ("151000" -> "151.000",
// "151000,5" -> "151.000,5"), preservando el decimal que el usuario tipea.
function formatInput(raw: string): string {
  let s = raw.replace(/[^\d,]/g, "");
  const firstComma = s.indexOf(",");
  if (firstComma !== -1) {
    s =
      s.slice(0, firstComma + 1) +
      s.slice(firstComma + 1).replace(/,/g, "");
  }
  const [intPart, decPart] = s.split(",");
  const intFmt = intPart ? Number(intPart).toLocaleString("es-AR") : "";
  if (s.includes(",")) {
    return `${intFmt || "0"},${(decPart ?? "").slice(0, 2)}`;
  }
  return intFmt;
}

// El input siempre viene formateado es-AR (punto = miles, coma = decimal),
// así que quitamos los puntos y pasamos la coma a punto: "1.500.000,5" -> 1500000.5
function parseAmount(raw: string): number {
  const s = raw.replace(/\./g, "").replace(",", ".").trim();
  if (!s) return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

export function CurrencyConverter({ dolares }: { dolares: DolarQuote[] }) {
  const [amount, setAmount] = useState(() => formatInput("100"));
  const [currency, setCurrency] = useState<"USD" | "ARS">("USD");

  const quotes = useMemo(() => {
    const map = new Map(dolares.map((d) => [d.casa, d]));
    return CASAS.map(({ casa, label }) => ({
      label,
      venta: map.get(casa)?.venta ?? null,
    })).filter((q) => q.venta != null);
  }, [dolares]);

  const value = parseAmount(amount);
  const valid = Number.isFinite(value) && value >= 0;

  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-mute">
        Conversor
      </h2>
      <div className="rounded-2xl border border-border bg-surface/50 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-bg-elev/60 px-3 py-2 focus-within:border-brand/50">
            <input
              value={amount}
              onChange={(e) => setAmount(formatInput(e.target.value))}
              inputMode="decimal"
              placeholder="0"
              className="tnum w-full min-w-0 bg-transparent text-xl font-bold outline-none"
            />
          </div>
          <div className="flex rounded-xl bg-bg-elev/70 p-1">
            {(["USD", "ARS"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                  currency === c
                    ? "bg-brand text-bg"
                    : "text-text-dim hover:text-text"
                }`}
              >
                {c === "USD" ? "US$ Dólares" : "$ Pesos"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quotes.map((q) => {
            const result = valid
              ? currency === "USD"
                ? value * (q.venta as number)
                : value / (q.venta as number)
              : null;
            const outCur = currency === "USD" ? "$" : "US$";
            return (
              <div
                key={q.label}
                className="rounded-xl border border-border-soft bg-surface/40 px-3 py-2.5"
              >
                <div className="text-xs text-text-mute">{q.label}</div>
                <div className="tnum mt-0.5 text-base font-bold">
                  {result != null
                    ? `${outCur}${formatNumber(result, currency === "USD" ? 0 : 2)}`
                    : "—"}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-text-mute">
          Calculado con el precio de venta de cada dólar (lo que cuesta
          comprarlo).
        </p>
      </div>
    </section>
  );
}
