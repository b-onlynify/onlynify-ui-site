"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Motion kit (no dependencies, shared by every Onlyn.ify app):
 *   <FloatingShapes/>  drifting circles, rings, triangles, squares, plus signs and dots; parallax with the pointer;
 *                      optionally draggable (grab a shape, throw it somewhere else)
 *   <HeroBanner/>      animated gradient header with floating shapes (dashboards)
 *   <Celebration/>     "Congratulations" pop-up with a confetti burst
 * Styles live in globals.css (classes mo-*). Everything stops under prefers-reduced-motion.
 */

type Kind = "circle" | "ring" | "triangle" | "square" | "plus" | "dots" | "squiggle" | "hexagon";
type Spec = { k: Kind; x: number; y: number; s: number; d: number; t: number; delay: number; r: number; o: number };

// Fixed layout (deterministic, so server and client render the same markup).
const SHAPES: Spec[] = [
  { k: "circle", x: 8, y: 14, s: 64, d: 18, t: 16, delay: 0, r: 0, o: 0.22 },
  { k: "triangle", x: 78, y: 10, s: 70, d: 30, t: 19, delay: -4, r: 12, o: 0.3 },
  { k: "ring", x: 62, y: 62, s: 110, d: 12, t: 22, delay: -8, r: 0, o: 0.28 },
  { k: "square", x: 20, y: 70, s: 44, d: 26, t: 15, delay: -2, r: 18, o: 0.3 },
  { k: "plus", x: 46, y: 22, s: 34, d: 40, t: 13, delay: -6, r: 0, o: 0.4 },
  { k: "dots", x: 86, y: 44, s: 80, d: 10, t: 24, delay: -3, r: 0, o: 0.35 },
  { k: "hexagon", x: 34, y: 46, s: 52, d: 22, t: 18, delay: -10, r: 8, o: 0.22 },
  { k: "squiggle", x: 6, y: 42, s: 90, d: 16, t: 21, delay: -5, r: -8, o: 0.32 },
  { k: "circle", x: 90, y: 82, s: 28, d: 44, t: 12, delay: -7, r: 0, o: 0.4 },
  { k: "triangle", x: 52, y: 86, s: 36, d: 34, t: 17, delay: -9, r: -20, o: 0.35 },
  { k: "ring", x: 24, y: 6, s: 40, d: 38, t: 14, delay: -1, r: 0, o: 0.35 },
  { k: "square", x: 70, y: 32, s: 22, d: 48, t: 11, delay: -12, r: 30, o: 0.45 },
  { k: "plus", x: 12, y: 88, s: 26, d: 28, t: 16, delay: -11, r: 0, o: 0.4 },
  { k: "circle", x: 40, y: 64, s: 14, d: 52, t: 10, delay: -4, r: 0, o: 0.55 },
];

function Shape({ k }: { k: Kind }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (k) {
    case "circle":
      return <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="currentColor" /></svg>;
    case "ring":
      return <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" {...common} strokeWidth={6} /></svg>;
    case "triangle":
      return <svg viewBox="0 0 100 100"><path d="M50 8 94 88H6Z" {...common} strokeWidth={6} /></svg>;
    case "square":
      return <svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" rx="16" fill="currentColor" /></svg>;
    case "plus":
      return <svg viewBox="0 0 100 100"><path d="M50 10v80M10 50h80" {...common} strokeWidth={14} /></svg>;
    case "hexagon":
      return <svg viewBox="0 0 100 100"><path d="M50 4 90 27v46L50 96 10 73V27Z" {...common} strokeWidth={6} /></svg>;
    case "squiggle":
      return <svg viewBox="0 0 120 40"><path d="M4 20c10-16 20-16 28 0s18 16 28 0 18-16 28 0 18 16 28 0" {...common} strokeWidth={6} /></svg>;
    case "dots":
      return (
        <svg viewBox="0 0 100 100" fill="currentColor">
          {Array.from({ length: 16 }, (_, i) => <circle key={i} cx={14 + (i % 4) * 24} cy={14 + Math.floor(i / 4) * 24} r="5" />)}
        </svg>
      );
  }
}

