"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Coords = { top: number; left: number };

export function InfoButton({
  description,
  label,
}: {
  description: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);

  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPointer = useRef<string>("mouse");

  useEffect(() => setMounted(true), []);

  const clearClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const openNow = () => {
    clearClose();
    setOpen(true);
  };
  const scheduleClose = () => {
    clearClose();
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  // Posiciona el popover anclado al botón (con flip arriba/abajo y clamp al viewport).
  useLayoutEffect(() => {
    if (!open || !btnRef.current || !popRef.current) return;
    const anchor = btnRef.current.getBoundingClientRect();
    const pop = popRef.current.getBoundingClientRect();
    const m = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = anchor.left;
    left = Math.min(left, vw - pop.width - m);
    left = Math.max(m, left);

    let top = anchor.bottom + m;
    if (top + pop.height > vh - m) {
      const above = anchor.top - pop.height - m;
      top = above >= m ? above : Math.max(m, vh - pop.height - m);
    }

    setCoords({ top, left });
  }, [open]);

  // Cierra con Escape, al scrollear, y con tap/click afuera (mobile).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onScroll = () => setOpen(false);
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    document.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={`Qué es ${label}`}
        onPointerDown={(e) => {
          lastPointer.current = e.pointerType;
        }}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") openNow();
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") scheduleClose();
        }}
        onClick={() => {
          // En desktop manda el hover; con touch/pen el tap abre y cierra.
          if (lastPointer.current !== "mouse") setOpen((o) => !o);
        }}
        className="shrink-0 rounded-full p-0.5 text-text-mute transition hover:bg-white/5 hover:text-brand"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path
            d="M12 11v5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="12" cy="7.75" r="1.15" fill="currentColor" />
        </svg>
      </button>

      {open &&
        mounted &&
        createPortal(
          <div
            ref={popRef}
            role="tooltip"
            onPointerEnter={(e) => {
              if (e.pointerType === "mouse") openNow();
            }}
            onPointerLeave={(e) => {
              if (e.pointerType === "mouse") scheduleClose();
            }}
            style={{
              position: "fixed",
              top: coords?.top ?? 0,
              left: coords?.left ?? 0,
              visibility: coords ? "visible" : "hidden",
            }}
            className="fadein z-50 w-72 max-w-[calc(100vw-16px)] rounded-2xl border border-border bg-bg-elev/95 p-4 shadow-xl backdrop-blur"
          >
            <p className="text-sm leading-relaxed text-text-dim">
              {description}
            </p>
          </div>,
          document.body
        )}
    </>
  );
}
