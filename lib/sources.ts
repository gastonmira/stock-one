import type {
  Category,
  DolarQuote,
  Instrument,
  MarketData,
  RiesgoPais,
} from "./types";
import { CEDEAR_NAMES, INDEX_META, STOCK_NAMES } from "./names";

const REVALIDATE = 60;

async function fetchJson<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    next: { revalidate: REVALIDATE },
    headers: {
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) StockOne/1.0",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return (await res.json()) as T;
}

// ---------- Dólares ----------
export async function getDolares(): Promise<DolarQuote[]> {
  const data = await fetchJson<DolarQuote[]>("https://dolarapi.com/v1/dolares");
  const order = [
    "blue",
    "bolsa",
    "contadoconliqui",
    "oficial",
    "tarjeta",
    "mayorista",
    "cripto",
  ];
  return [...data].sort(
    (a, b) => order.indexOf(a.casa) - order.indexOf(b.casa)
  );
}

// ---------- Riesgo país ----------
export async function getRiesgoPais(): Promise<RiesgoPais | null> {
  try {
    return await fetchJson<RiesgoPais>(
      "https://api.argentinadatos.com/v1/finanzas/indices/riesgo-pais/ultimo"
    );
  } catch {
    return null;
  }
}

// ---------- Inflación (último mensual) ----------
export async function getInflacion(): Promise<number | null> {
  try {
    const data = await fetchJson<{ fecha: string; valor: number }[]>(
      "https://api.argentinadatos.com/v1/finanzas/indices/inflacion"
    );
    if (!Array.isArray(data) || data.length === 0) return null;
    return data[data.length - 1]?.valor ?? null;
  } catch {
    return null;
  }
}

// ---------- data912 (acciones / cedears / bonos / letras) ----------
interface Data912Row {
  symbol: string;
  c: number;
  pct_change: number;
  px_bid: number;
  px_ask: number;
  q_bid: number;
  q_ask: number;
  v: number;
}

type Data912Kind = "arg_stocks" | "arg_cedears" | "arg_bonds" | "arg_notes";

const KIND_TO_CATEGORY = {
  arg_stocks: "accion",
  arg_cedears: "cedear",
  arg_bonds: "bono",
  arg_notes: "letra",
} as const;

function nameFor(kind: Data912Kind, symbol: string): string {
  if (kind === "arg_cedears") return CEDEAR_NAMES[symbol] ?? symbol;
  if (kind === "arg_stocks") return STOCK_NAMES[symbol] ?? symbol;
  return symbol;
}

export async function getData912(kind: Data912Kind): Promise<Instrument[]> {
  const rows = await fetchJson<Data912Row[]>(
    `https://data912.com/live/${kind}`
  );
  const category = KIND_TO_CATEGORY[kind];
  return rows
    .filter((r) => r && r.symbol && typeof r.c === "number")
    .map((r) => ({
      id: `${category}:${r.symbol}`,
      symbol: r.symbol,
      name: nameFor(kind, r.symbol),
      category,
      price: r.c,
      changePct: typeof r.pct_change === "number" ? r.pct_change : null,
      currency: "ARS" as const,
      extra: {
        bid: r.px_bid ?? null,
        ask: r.px_ask ?? null,
        volumen: r.v ?? null,
      },
    }));
}

// ---------- Índices USA (Yahoo Finance) ----------
interface YahooChart {
  chart: {
    result?: {
      meta: {
        regularMarketPrice: number;
        chartPreviousClose: number;
        regularMarketTime: number;
      };
      timestamp?: number[];
      indicators: { quote: { close: (number | null)[] }[] };
    }[];
  };
}

