import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/client";
import { LoginScene } from "@/components/login-scene";
import { currentUser } from "@/lib/auth.ts";
import { googleEnabled } from "@/lib/google.ts";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

const safeNext = (n?: string) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/account");

const FEATURES = [
  ["◧", "Components for every framework", "Plain CSS and Web Components that work in React, Vue, Angular or plain HTML."],
  ["✦", "Premium blocks & full sites", "Copy-paste sections and complete multi-page sites, ready to ship."],
  ["◐", "Themes you control", "Brand presets, styles and densities, saved to your account."],
  ["⌘", "One-line installs", "Pull any block into your project with the CLI and your licence key."],
] as const;

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; mode?: string; error?: string }> }) {
  const { next, mode, error } = await searchParams;
  if (await currentUser()) redirect(safeNext(next));
  return (
    <div className="login-split">
      <section className="login-hero mo-hero" aria-label="About Onlyn.ify UI">
        <div style={{ position: "relative", zIndex: 1, maxWidth: 480 }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.85 }}>Onlyn.ify UI</p>
          <h2 style={{ fontSize: "clamp(28px, 3vw, 40px)", lineHeight: 1.15, fontWeight: 650, marginTop: 12 }}>Build polished interfaces in minutes, not weeks.</h2>
          <p style={{ marginTop: 14, opacity: 0.88, fontSize: 16 }}>One account for your licences, premium blocks, full sites and saved themes.</p>
          <LoginScene scene="ui" className="login-scene-hero" />
          <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0", display: "grid", gap: 18 }}>
            {FEATURES.map(([icon, title, text]) => (
              <li key={title} style={{ display: "flex", gap: 14 }}>
                <span aria-hidden style={{ flex: "none", display: "grid", placeItems: "center", width: 38, height: 38, borderRadius: 12, background: "rgb(255 255 255 / 0.16)", fontSize: 16 }}>{icon}</span>
                <span>
                  <strong style={{ display: "block", fontSize: 14 }}>{title}</strong>
                  <span style={{ display: "block", fontSize: 14, opacity: 0.82 }}>{text}</span>
                </span>
              </li>
            ))}
          </ul>
          <dl style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 40, paddingTop: 24, borderTop: "1px solid rgb(255 255 255 / 0.22)" }}>
            {[
              ["MIT", "Core kit"],
              ["4", "Frameworks"],
              ["0", "Dependencies"],
            ].map(([v, l]) => (
              <div key={l}>
                <dt style={{ fontSize: 12, opacity: 0.75 }}>{l}</dt>
                <dd style={{ margin: 0, fontSize: 24, fontWeight: 650 }}>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p style={{ position: "relative", zIndex: 1, fontSize: 12, opacity: 0.75 }}>Secure sessions · Scrypt-hashed passwords · Your data stays yours</p>
      </section>
      <section className="login-panel">
        <LoginScene scene="ui" className="login-scene-mobile" />
        <div className="mo-rise" style={{ position: "relative", zIndex: 1, width: "100%", display: "grid", placeItems: "center" }}>
          <AuthForm next={safeNext(next)} initialMode={mode === "signup" ? "signup" : "signin"} google={googleEnabled()} error={error} />
        </div>
      </section>
    </div>
  );
}
