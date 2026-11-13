"use client";

import { useEffect, useMemo, useState } from "react";
import { init, toast } from "onlynify-ui";
import type { CodeFile } from "@/lib/convert";
import { CHECKOUT_FAILED_EVENT, loadCheckout } from "@/lib/gateway-client";

/** Registers <onl-chart> and the delegated behaviours once. */
export function UiInit() {
  useEffect(() => init(), []);
  return null;
}

export function CopyButton({ text, label = "Copy", className = "onl-btn onl-btn--ghost onl-btn--sm" }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          toast({ kind: "error", title: "Couldn't copy", text: "Select the text and copy it manually." });
        }
      }}
    >
      {done ? "Copied" : label}
    </button>
  );
}

export function CodeBlock({ code, title }: { code: string; title?: string }) {
  return (
    <div className={`site-code${title ? "" : " site-code--bare"}`}>
      {title ? (
        <div className="site-code__bar">
          <span>{title}</span>
          <CopyButton text={code} />
        </div>
      ) : (
        <span className="site-code__copy">
          <CopyButton text={code} />
        </span>
      )}
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

const FW_LABEL: Record<string, string> = { html: "HTML", react: "React", vue: "Vue", angular: "Angular", "react-native": "React Native" };

function readPref(): string {
  try {
    return localStorage.getItem("onl-site-fw") || "html";
  } catch {
    return "html";
  }
}

/** Framework tabs. The chosen framework is remembered across demos and pages. */
export function FrameworkCode({ files }: { files: Record<string, CodeFile[]> }) {
  const [fw, setFw] = useState("html");
  useEffect(() => {
    setFw(readPref());
    const on = (e: Event) => setFw((e as CustomEvent<string>).detail);
    window.addEventListener("onl-site-fw", on);
    return () => window.removeEventListener("onl-site-fw", on);
  }, []);
  const pick = (v: string) => {
    try {
      localStorage.setItem("onl-site-fw", v);
    } catch {
      /* private mode */
    }
    window.dispatchEvent(new CustomEvent("onl-site-fw", { detail: v }));
  };
  const active = files[fw] ? fw : "html";
  return (
    <>
      <div className="site-demo__tabs">
        <div className="onl-tabs" role="tablist" aria-label="Framework" style={{ border: 0 }}>
          {Object.keys(files).map((k) => (
            <button key={k} type="button" role="tab" className="onl-tab" aria-selected={k === active} onClick={() => pick(k)}>
              {FW_LABEL[k] ?? k}
            </button>
          ))}
        </div>
        <span className="onl-text-xs onl-text-muted site-hide-xs">{files[active][0].path}</span>
      </div>
      {files[active].map((f) => (
        <CodeBlock key={f.path} code={f.content} />
      ))}
    </>
  );
}

/** Live preview + collapsible code for one documentation demo. */
export function Demo({ html, muted, files }: { html: string; muted?: boolean; files: Record<string, CodeFile[]> }) {
  const [show, setShow] = useState(false);
  return (
    <div className="site-demo">
      <div className={`site-demo__preview${muted ? " site-demo__preview--muted" : ""}`} dangerouslySetInnerHTML={{ __html: html }} />
      <div className="site-demo__code">
        <button type="button" className="onl-btn onl-btn--ghost onl-btn--sm" style={{ margin: 6 }} aria-expanded={show} onClick={() => setShow((s) => !s)}>
          {show ? "Hide code" : "Show code"}
        </button>
        {show && <FrameworkCode files={files} />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ block viewer */
const WIDTHS = { desktop: "100%", tablet: "820px", mobile: "390px" } as const;

export function BlockViewer({
  slug,
  height,
  files,
  locked,
  signedIn,
}: {
  slug: string;
  height: number;
  files: Record<string, CodeFile[]> | null;
  locked: boolean;
  signedIn: boolean;
}) {
  const [view, setView] = useState<"preview" | "code">("preview");
  const [width, setWidth] = useState<keyof typeof WIDTHS>("desktop");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const src = useMemo(() => `/preview/${slug}?theme=${theme}`, [slug, theme]);
  const cli = `npx onlynify-ui add ${slug}`;
  return (
    <div className="site-viewer">
      <div className="site-viewer__bar">
        <div className="onl-tabs onl-tabs--pill" role="tablist" aria-label="View">
          <button type="button" role="tab" className="onl-tab" aria-selected={view === "preview"} onClick={() => setView("preview")}>
            Preview
          </button>
          <button type="button" role="tab" className="onl-tab" aria-selected={view === "code"} onClick={() => setView("code")}>
            Code
          </button>
        </div>
        <div className="onl-row" style={{ ["--onl-gap" as string]: "6px" }}>
          {view === "preview" && (
            <>
              <div className="onl-btn-group site-hide-xs" role="group" aria-label="Viewport">
                {(Object.keys(WIDTHS) as (keyof typeof WIDTHS)[]).map((w) => (
                  <button key={w} type="button" className="onl-btn onl-btn--sm" aria-pressed={width === w} onClick={() => setWidth(w)}>
                    {w[0].toUpperCase() + w.slice(1)}
                  </button>
                ))}
              </div>
              <button type="button" className="onl-btn onl-btn--sm" onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}>
                {theme === "light" ? "Dark" : "Light"}
              </button>
              <a className="onl-btn onl-btn--sm" href={src} target="_blank" rel="noopener">
                Open
              </a>
            </>
          )}
          <span className="site-code site-hide-xs" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "2px 4px 2px 10px", fontFamily: "var(--onl-font-mono)", fontSize: 12 }}>
            {cli}
            <CopyButton text={cli} />
          </span>
        </div>
      </div>
      {view === "preview" ? (
        <div className="site-viewer__stage">
          <iframe title={`${slug} preview`} src={src} className="site-viewer__frame" style={{ maxWidth: WIDTHS[width], height }} loading="lazy" />
        </div>
      ) : locked || !files ? (
        <div className="site-lock">
          <span className="site-pro">PRO</span>
          <h3 className="onl-h3">This is a premium block</h3>
          <p className="onl-text-muted" style={{ maxWidth: 420 }}>
            Get the source for HTML, React, Vue and Angular, plus CLI access, with a Pro or Team licence. You pay once and get updates for life.
          </p>
          <div className="onl-row" style={{ justifyContent: "center" }}>
            <a className="onl-btn onl-btn--brand" href="/pricing">
              View pricing
            </a>
            {!signedIn && (
              <a className="onl-btn" href={`/login?next=/blocks/${slug}`}>
                Sign in
              </a>
            )}
          </div>
        </div>
      ) : (
        <FrameworkCode files={files} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ checkout */

export function BuyButton({ plan, label, signedIn, highlighted, email, name }: { plan: string; label: string; signedIn: boolean; highlighted?: boolean; email?: string; name?: string }) {
  const [busy, setBusy] = useState(false);
  const cls = `onl-btn onl-btn--block onl-btn--lg ${highlighted ? "onl-btn--brand" : ""}`;
  if (!signedIn)
    return (
      <a className={cls} href={`/login?next=/pricing&plan=${plan}`}>
        {label}
      </a>
    );
  const buy = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan }) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Checkout failed");
      const c = body.checkout;
      if (c.mode === "test") {
        window.location.href = c.url;
        return;
      }
      const Checkout = await loadCheckout();
      const rz = new Checkout({
        key: c.key,
        order_id: c.orderId,
        amount: c.amount,
        currency: c.currency,
        name: c.name,
        description: c.description,
        prefill: { email, name },
        theme: { color: getComputedStyle(document.documentElement).getPropertyValue("--onl-brand").trim() || "#1449a0" },
        handler: async (r: Record<string, string>) => {
          const v = await fetch("/api/checkout/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(r) });
          const vb = await v.json();
          if (!v.ok) return toast({ kind: "error", title: "Payment not verified", text: vb.message });
          window.location.href = "/account?welcome=1";
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rz.on(CHECKOUT_FAILED_EVENT, () => toast({ kind: "error", title: "Payment failed", text: "No money was taken. Try another method." }));
      rz.open();
    } catch (e) {
      toast({ kind: "error", title: "Checkout failed", text: (e as Error).message });
      setBusy(false);
    }
  };
  return (
    <button type="button" className={cls} aria-busy={busy || undefined} onClick={buy}>
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ auth */
const GOOGLE_ERRORS: Record<string, string> = {
  google_not_configured: "Google sign-in isn't set up on this site yet.",
  google_cancelled: "Google sign-in was cancelled.",
  google_state: "That sign-in link expired. Please try again.",
  google_unverified: "Your Google email isn't verified.",
  google_failed: "Couldn't sign in with Google. Please try again.",
  rate_limited: "Too many attempts. Wait a few minutes and try again.",
};

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function AuthForm({ next, initialMode = "signin", google = false, error }: { next: string; initialMode?: "signin" | "signup"; google?: boolean; error?: string }) {
  const [mode, setMode] = useState(initialMode);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(error ? (GOOGLE_ERRORS[error] ?? "Couldn't sign you in. Please try again.") : null);
  const [show, setShow] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch(`/api/auth/${mode === "signin" ? "login" : "signup"}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Something went wrong");
      const dest = next.startsWith("/") && !next.startsWith("//") ? next : "/account";
      // New accounts land on their account page with a congratulations pop-up.
      window.location.href = mode === "signup" && dest === "/account" ? "/account?joined=1" : dest;
    } catch (e2) {
      setErr((e2 as Error).message);
      setBusy(false);
    }
  };
  return (
    <div className="onl-card onl-card--pad-lg" style={{ width: "100%", maxWidth: 440, boxShadow: "var(--onl-shadow-lg)" }}>
      <h1 className="onl-h2">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
      <p className="onl-text-muted" style={{ marginTop: 4 }}>
        {mode === "signin" ? "Sign in to download premium blocks, full sites and your saved themes." : "It's free. You only pay for premium blocks."}
      </p>
      {err && (
        <div className="onl-alert onl-alert--danger" role="alert" style={{ marginTop: 16 }}>
          <div className="onl-alert__content">{err}</div>
        </div>
      )}
      <a
        href={google ? `/api/auth/google?next=${encodeURIComponent(next)}` : undefined}
        aria-disabled={!google || undefined}
        onClick={(e) => !google && e.preventDefault()}
        className="onl-btn onl-btn--lg onl-btn--block"
        style={{ marginTop: 20, gap: 10, opacity: google ? 1 : 0.6, cursor: google ? "pointer" : "not-allowed" }}
      >
        <GoogleMark /> {mode === "signin" ? "Continue with Google" : "Sign up with Google"}
      </a>
      {!google && (
        <p className="onl-text-xs onl-text-muted" style={{ marginTop: 6, textAlign: "center" }}>
          Google sign-in isn&apos;t set up yet (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).
        </p>
      )}
      <div className="onl-text-xs onl-text-muted" style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18 }}>
        <span style={{ flex: 1, height: 1, background: "var(--onl-border, currentColor)", opacity: 0.4 }} />
        or with your email
        <span style={{ flex: 1, height: 1, background: "var(--onl-border, currentColor)", opacity: 0.4 }} />
      </div>
      <form className="onl-stack" style={{ marginTop: 16, ["--onl-gap" as string]: "14px" }} onSubmit={submit}>
        {mode === "signup" && (
          <div className="onl-field">
            <label className="onl-label" htmlFor="au-name">Name</label>
            <input className="onl-input" id="au-name" name="name" autoComplete="name" required maxLength={80} />
          </div>
        )}
        <div className="onl-field">
          <label className="onl-label" htmlFor="au-email">Email</label>
          <input className="onl-input" id="au-email" name="email" type="email" autoComplete="email" required maxLength={160} />
        </div>
        <div className="onl-field">
          <label className="onl-label" htmlFor="au-pass">Password</label>
          <div style={{ position: "relative" }}>
            <input className="onl-input" id="au-pass" name="password" type={show ? "text" : "password"} autoComplete={mode === "signin" ? "current-password" : "new-password"} required minLength={8} maxLength={200} style={{ paddingRight: 64 }} />
            <button type="button" className="onl-btn onl-btn--ghost onl-btn--sm" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)" }}>
              {show ? "Hide" : "Show"}
            </button>
          </div>
          {mode === "signup" && <p className="onl-help">At least 8 characters.</p>}
        </div>
        <button className="onl-btn onl-btn--brand onl-btn--lg onl-btn--block" type="submit" aria-busy={busy || undefined}>
          {mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>
      {mode === "signup" && (
        <p className="onl-text-xs onl-text-muted" style={{ marginTop: 14, textAlign: "center" }}>
          By creating an account you agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.
        </p>
      )}
      <p className="onl-text-sm onl-text-muted" style={{ marginTop: 18, textAlign: "center" }}>
        {mode === "signin" ? "New here? " : "Already have an account? "}
        <button type="button" className="onl-btn onl-btn--link" onClick={() => (setMode(mode === "signin" ? "signup" : "signin"), setErr(null))}>
          {mode === "signin" ? "Create an account" : "Sign in"}
        </button>
      </p>
    </div>
  );
}

export function SignOutButton() {
  return (
    <button
      type="button"
      className="onl-btn onl-btn--ghost onl-btn--sm"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/";
      }}
    >
      Sign out
    </button>
  );
}

export function TestGateway({ orderId, amountLabel, planName }: { orderId: string; amountLabel: string; planName: string }) {
  const [busy, setBusy] = useState<"pay" | "fail" | null>(null);
  const act = async (outcome: "pay" | "fail") => {
    setBusy(outcome);
    const res = await fetch(`/api/test-pay/${orderId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ outcome }) });
    const body = await res.json();
    if (!res.ok) {
      toast({ kind: "error", title: "Test payment failed", text: body.message });
      setBusy(null);
      return;
    }
    window.location.href = outcome === "pay" ? "/account?welcome=1" : "/pricing?failed=1";
  };
  return (
    <div className="onl-card site-gateway">
      <div className="onl-card__header">
        <div>
          <h1 className="onl-card__title">Test payment gateway</h1>
          <p className="onl-card__subtitle">Shown because live payment keys are not configured</p>
        </div>
        <span className="onl-badge onl-badge--warning">TEST MODE</span>
      </div>
      <div className="onl-card__body onl-stack" style={{ ["--onl-gap" as string]: "10px" }}>
        <dl className="onl-summary">
          <div className="onl-summary__row"><dt>Item</dt><dd>Onlynify UI {planName} licence</dd></div>
          <div className="onl-summary__row onl-summary__row--total"><dt>Amount</dt><dd>{amountLabel}</dd></div>
        </dl>
        <p className="onl-text-xs onl-text-muted">No real money moves. Set PAYMENT_GATEWAY_KEY_ID and PAYMENT_GATEWAY_KEY_SECRET to take live payments.</p>
      </div>
      <div className="onl-card__footer">
        <button type="button" className="onl-btn onl-btn--danger" aria-busy={busy === "fail" || undefined} disabled={!!busy} onClick={() => act("fail")}>Simulate failure</button>
        <button type="button" className="onl-btn onl-btn--brand" aria-busy={busy === "pay" || undefined} disabled={!!busy} onClick={() => act("pay")}>Pay {amountLabel}</button>
      </div>
    </div>
  );
}
