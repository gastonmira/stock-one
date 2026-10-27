import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Category } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import {
  getCompanyProfile,
  getHistory,
  getInstrument,
  getNews,
  newsQueryFor,
  type CompanyProfile,
  type History,
} from "@/lib/sources";
import { INDEX_META } from "@/lib/names";
import { PriceChart } from "@/components/PriceChart";
import { CompanyProfileCard } from "@/components/CompanyProfile";
import { NewsList } from "@/components/NewsList";
import { StatGrid } from "@/components/StatGrid";
import { ChangeBadge } from "@/components/ChangeBadge";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { BackLink } from "@/components/BackLink";
import { formatMoney } from "@/lib/format";

export const revalidate = 60;

const VALID: Category[] = ["accion", "cedear", "bono", "letra", "indice"];
const WITH_CHART: Category[] = ["accion", "cedear", "indice"];

function yahooForIndex(symbol: string): string {
  return INDEX_META.find((i) => i.symbol === symbol)?.yahoo ?? `^${symbol}`;
}

type Params = { category: string; symbol: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { category, symbol } = await params;
  const cat = category as Category;
  const inst = VALID.includes(cat)
    ? await getInstrument(cat, decodeURIComponent(symbol))
    : null;
  if (!inst) return { title: "Instrumento no encontrado" };
  return {
    title: `${inst.symbol} — ${inst.name}`,
    description: `Precio, gráfico histórico y últimas noticias de ${inst.name} (${inst.symbol}) en StockOne. Cotización actual: ${formatMoney(
      inst.price,
      inst.currency
    )}.`,
    alternates: { canonical: `/i/${cat}/${inst.symbol}` },
  };
}

export default async function InstrumentPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { category, symbol } = await params;
  const cat = category as Category;
  if (!VALID.includes(cat)) notFound();

  const inst = await getInstrument(cat, decodeURIComponent(symbol));
  if (!inst) notFound();

  const supportsChart = WITH_CHART.includes(cat);
  const isIndex = cat === "indice";
  const histSymbol = isIndex ? yahooForIndex(inst.symbol) : inst.symbol;

  const isCompany = cat === "accion" || cat === "cedear";

  const [history, news, profile] = await Promise.all([
    supportsChart
      ? getHistory(histSymbol, "6M", isIndex)
      : Promise.resolve<History>({ t: [], c: [] }),
    getNews(newsQueryFor(cat, inst.symbol, inst.name)),
    isCompany
      ? getCompanyProfile(inst.name || inst.symbol)
      : Promise.resolve<CompanyProfile | null>(null),
  ]);

  const hasName = inst.name && inst.name !== inst.symbol;

  return (
    <>
      {/* Barra sticky: siempre visible para volver sin scrollear */}
      <div className="sticky top-0 z-30 border-b border-border-soft/70 bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <BackLink />
          <div className="flex items-center gap-2.5">
            <span className="font-bold">{inst.symbol}</span>
            <span className="tnum text-sm font-semibold">
              {formatMoney(inst.price, inst.currency)}
            </span>
            <ChangeBadge pct={inst.changePct} />
            <ThemeSwitcher />
          </div>
        </div>
      </div>

      <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-black tracking-tight">
              {inst.symbol}
            </h1>
            <span className="rounded-md bg-surface-2/60 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-text-mute">
              {CATEGORY_LABELS[cat]}
            </span>
          </div>
          {hasName && (
            <p className="mt-1 text-text-dim">{inst.name}</p>
          )}
        </div>
        <div className="text-right">
          <div className="tnum text-3xl font-bold tracking-tight">
            {formatMoney(inst.price, inst.currency)}
          </div>
          <div className="mt-1 flex justify-end">
            <ChangeBadge pct={inst.changePct} size="md" />
          </div>
        </div>
      </header>

      <div className="mt-6 space-y-6">
        {supportsChart ? (
          <PriceChart
            symbol={histSymbol}
            currency={inst.currency}
            isIndex={isIndex}
            initial={history}
            initialRange="6M"
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-surface/30 p-6 text-center text-sm text-text-mute">
            El histórico de precios no está disponible para {CATEGORY_LABELS[cat].toLowerCase()}.
          </div>
        )}

        {profile && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-mute">
              Sobre la empresa
            </h2>
            <CompanyProfileCard profile={profile} />
          </section>
        )}

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-mute">
            Estadísticas
          </h2>
          <StatGrid inst={inst} history={history} />
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-mute">
            Últimas noticias
          </h2>
          <NewsList items={news} />
        </section>
      </div>

        <footer className="mt-14 border-t border-border-soft pt-6 text-xs text-text-mute">
          Fuentes: data912.com · Yahoo Finance · Google Noticias. Datos con fines
          informativos, sin garantía de exactitud ni recomendación de inversión.
        </footer>
      </main>
    </>
  );
}
