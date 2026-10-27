import { useSyncExternalStore } from "react";
import type { Category } from "./types";

// Estado del listado de la portada (categoría, página, orden y búsqueda) en la
// URL, para que volver desde una ficha, el botón Atrás y una recarga muestren lo
// mismo: /?cat=bono&pag=2&orden=precio&dir=asc&q=ggal

export type SortKey = "symbol" | "price" | "changePct" | "volumen";

export interface ListingState {
  cat: Category;
  page: number; // 0-based
  sort: SortKey;
  asc: boolean;
  q: string;
}

/** Dirección por defecto al elegir una columna: A→Z para símbolos, mayor primero para números. */
export function defaultAsc(sort: SortKey): boolean {
  return sort === "symbol";
}

export const LISTING_TABS: Category[] = [
  "accion",
  "cedear",
  "bono",
  "letra",
  "indice",
];

const DEFAULT: ListingState = {
  cat: "accion",
  page: 0,
  sort: "volumen",
  asc: defaultAsc("volumen"),
  q: "",
};

const SORT_PARAM: Record<SortKey, string> = {
  symbol: "simbolo",
  price: "precio",
  changePct: "variacion",
  volumen: "volumen",
};

export function parseListing(search: string): ListingState {
  const p = new URLSearchParams(search);
  const cat = LISTING_TABS.find((t) => t === p.get("cat")) ?? DEFAULT.cat;
  const pag = Number(p.get("pag"));
  const sort =
    (Object.keys(SORT_PARAM) as SortKey[]).find(
      (k) => SORT_PARAM[k] === p.get("orden")
    ) ?? DEFAULT.sort;
  const dir = p.get("dir");
  return {
    cat,
    page: Number.isInteger(pag) && pag > 1 ? pag - 1 : 0,
    sort,
    asc: dir === "asc" ? true : dir === "desc" ? false : defaultAsc(sort),
    q: p.get("q") ?? "",
  };
}

/** Query string del estado; omite los valores por defecto. */
export function listingSearch(s: ListingState): string {
  const p = new URLSearchParams();
  if (s.cat !== DEFAULT.cat) p.set("cat", s.cat);
  if (s.page > 0) p.set("pag", String(s.page + 1));
  if (s.sort !== DEFAULT.sort || s.asc !== DEFAULT.asc) {
    p.set("orden", SORT_PARAM[s.sort]);
    p.set("dir", s.asc ? "asc" : "desc");
  }
  if (s.q) p.set("q", s.q);
  const str = p.toString();
  return str ? `?${str}` : "";
}

const CHANGE_EVENT = "stockone-listing-change";
/** sessionStorage: última URL del listado, para el "← Volver" de las fichas. */
export const LISTING_URL_KEY = "stockone-listing-url";

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/** location.search; vacío en el servidor y durante la hidratación. */
export function useLocationSearch(): string {
  return useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => ""
  );
}

/**
 * Aplica un cambio al estado del listado reemplazando la entrada del historial
 * (sin navegar ni pedir datos al servidor). Lee la URL actual en el momento de
 * la llamada, así se puede usar desde handlers registrados una sola vez.
 */
export function updateListing(patch: Partial<ListingState>) {
  const next = { ...parseListing(window.location.search), ...patch };
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${listingSearch(next)}`
  );
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