async function getIndex(
  yahoo: string,
  symbol: string,
  name: string
): Promise<Instrument | null> {
  try {
    const data = await fetchJson<YahooChart>(
      `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
        yahoo
      )}?interval=1d&range=1mo`
    );
    const result = data.chart.result?.[0];
    if (!result) return null;
    const { regularMarketPrice, chartPreviousClose, regularMarketTime } =
      result.meta;
    const changePct =
      chartPreviousClose && chartPreviousClose !== 0
        ? ((regularMarketPrice - chartPreviousClose) / chartPreviousClose) * 100
        : null;
    const spark = (result.indicators.quote?.[0]?.close ?? [])
      .filter((n): n is number => typeof n === "number")
      .slice(-30);
    return {
      id: `indice:${symbol}`,
      symbol,
      name,
      category: "indice",
      price: regularMarketPrice,
      changePct,
      currency: "USD",
      updatedAt: regularMarketTime
        ? new Date(regularMarketTime * 1000).toISOString()
        : undefined,
      spark,
    };
  } catch {
    return null;
  }
}

export async function getUsIndices(): Promise<Instrument[]> {
  const results = await Promise.all(
    INDEX_META.map((i) => getIndex(i.yahoo, i.symbol, i.name))
  );
  return results.filter((r): r is Instrument => r !== null);
}

// ---------- Sparklines de instrumentos ARG (Yahoo ticker .BA) ----------
async function getSparkForSymbol(symbol: string): Promise<number[] | null> {
  try {
    const data = await fetchJson<YahooChart>(
      `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
        symbol
      )}.BA?interval=1d&range=1mo`
    );
    const result = data.chart.result?.[0];
    if (!result) return null;
    const closes = (result.indicators.quote?.[0]?.close ?? [])
      .filter((n): n is number => typeof n === "number")
      .slice(-24);
    return closes.length >= 2 ? closes : null;
  } catch {
    return null;
  }
}

export async function getSparks(
  symbols: string[]
): Promise<Record<string, number[]>> {
  const unique = Array.from(new Set(symbols)).slice(0, 60);
  const entries = await Promise.all(
    unique.map(async (s) => [s, await getSparkForSymbol(s)] as const)
  );
  const out: Record<string, number[]> = {};
  for (const [s, series] of entries) {
    if (series) out[s] = series;
  }
  return out;
}

// ---------- Agregador ----------
export async function getMarket(): Promise<MarketData> {
  const [
    dolares,
    riesgoPais,
    inflacion,
    acciones,
    cedears,
    bonos,
    letras,
    indices,
  ] = await Promise.all([
    getDolares().catch(() => [] as DolarQuote[]),
    getRiesgoPais(),
    getInflacion(),
    getData912("arg_stocks").catch(() => [] as Instrument[]),
    getData912("arg_cedears").catch(() => [] as Instrument[]),
    getData912("arg_bonds").catch(() => [] as Instrument[]),
    getData912("arg_notes").catch(() => [] as Instrument[]),
    getUsIndices().catch(() => [] as Instrument[]),
  ]);

  return {
    dolares,
    riesgoPais,
    inflacion,
    acciones,
    cedears,
    bonos,
    letras,
    indices,
    generatedAt: new Date().toISOString(),
  };
}

// ---------- Ficha de instrumento ----------

export type HistoryRange = "1M" | "6M" | "1A" | "5A";

const RANGE_MAP: Record<HistoryRange, { range: string; interval: string }> = {
  "1M": { range: "1mo", interval: "1d" },
  "6M": { range: "6mo", interval: "1d" },
  "1A": { range: "1y", interval: "1d" },
  "5A": { range: "5y", interval: "1wk" },
};

export interface History {
  t: number[]; // epoch en segundos
  c: number[]; // cierres
}

/** Histórico de precios (Yahoo). Para índices pasar isIndex=true (sin sufijo .BA). */
export async function getHistory(
  symbol: string,
  range: HistoryRange,
  isIndex = false
): Promise<History> {
  const { range: r, interval } = RANGE_MAP[range] ?? RANGE_MAP["6M"];
  const ticker = isIndex ? symbol : `${symbol}.BA`;
  try {
    const data = await fetchJson<YahooChart>(
      `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
        ticker
      )}?interval=${interval}&range=${r}`
    );
    const result = data.chart.result?.[0];
    if (!result || !result.timestamp) return { t: [], c: [] };
    const ts = result.timestamp;
    const closes = result.indicators.quote?.[0]?.close ?? [];
    const t: number[] = [];
    const c: number[] = [];
    for (let i = 0; i < ts.length; i++) {
      const close = closes[i];
      if (typeof close === "number") {
        t.push(ts[i]);
        c.push(close);
      }
    }
    return { t, c };
  } catch {
    return { t: [], c: [] };
  }
}

