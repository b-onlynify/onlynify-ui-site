"use client";

import { useEffect, useState, type JSX } from "react";

type ChartProps = JSX.IntrinsicElements["onl-chart"];

/**
 * <onl-chart> mounted after hydration. The web component draws its own SVG into itself; if that happens before
 * React hydrates the page, React finds children it didn't render and throws a hydration error. Until mount, a
 * placeholder of the same height keeps the layout steady.
 */
export function Chart(props: ChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (mounted) return <onl-chart {...props} />;
  const type = (props as { type?: string }).type;
  const h = Number((props as { height?: string | number }).height) || (type === "sparkline" ? 36 : type === "gauge" ? 180 : type === "donut" ? 220 : 240);
  return <div aria-hidden="true" style={{ minHeight: h }} />;
}
