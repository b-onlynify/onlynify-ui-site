import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "onlynify-ui/css";
import "./site.css";
import { themeInitScript } from "onlynify-ui";
import { UiInit } from "@/components/client";
import { Icon } from "@/components/icon";
import { currentUser } from "@/lib/auth.ts";
import { ActivityBar } from "@/components/onlyn-loader";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3600"),
  title: { default: "Onlynify UI · Components for Angular, React, Vue and HTML", template: "%s · Onlynify UI" },
  description: "An open-source, zero-dependency UI kit and design system with buttons, cards, charts, forms, tables and premium blocks. Works in Angular, React, Vue and plain HTML.",
  icons: { icon: "/ui/assets/mark.svg" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#07090f" },
  ],
};

const NAV = [
  { href: "/docs/introduction", label: "Docs" },
  { href: "/docs/icons", label: "Icons" },
  { href: "/docs/components", label: "Components" },
  { href: "/pro", label: "Pro" },
  { href: "/blocks", label: "Blocks" },
  { href: "/sites", label: "Sites" },
  { href: "/themes", label: "Themes" },
  { href: "/pricing", label: "Pricing" },
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <UiInit />
        <header className="onl-navbar">
          <div className="onl-container onl-container--xl site-header__inner">
            <Link href="/" className="site-logo site-plain">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo-light.png" alt="Onlynify" className="onl-logo-light" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo-dark.png" alt="Onlynify" className="onl-logo-dark" />
              <span className="onl-badge onl-badge--brand">UI</span>
            </Link>
            <nav className="onl-navbar__links" aria-label="Main">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="onl-navbar__link">
                  {n.label}
                </Link>
              ))}
            </nav>
            <div className="site-header__actions">
              <button type="button" className="onl-btn onl-btn--ghost onl-btn--icon" data-onl-theme="toggle" aria-label="Toggle theme">
                <Icon name="sun" />
              </button>
              {user ? (
                <Link href="/account" className="onl-btn onl-btn--sm">
                  <span className="onl-avatar onl-avatar--xs" style={{ ["--hue" as string]: 210 }}>
                    {user.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="site-hide-xs">Account</span>
                </Link>
              ) : (
                <Link href="/login" className="onl-btn onl-btn--ghost onl-btn--sm">
                  Sign in
                </Link>
              )}
              <Link href="/pricing" className="onl-btn onl-btn--brand onl-btn--sm site-hide-xs">
                Get Pro
              </Link>
            </div>
          </div>
          <nav className="site-mobile-nav" aria-label="Main (mobile)">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="onl-navbar__link" style={{ flex: "none" }}>
                {n.label}
              </Link>
            ))}
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="onl-container onl-container--xl onl-row onl-row--between">
            <span>
              Built with Onlynify UI. The core kit is MIT licensed, so you can use it free in any project.
            </span>
            <span className="onl-row" style={{ ["--onl-gap" as string]: "16px" }}>
              <Link href="/terms">Terms</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/docs/license">License</Link>
              <Link href="/docs/cli">CLI</Link>
              <Link href="/pricing">Pricing</Link>
            </span>
          </div>
        </footer>
        <ActivityBar watchFetch />
      </body>
    </html>
  );
}