/** Busca un instrumento puntual reusando el snapshot cacheado de getMarket(). */
export async function getInstrument(
  category: Category,
  symbol: string
): Promise<Instrument | null> {
  const market = await getMarket();
  const pools: Partial<Record<Category, Instrument[]>> = {
    accion: market.acciones,
    cedear: market.cedears,
    bono: market.bonos,
    letra: market.letras,
    indice: market.indices,
  };
  const pool = pools[category] ?? [];
  const up = symbol.toUpperCase();
  return pool.find((i) => i.symbol.toUpperCase() === up) ?? null;
}

// ---------- Noticias (Google News RSS, español) ----------

export interface NewsItem {
  title: string;
  source: string;
  url: string;
  date: string; // ISO
}

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

export async function getNews(
  query: string,
  limit = 8,
  maxAgeDays = 30
): Promise<NewsItem[]> {
  try {
    // when:30d limita a los últimos 30 días desde Google News.
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(
      `${query} when:${maxAgeDays}d`
    )}&hl=es-419&gl=AR&ceid=AR:es-419`;
    const res = await fetch(url, {
      next: { revalidate: 1800 },
      headers: { "User-Agent": "Mozilla/5.0 StockOne/1.0" },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const cutoff = Date.now() - maxAgeDays * 86400000;
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
    return items
      .map((m) => {
        const b = m[1];
        const rawTitle = decodeEntities(
          (b.match(/<title>([\s\S]*?)<\/title>/) || [])[1] ?? ""
        );
        const source = decodeEntities(
          (b.match(/<source[^>]*>([\s\S]*?)<\/source>/) || [])[1] ?? ""
        );
        const link = ((b.match(/<link>([\s\S]*?)<\/link>/) || [])[1] ?? "").trim();
        const pubDate = (b.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] ?? "";
        let title = rawTitle;
        if (source && title.endsWith(` - ${source}`)) {
          title = title.slice(0, -(source.length + 3));
        }
        const ts = pubDate ? new Date(pubDate).getTime() : NaN;
        return {
          title: title.trim(),
          source: source.trim(),
          url: link,
          date: Number.isNaN(ts) ? "" : new Date(ts).toISOString(),
          _ts: ts,
        };
      })
      .filter((n) => n.title && n.url)
      // Respaldo: descartar cualquier item fuera de la ventana de días.
      .filter((n) => Number.isNaN(n._ts) || n._ts >= cutoff)
      .sort((a, b) => (b._ts || 0) - (a._ts || 0))
      .slice(0, limit)
      .map(
        (n): NewsItem => ({
          title: n.title,
          source: n.source,
          url: n.url,
          date: n.date,
        })
      );
  } catch {
    return [];
  }
}

/**
 * Construye la query de noticias con contexto financiero para evitar
 * resultados ambiguos (ej: "MORI" traía a Funes Mori). Se anexan palabras
 * clave de economía/bolsa que sesgan Google News hacia finanzas.
 */
export function newsQueryFor(
  category: Category,
  symbol: string,
  name: string
): string {
  const base = name && name !== symbol ? name : symbol;
  switch (category) {
    case "bono":
    case "letra":
      return `${symbol} bono Argentina deuda cotización`;
    case "indice":
      return `${base} índice bolsa mercado acciones`;
    case "cedear":
      return `${base} CEDEAR acción cotización bolsa`;
    case "accion":
    default:
      return `${base} acción Merval bolsa cotización Argentina`;
  }
}

// ---------- Perfil de empresa (Wikipedia ES) ----------

export interface CompanyProfile {
  title: string;
  industry: string | null;
  extract: string;
  url: string;
  thumbnail: string | null;
}

interface WikiPage {
  title: string;
  missing?: string;
  extract?: string;
  description?: string;
  fullurl?: string;
  thumbnail?: { source: string };
  pageprops?: { disambiguation?: string };
}

interface WikiResponse {
  query?: { pages?: Record<string, WikiPage> };
}

const WIKI_PROPS =
  "prop=extracts%7Cpageimages%7Cinfo%7Cdescription%7Cpageprops&inprop=url" +
  "&exintro=1&explaintext=1&piprop=thumbnail&pithumbsize=200&ppprop=disambiguation";

// Valida que el artículo sea realmente una empresa (y no una ciudad, persona, etc.)
const COMPANY_POS =
  /empresa|compañía|compania|sociedad (an|de|com)|corporaci|banc|holding|financ|aseguradora|multinacional|fabricante|productora|s\.a\.|inc\.|\bcorp\b/;
const COMPANY_NEG =
  /ciudad|localidad|asentamiento|municipio|provincia de|departamento de|película|álbum|banda de|\brío\b|novela|videojuego|selección|\bempresario\b|\bempresaria\b|futbolista|deportista|jugador de|\bactor\b|actriz|cantante|escritor|escritora|periodista|político|abogad|economista|\bnacido\b|\bnacida\b|equipo de fútbol/;

// NEG liviano para el extract (el texto largo menciona lugares legítimamente,
// ej: "…en la provincia de Chubut…", así que no incluimos "provincia de"/"ciudad").
const COMPANY_NEG_LIGHT =
  /asentamiento|\blocalidad\b|\bmunicipio\b|película|álbum|banda de|novela|videojuego|\bempresario\b|\bempresaria\b|futbolista|deportista|\bactor\b|actriz|cantante/;

function firstSentence(s: string): string {
  const m = s.match(/^.*?[.!?](\s|$)/);
  return (m ? m[0] : s).trim();
}

function looksLikeCompany(description?: string, extract?: string): boolean {
  const desc = (description ?? "").trim().toLowerCase();
  // La descripción corta (Wikidata) es el descriptor confiable de qué ES la página.
  if (desc) return COMPANY_POS.test(desc) && !COMPANY_NEG.test(desc);
  // Sin descripción: validamos solo la primera oración del extract con NEG liviano.
  const first = firstSentence(extract ?? "").toLowerCase();
  return COMPANY_POS.test(first) && !COMPANY_NEG_LIGHT.test(first);
}

function toProfile(page: WikiPage): CompanyProfile {
  return {
    title: page.title,
    industry: page.description ?? null,
    extract: page.extract ?? "",
    url:
      page.fullurl ??
      `https://es.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
    thumbnail: page.thumbnail?.source ?? null,
  };
}