export function FloatingShapes({ draggable = false, count = SHAPES.length, className = "", tone = "light" }: { draggable?: boolean; count?: number; className?: string; tone?: "light" | "brand" | "muted" }) {
  const root = useRef<HTMLDivElement>(null);
  const [moved, setMoved] = useState<Record<number, { x: number; y: number }>>({});
  const drag = useRef<{ i: number; sx: number; sy: number; ox: number; oy: number } | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);

  // Pointer parallax: one rAF-throttled listener writes --mx / --my (−1…1) on the container.
  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", (((e.clientX - r.left) / Math.max(1, r.width)) * 2 - 1).toFixed(3));
        el.style.setProperty("--my", (((e.clientY - r.top) / Math.max(1, r.height)) * 2 - 1).toFixed(3));
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => (cancelAnimationFrame(raf), window.removeEventListener("pointermove", onMove));
  }, []);

  const down = useCallback(
    (i: number) => (e: React.PointerEvent) => {
      if (!draggable) return;
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      const cur = moved[i] ?? { x: 0, y: 0 };
      drag.current = { i, sx: e.clientX, sy: e.clientY, ox: cur.x, oy: cur.y };
      setDragging(i);
    },
    [draggable, moved],
  );
  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    setMoved((m) => ({ ...m, [d.i]: { x: d.ox + e.clientX - d.sx, y: d.oy + e.clientY - d.sy } }));
  };
  const up = () => {
    drag.current = null;
    setDragging(null);
  };

  return (
    <div ref={root} aria-hidden className={`mo-shapes mo-tone-${tone} ${draggable ? "mo-shapes-drag" : ""} ${className}`}>
      {SHAPES.slice(0, count).map((s, i) => (
        <div
          key={i}
          className={`mo-shape ${dragging === i ? "mo-grabbing" : ""}`}
          onPointerDown={down(i)}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          style={
            {
              "--x": `${s.x}%`,
              "--y": `${s.y}%`,
              "--s": `${s.s}px`,
              "--d": s.d,
              "--t": `${s.t}s`,
              "--delay": `${s.delay}s`,
              "--r0": `${s.r}deg`,
              "--gx": `${moved[i]?.x ?? 0}px`,
              "--gy": `${moved[i]?.y ?? 0}px`,
              opacity: s.o,
            } as CSSProperties
          }
        >
          <div className="mo-shape-inner">
            <Shape k={s.k} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Animated gradient header with floating shapes, for dashboards. */
export function HeroBanner({ title, subtitle, eyebrow, actions, children }: { title: ReactNode; subtitle?: ReactNode; eyebrow?: ReactNode; actions?: ReactNode; children?: ReactNode }) {
  return (
    <section className="mo-hero mo-rise relative mb-6 overflow-hidden rounded-2xl px-5 py-6 text-white shadow-lg sm:px-7 sm:py-8">
      <FloatingShapes count={10} />
      <div className="relative z-[1] flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && <p className="text-xs font-medium tracking-wide text-white/75 uppercase">{eyebrow}</p>}
          <h1 className="mo-wave mt-1 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-white/80">{subtitle}</p>}
          {children}
        </div>
        {actions && <div className="mo-hero-actions flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ celebration */
const CONFETTI = ["#ff5d8f", "#ffd23f", "#3ecf8e", "#4f8cff", "#a66cff", "#ff8a3d", "#00c2d1"];

function Confetti({ pieces = 90 }: { pieces?: number }) {
  // Deterministic pseudo-random spread so re-renders don't reshuffle the burst.
  const rnd = (i: number, k: number) => {
    const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  return (
    <div className="mo-confetti" aria-hidden>
      {Array.from({ length: pieces }, (_, i) => {
        const angle = rnd(i, 1) * Math.PI * 2;
        const dist = 160 + rnd(i, 2) * 320;
        return (
          <i
            key={i}
            style={
              {
                "--dx": `${Math.cos(angle) * dist}px`,
                "--dy": `${Math.sin(angle) * dist * 0.75 + 220}px`,
                "--rot": `${Math.round(rnd(i, 3) * 900 - 450)}deg`,
                "--delay": `${Math.round(rnd(i, 4) * 220)}ms`,
                "--dur": `${1100 + Math.round(rnd(i, 5) * 900)}ms`,
                background: CONFETTI[i % CONFETTI.length],
                width: `${6 + Math.round(rnd(i, 6) * 6)}px`,
                height: `${8 + Math.round(rnd(i, 7) * 10)}px`,
                borderRadius: i % 3 === 0 ? "999px" : "2px",
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}

/** "Congratulations" pop-up with confetti. Closes on the button, Escape or a click outside. */
export function Celebration({ open, title, message, cta = "Let's go", onClose, children }: { open: boolean; title: string; message?: ReactNode; cta?: string; onClose: () => void; children?: ReactNode }) {
  const btn = useRef<HTMLButtonElement>(null);
  const [burst, setBurst] = useState(0);
  useEffect(() => {
    if (!open) return;
    btn.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="mo-celebrate fixed inset-0 z-[100] grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="mo-celebrate-title" onClick={onClose}>
      <div className="mo-backdrop absolute inset-0" />
      <Confetti key={burst} />
      <div className="mo-pop relative w-full max-w-md overflow-hidden rounded-3xl p-7 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <FloatingShapes count={7} tone="brand" />
        <div className="relative z-[1]">
          <button type="button" aria-label="Celebrate again" onClick={() => setBurst((b) => b + 1)} className="mo-trophy mx-auto grid size-20 place-items-center rounded-full">
            <svg viewBox="0 0 64 64" className="size-11" aria-hidden>
              <path d="M8 56 22 18l24 24Z" fill="#ffd23f" />
              <path d="M8 56 22 18l6 6-12 28Z" fill="#ff8a3d" />
              <circle cx="44" cy="12" r="3" fill="#ff5d8f" />
              <circle cx="54" cy="24" r="2.5" fill="#4f8cff" />
              <path d="M34 14c4-6 10-6 12-2M44 30c6-2 12 0 12 6" fill="none" stroke="#3ecf8e" strokeWidth="3" strokeLinecap="round" />
              <path d="M30 6l2 4M52 40l4 2M38 22l3-1" stroke="#a66cff" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </button>
          <h2 id="mo-celebrate-title" className="mo-shine mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h2>
          {message && <div className="mo-celebrate-text mt-2 text-sm">{message}</div>}
          {children}
          <button ref={btn} type="button" onClick={onClose} className="mo-cta mt-6 inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold">
            {cta}
          </button>
        </div>
      </div>
    </div>
  );
}
