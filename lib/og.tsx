import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_ALT = "StockOne — Valores financieros de Argentina";

const CHIPS = [
  "Dólar Blue",
  "MEP",
  "CCL",
  "Riesgo país",
  "Acciones",
  "CEDEARs",
  "Bonos",
  "Nasdaq",
];

export function ogImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background:
            "radial-gradient(1000px 600px at 8% -10%, rgba(56,189,248,0.22), transparent 60%), radial-gradient(900px 500px at 100% 0%, rgba(129,140,248,0.2), transparent 55%), #0a0e17",
          fontFamily: "sans-serif",
          color: "#e8edf5",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 84,
              height: 84,
              borderRadius: 22,
              background: "linear-gradient(135deg, #38bdf8, #818cf8)",
              color: "#0a0e17",
              fontSize: 44,
              fontWeight: 900,
            }}
          >
            $1
          </div>
          <div style={{ display: "flex", fontSize: 56, fontWeight: 800 }}>
            <span>Stock</span>
            <span style={{ color: "#38bdf8" }}>One</span>
          </div>
        </div>

        {/* Titular */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              display: "flex",
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -1,
              maxWidth: 940,
            }}
          >
            Todos los valores financieros de Argentina
          </div>
          <div style={{ display: "flex", fontSize: 34, color: "#9aa7bd" }}>
            Dólares, riesgo país, acciones, bonos, CEDEARs e índices USA. En
            vivo.
          </div>
        </div>

        {/* Chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
          {CHIPS.map((c) => (
            <div
              key={c}
              style={{
                display: "flex",
                padding: "12px 22px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid #26324a",
                fontSize: 26,
                color: "#cdd6e5",
              }}
            >
              {c}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...OG_SIZE }
  );
}
