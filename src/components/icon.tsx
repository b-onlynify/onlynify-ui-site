import icons from "../../registry/icons.json";

const ICONS = icons as Record<string, { attrs: string; body: string }>;

/** Inline SVG icon from the Onlynify UI sprite (no icon package). */
export function Icon({ name, size = 16, className }: { name: string; size?: number; className?: string }) {
  const i = ICONS[name];
  if (!i) return null;
  const attr = (k: string) => i.attrs.match(new RegExp(`${k}="([^"]*)"`))?.[1];
  return (
    <svg
      width={size}
      height={size}
      viewBox={attr("viewBox") ?? "0 0 24 24"}
      fill={attr("fill") ?? "none"}
      stroke={attr("stroke")}
      strokeWidth={attr("stroke-width")}
      strokeLinecap={attr("stroke-linecap") as "round" | undefined}
      strokeLinejoin={attr("stroke-linejoin") as "round" | undefined}
      className={className}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: i.body }}
    />
  );
}
