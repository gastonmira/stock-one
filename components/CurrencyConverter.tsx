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

type ParsedAmount =
  | { kind: "empty" }
  | { kind: "error"; message: string }
  | { kind: "ok"; value: number; hint: string | null };

// Miles con punto en grupos de 3: "1.000", "1.500.000".
const THOUSANDS = /^\d{1,3}(\.\d{3})+$/;

// Interpreta el importe sin reescribirlo mientras se tipea. Formato local es-AR
// (punto = miles, coma = decimal). Un punto que no puede ser de miles ("1.5") se
// toma como decimal y se avisa; nunca se descarta un carácter en silencio.
function parseAmount(raw: string): ParsedAmount {
  const s = raw.replace(/\s/g, "");
  if (!s) return { kind: "empty" };
  if (s.includes("-")) {
    return { kind: "error", message: "Ingresá un importe positivo, sin signo menos." };
  }
  if (!/^[\d.,]+$/.test(s)) {
    return { kind: "error", message: "Usá solo números, con coma para los decimales." };
  }
  const invalid: ParsedAmount = {
    kind: "error",
    message: "No se reconoce el formato. Ejemplos: 1500 · 1.500 · 1.500,50 · 1,5",
  };

  if (s.includes(",")) {
    const parts = s.split(",");
    if (parts.length > 2) return invalid;
    const [intPart, decPart] = parts;
    if (intPart && !/^\d+$/.test(intPart) && !THOUSANDS.test(intPart)) return invalid;
    if (!/^\d*$/.test(decPart)) return invalid;
    const value = Number(`${intPart.replace(/\./g, "") || "0"}.${decPart || "0"}`);
    return { kind: "ok", value, hint: null };
  }

  if (/^\d+$/.test(s)) return { kind: "ok", value: Number(s), hint: null };
  if (THOUSANDS.test(s)) {
    const value = Number(s.replace(/\./g, ""));
    return {
      kind: "ok",
      value,
      hint: `Se interpreta como ${formatNumber(value, 8)} (el punto separa miles).`,
    };
  }
  const dots = s.split(".");
  if (dots.length === 2 && dots[0] !== "") {
    const value = Number(s);
    return {
      kind: "ok",
      value,
      hint: `Se interpreta como ${formatNumber(value, 8)} (punto como decimal).`,
    };
  }
  return invalid;
}

export function CurrencyConverter({ dolares }: { dolares: DolarQuote[] }) {
  const [amount, setAmount] = useState("100");
  const [currency, setCurrency] = useState<"USD" | "ARS">("USD");

  const quotes = useMemo(() => {
    const map = new Map(dolares.map((d) => [d.casa, d]));
    return CASAS.map(({ casa, label }) => ({
      label,
      venta: map.get(casa)?.venta ?? null,
    })).filter((q) => q.venta != null);
  }, [dolares]);

  const parsed = parseAmount(amount);
  const valid = parsed.kind === "ok";
  const value = valid ? parsed.value : NaN;
  const message =
    parsed.kind === "error" ? parsed.message : valid ? parsed.hint : null;

  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-mute">
        Conversor
      </h2>
      <div className="rounded-2xl border border-border bg-surface/50 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div
            className={`flex flex-1 items-center gap-2 rounded-xl border bg-bg-elev/60 px-3 py-2 ${
              parsed.kind === "error"
                ? "border-down/60"
                : "border-border focus-within:border-brand/50"
            }`}
          >
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              // Al salir del campo, mostrar el importe en formato local (1.500,5).
              onBlur={() => valid && setAmount(formatNumber(value, 8))}
              inputMode="decimal"
              placeholder="0"
              aria-label="Importe a convertir"
              aria-invalid={parsed.kind === "error"}
              aria-describedby={message ? "conversor-ayuda" : undefined}
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

        {message && (
          <p
            id="conversor-ayuda"
            role={parsed.kind === "error" ? "alert" : undefined}
            className={`mt-2 text-xs ${
              parsed.kind === "error" ? "text-down" : "text-text-mute"
            }`}
          >
            {message}
          </p>
        )}

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
