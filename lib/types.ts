export type Category = "dolar" | "accion" | "cedear" | "bono" | "letra" | "indice";

export interface Instrument {
  id: string; // `${category}:${symbol}`
  symbol: string;
  name: string;
  category: Category;
  price: number;
  changePct: number | null;
  /** Cierre de la sesión anterior, de la misma fuente que price/changePct. */
  prevClose?: number | null;
  currency: "ARS" | "USD";
  extra?: Record<string, number | string | null>;
  updatedAt?: string;
  spark?: number[];
}

export interface DolarQuote {
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

export interface RiesgoPais {
  valor: number;
  fecha: string;
}

export interface MarketData {
  dolares: DolarQuote[];
  riesgoPais: RiesgoPais | null;
  inflacion: number | null; // último valor mensual
  indices: Instrument[];
  acciones: Instrument[];
  cedears: Instrument[];
  bonos: Instrument[];
  letras: Instrument[];
  commodities: Instrument[];
  generatedAt: string;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  dolar: "Dólares",
  accion: "Acciones",
  cedear: "CEDEARs",
  bono: "Bonos",
  letra: "Letras",
  indice: "Índices USA",
};
