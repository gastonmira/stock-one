import { getMarket } from "@/lib/sources";
import { Dashboard } from "@/components/Dashboard";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export const revalidate = 60;

export default async function Home() {
  const market = await getMarket();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "StockOne",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    url: "https://stockone-nu.vercel.app",
    description:
      "Dólares, riesgo país, acciones, bonos, CEDEARs e índices de USA de Argentina, en vivo y en un solo lugar.",
    inLanguage: "es-AR",
    offers: { "@type": "Offer", price: "0", priceCurrency: "ARS" },
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-2 text-lg font-black text-bg">
              $1
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              Stock<span className="text-brand">One</span>
            </h1>
          </div>
          <p className="mt-1.5 text-sm text-text-dim">
            Todos los valores financieros de Argentina, en un solo lugar.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-text-mute sm:block">
            Datos en vivo · dólares, acciones, bonos, CEDEARs, riesgo país
          </span>
          <ThemeSwitcher />
        </div>
      </header>

      <Dashboard initial={market} />

      <footer className="mt-16 border-t border-border-soft pt-6 text-xs text-text-mute">
        <p>
          Fuentes: dolarapi.com · argentinadatos.com · data912.com · Yahoo
          Finance. Datos con fines informativos, sin garantía de exactitud ni
          recomendación de inversión.
        </p>
        <p className="mt-1">
          StockOne — hecho en Argentina 🇦🇷 por{" "}
          <a
            href="https://www.gastonmira.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand/80 transition hover:text-brand"
          >
            Gastón Mira
          </a>
        </p>
      </footer>
    </main>
  );
}
