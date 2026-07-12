"use client";

import { useEffect, useRef, useState } from "react";
import type { Category } from "@/lib/types";
import { getCachedSpark, requestSpark } from "@/lib/spark-client";
import { Sparkline } from "./Sparkline";

// Solo acciones y CEDEARs tienen histórico en Yahoo (.BA)
const SUPPORTED: Category[] = ["accion", "cedear"];

export function SparkCell({
  symbol,
  category,
  up,
}: {
  symbol: string;
  category: Category;
  up: boolean;
}) {
  const supported = SUPPORTED.includes(category);
  const [series, setSeries] = useState<number[] | null | undefined>(() =>
    supported ? getCachedSpark(symbol) : null
  );
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!supported || series !== undefined) return;
    const el = ref.current;
    if (!el) return;

    let unsub: (() => void) | undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          unsub = requestSpark(symbol, (s) => setSeries(s));
        }
      },
      { rootMargin: "120px" }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      unsub?.();
    };
  }, [symbol, supported, series]);

  if (!supported) {
    return <span className="text-text-mute">—</span>;
  }

  return (
    <div ref={ref} className="flex h-[28px] w-[92px] items-center justify-end">
      {series === undefined ? (
        <div className="skeleton h-3 w-[70px] rounded" />
      ) : series && series.length > 1 ? (
        <Sparkline data={series} up={up} width={92} height={26} />
      ) : (
        <span className="text-text-mute">—</span>
      )}
    </div>
  );
}
