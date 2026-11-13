import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/** Origins the hosted payment checkout loads from (see src/lib/gateway-client.ts). */
const GATEWAY_ORIGINS = { script: "https://checkout.razorpay.com", api: "https://*.razorpay.com", frames: "https://api.razorpay.com https://checkout.razorpay.com" };

/**
 * Pro previews (/preview/pro/*) may also be embedded by the kit's style guide, which shows the Pro gallery.
 * STYLEGUIDE_ORIGIN is one origin such as https://styleguide.onlynify.com; in development it defaults to
 * http://localhost:3500. Anything that isn't a plain http(s) origin is ignored. Every other page stays same-origin only.
 */
const styleguideRaw = process.env.STYLEGUIDE_ORIGIN ?? (isDev ? "http://localhost:3500" : "");
const STYLEGUIDE_ORIGIN = /^https?:\/\/[a-z0-9.-]+(:\d{2,5})?$/i.test(styleguideRaw) ? styleguideRaw : "";

const policy = (frameAncestors: string) => [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${GATEWAY_ORIGINS.script}${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  `connect-src 'self' ${GATEWAY_ORIGINS.api}${isDev ? " ws:" : ""}`,
  `frame-src 'self' ${GATEWAY_ORIGINS.frames}`,
  `frame-ancestors ${frameAncestors}`,
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");
const csp = policy("'self'");
const previewCsp = policy(STYLEGUIDE_ORIGIN ? `'self' ${STYLEGUIDE_ORIGIN}` : "'self'");
const common = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: `camera=(), microphone=(), geolocation=(), payment=(self "${GATEWAY_ORIGINS.script}")` },
];

const config: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || (process.env.npm_lifecycle_event === "dev" || process.argv.includes("dev") ? ".next-dev" : ".next"),
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ["onlynify-ui"],
  outputFileTracingIncludes: { "/**": ["./registry/**/*"] },
  async headers() {
    return [
      // Everything except Pro previews: same-origin framing only.
      { source: "/:path((?!preview/pro/).*)", headers: [{ key: "Content-Security-Policy", value: csp }, { key: "X-Frame-Options", value: "SAMEORIGIN" }, ...common] },
      // Pro previews: also embeddable by the style guide (CSP frame-ancestors; X-Frame-Options can't list another origin).
      { source: "/preview/pro/:slug*", headers: [{ key: "Content-Security-Policy", value: previewCsp }, ...common] },
      { source: "/api/registry/:path*", headers: [{ key: "Access-Control-Allow-Origin", value: "*" }] },
    ];
  },
};

export default config;