async function fetchWiki(queryPart: string): Promise<WikiPage[]> {
  const api = `https://es.wikipedia.org/w/api.php?action=query&format=json&redirects=1&${WIKI_PROPS}&${queryPart}`;
  const res = await fetch(api, {
    next: { revalidate: 86400 },
    headers: {
      "User-Agent": "StockOne/1.0 (dashboard financiero argentino)",
      Accept: "application/json",
    },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as WikiResponse;
  return Object.values(json.query?.pages ?? {});
}

function isValidCompanyPage(page: WikiPage): boolean {
  return (
    !page.missing &&
    page.pageprops?.disambiguation === undefined &&
    !!page.extract &&
    looksLikeCompany(page.description, page.extract)
  );
}

/**
 * Reseña + industria de una empresa desde Wikipedia en español.
 * Estrategia: título exacto primero; si no valida como empresa, un search
 * acotado con guard estricto. Si nada es una empresa confiable → null
 * (mejor no mostrar nada que mostrar info equivocada, ej: Agrometal → Monte Maíz).
 */
export async function getCompanyProfile(
  name: string
): Promise<CompanyProfile | null> {
  if (!name) return null;
  try {
    // Paso 1: título exacto.
    const byTitle = await fetchWiki(`titles=${encodeURIComponent(name)}`);
    const exact = byTitle[0];
    if (exact && isValidCompanyPage(exact)) return toProfile(exact);

    // Paso 2: search acotado, validando que cada candidato sea empresa.
    const bySearch = await fetchWiki(
      `generator=search&gsrlimit=3&gsrsearch=${encodeURIComponent(
        `${name} empresa`
      )}`
    );
    const match = bySearch.find(isValidCompanyPage);
    return match ? toProfile(match) : null;
  } catch {
    return null;
  }
}
