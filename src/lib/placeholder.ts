/** Generated SVG placeholder images, so demos need no image files or network. */
export function placeholderSrc(label: string, hue: number | string) {
  const h = Number(hue) || 210;
  const safe = label.replace(/[<&"]/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h} 70% 62%)"/><stop offset="1" stop-color="hsl(${(h + 40) % 360} 75% 42%)"/></linearGradient></defs><rect width="600" height="450" fill="url(#g)"/><circle cx="470" cy="90" r="120" fill="#fff" opacity=".12"/><circle cx="90" cy="400" r="160" fill="#000" opacity=".08"/><text x="40" y="410" font-family="system-ui,Segoe UI,sans-serif" font-size="34" font-weight="700" fill="#fff">${safe}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** `data-ph="Label|hue"` → `src="data:…"` for live previews. */
export const fillPlaceholders = (html: string) => html.replace(/ data-ph="([^"|]+)\|(\d+)"/g, (_, label: string, hue: string) => ` src="${placeholderSrc(label, hue)}"`);
