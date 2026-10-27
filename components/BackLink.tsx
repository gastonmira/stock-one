"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { LISTING_URL_KEY } from "@/lib/listing";

function readListingUrl(): string {
  try {
    const url = sessionStorage.getItem(LISTING_URL_KEY);
    // Solo rutas propias del listado ("/" o "/?…").
    if (url && /^\/(\?|$)/.test(url)) return url;
  } catch {}
  return "/";
}

const noSubscribe = () => () => {};

/** "← Volver" al listado con la categoría, página, orden y búsqueda de origen. */
export function BackLink() {
  const href = useSyncExternalStore(noSubscribe, readListingUrl, () => "/");
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-text-dim transition hover:text-text"
    >
      ← Volver
    </Link>
  );
}
