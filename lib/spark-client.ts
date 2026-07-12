// Carga perezosa + batched de sparklines para filas visibles.
// Cache a nivel de módulo: no re-pide al reordenar o cambiar de tab.

type Series = number[] | null; // null = ya consultado, sin datos

const cache = new Map<string, Series>();
const subscribers = new Map<string, Set<(s: Series) => void>>();
const pending = new Set<string>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const CHUNK = 40;

function notify(symbol: string, series: Series) {
  cache.set(symbol, series);
  subscribers.get(symbol)?.forEach((cb) => cb(series));
}

async function flush() {
  flushTimer = null;
  const batch = Array.from(pending).slice(0, CHUNK);
  batch.forEach((s) => pending.delete(s));
  if (batch.length === 0) return;

  try {
    const res = await fetch(`/api/spark?symbols=${batch.join(",")}`, {
      cache: "force-cache",
    });
    const data: Record<string, number[]> = res.ok ? await res.json() : {};
    for (const symbol of batch) {
      notify(symbol, data[symbol] ?? null);
    }
  } catch {
    for (const symbol of batch) notify(symbol, null);
  }

  if (pending.size > 0 && !flushTimer) {
    flushTimer = setTimeout(flush, 60);
  }
}

function scheduleFlush() {
  if (!flushTimer) flushTimer = setTimeout(flush, 80);
}

export function getCachedSpark(symbol: string): Series | undefined {
  return cache.get(symbol);
}

/** Pide la serie de un símbolo. Devuelve una función para desuscribirse. */
export function requestSpark(
  symbol: string,
  cb: (s: Series) => void
): () => void {
  const cached = cache.get(symbol);
  if (cached !== undefined) {
    cb(cached);
    return () => {};
  }
  let set = subscribers.get(symbol);
  if (!set) {
    set = new Set();
    subscribers.set(symbol, set);
  }
  set.add(cb);

  if (!pending.has(symbol)) {
    pending.add(symbol);
    scheduleFlush();
  }

  return () => {
    set?.delete(cb);
  };
}
