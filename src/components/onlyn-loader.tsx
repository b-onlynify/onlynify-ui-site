"use client";

/**
 * The "onlyn" loader (shared by every Onlynify web app; copied per app like the other shared components).
 *
 *  <OnlynLoader size>     the animated wordmark: letters ripple, a brand gradient sweeps through them, a bar runs under them
 *  <AreaLoader>           centred loader for one content area (a table, a card, a page body) while its data loads
 *  <LoadingOverlay show>  dims an area that already shows data while it refreshes (parent must be `relative`)
 *  <PageLoader>           route-change loader; loading.tsx files render it inside the right layout, so the sidebar /
 *                         header stay and only the area that is changing shows the loader
 *  <ActivityBar>          thin bar at the top of the window while any API request is running (mounted once per app)
 *
 * Styles live in globals.css (".onlyn-ld …"). Respects prefers-reduced-motion.
 */
import { useEffect, useState } from "react";
import { onActivity, startActivity } from "@/lib/activity";

const LETTERS = ["o", "n", "l", "y", "n"];

export function OnlynLoader({ size = "md", label = "Loading", className = "" }: { size?: "sm" | "md" | "lg"; label?: string; className?: string }) {
  return (
    <span className={`onlyn-ld onlyn-${size} ${className}`} role="status" aria-label={label}>
      <span className="onlyn-word" aria-hidden="true">
        {LETTERS.map((l, i) => (
          <span key={i} className="onlyn-l" style={{ "--i": i } as React.CSSProperties}>
            {l}
          </span>
        ))}
        <span className="onlyn-dot" />
      </span>
      <span className="onlyn-bar" aria-hidden="true" />
    </span>
  );
}

export function AreaLoader({ label, className = "" }: { label?: string; className?: string }) {
  return (
    <div className={`onlyn-area ${className}`}>
      <OnlynLoader size="md" label={label ?? "Loading"} />
      {label && <span className="onlyn-caption">{label}</span>}
    </div>
  );
}

export function LoadingOverlay({ show, label = "Refreshing" }: { show: boolean; label?: string }) {
  if (!show) return null;
  return (
    <div className="onlyn-overlay">
      <OnlynLoader size="sm" label={label} />
    </div>
  );
}

export function PageLoader({ label }: { label?: string }) {
  return (
    <div className="onlyn-page">
      <OnlynLoader size="lg" label={label ?? "Loading"} />
      <span className="onlyn-caption">{label ?? "Loading…"}</span>
    </div>
  );
}

/** For apps that call fetch() directly (no shared axios client): counts same-origin /api/ requests. Patched once. */
function patchFetch() {
  const w = window as unknown as { __onlynFetch?: boolean };
  if (w.__onlynFetch) return;
  w.__onlynFetch = true;
  const orig = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const path = url.startsWith(location.origin) ? url.slice(location.origin.length) : url;
    if (!path.startsWith("/") || !/\/api\//.test(path)) return orig(input, init);
    const done = startActivity();
    try {
      return await orig(input, init);
    } finally {
      done();
    }
  };
}

export function ActivityBar({ watchFetch = false }: { watchFetch?: boolean }) {
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (watchFetch) patchFetch();
    let t: ReturnType<typeof setTimeout> | undefined;
    const off = onActivity((n) => {
      clearTimeout(t);
      if (n > 0) t = setTimeout(() => setBusy(true), 200);
      else setBusy(false);
    });
    return () => {
      clearTimeout(t);
      off();
    };
  }, [watchFetch]);
  return <div className={`onlyn-activity${busy ? " on" : ""}`} role="progressbar" aria-hidden={!busy} aria-label="Working" />;
}
