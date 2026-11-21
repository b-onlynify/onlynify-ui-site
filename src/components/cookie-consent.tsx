"use client";

/**
 * Cookie consent (shared by every Onlyn.ify app and website; copied by scaffold-kit/security-kit/rollout.mjs, do not
 * edit per app). Shown on a visitor's first visit. Essential cookies (sign-in session, security, the choice itself)
 * always work; optional ones (preferences, usage measurement) only after "Accept all". The choice is kept for a year
 * in the onl_consent cookie (readable by the server) and announced with the "onl:consent" event.
 *
 *   import { CookieConsent, consentAllows } from "./cookie-consent";
 *   <CookieConsent privacyHref="/privacy" />          // once, in the root layout
 *   if (consentAllows("optional")) startAnalytics();   // anywhere in the browser
 */
import { useEffect, useState } from "react";

const COOKIE = "onl_consent";
export type Consent = "all" | "essential";
export const CONSENT_EVENT = "onl:consent";

export function readConsent(): Consent | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)onl_consent=(all|essential)(?:;|$)/);
  return (m?.[1] as Consent | undefined) ?? null;
}

/** Essential cookies always; optional ones only with "all". */
export const consentAllows = (kind: "essential" | "optional") => kind === "essential" || readConsent() === "all";

function saveConsent(v: Consent) {
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE}=${v}; Max-Age=${365 * 86400}; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: v }));
}

const CSS = `
.onl-cc{position:fixed;z-index:2147483000;left:16px;right:16px;bottom:16px;max-width:440px;margin-left:auto;padding:18px 18px 16px;border-radius:18px;border:1px solid var(--line,var(--color-line,#e3e7ee));background:var(--surface,var(--color-surface,var(--card,#fff)));color:var(--fg,var(--color-fg,#0a0f1a));box-shadow:0 18px 50px -12px rgb(10 15 26/.28),0 4px 12px rgb(10 15 26/.08);font:inherit;font-size:14px;line-height:1.5;animation:onl-cc-in .35s cubic-bezier(.2,.8,.2,1)}
@keyframes onl-cc-in{from{opacity:0;transform:translateY(14px)}}
@media (prefers-reduced-motion:reduce){.onl-cc{animation:none}}
.onl-cc__head{display:flex;align-items:center;gap:10px;font-weight:650;font-size:15px}
.onl-cc__icon{display:grid;place-items:center;width:34px;height:34px;flex:none;border-radius:10px;background:color-mix(in srgb,var(--brand,var(--color-brand,#1449a0)) 12%,transparent);color:var(--brand,var(--color-brand,#1449a0))}
.onl-cc__text{margin:8px 0 0;color:var(--muted,var(--color-muted,#5b6676));font-size:13.5px}
.onl-cc__text a{color:inherit;text-decoration:underline;text-underline-offset:3px}
.onl-cc__more{margin:10px 0 0;padding:10px 12px;border-radius:12px;background:var(--surface-2,var(--color-surface-2,rgb(0 0 0/.035)));font-size:13px;color:var(--muted,var(--color-muted,#5b6676))}
.onl-cc__more b{color:var(--fg,var(--color-fg,#0a0f1a));font-weight:600}
.onl-cc__actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.onl-cc__btn{flex:1 1 auto;min-height:40px;padding:0 14px;border-radius:11px;border:1px solid var(--line-strong,var(--color-line-strong,#d0d6df));background:transparent;color:inherit;font:inherit;font-weight:600;font-size:13.5px;cursor:pointer}
.onl-cc__btn:hover{background:var(--surface-2,var(--color-surface-2,rgb(0 0 0/.04)))}
.onl-cc__btn--primary{border-color:transparent;background:var(--brand,var(--color-brand,#1449a0));color:var(--brand-fg,var(--color-brand-fg,#fff))}
.onl-cc__btn--primary:hover{background:var(--brand,var(--color-brand,#1449a0));opacity:.92}
.onl-cc__link{border:0;background:none;padding:0;color:inherit;font:inherit;font-size:13px;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
`;

export function CookieConsent({ privacyHref = "/privacy", appName = "Onlyn.ify" }: { privacyHref?: string; appName?: string }) {
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);
  useEffect(() => {
    if (!readConsent()) setOpen(true);
  }, []);
  if (!open) return null;
  const choose = (v: Consent) => {
    saveConsent(v);
    setOpen(false);
  };
  return (
    <div className="onl-cc" role="dialog" aria-modal="false" aria-labelledby="onl-cc-title" aria-describedby="onl-cc-text">
      <style href="onl-cookie-consent" precedence="default">
        {CSS}
      </style>
      <div className="onl-cc__head" id="onl-cc-title">
        <span className="onl-cc__icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
            <path d="M8.5 8.5v.01M16 15.5v.01M12 12v.01M11 17v.01M7 14v.01" />
          </svg>
        </span>
        Cookies on {appName}
      </div>
      <p className="onl-cc__text" id="onl-cc-text">
        We use essential cookies to keep you signed in and your account secure. With your OK we also remember your preferences and measure how the site is used, to improve it.{" "}
        <a href={privacyHref}>Privacy policy</a>
      </p>
      {more && (
        <div className="onl-cc__more">
          <p>
            <b>Essential (always on):</b> sign-in session, security checks and this choice. They can&apos;t be switched off.
          </p>
          <p style={{ marginTop: 6 }}>
            <b>Optional:</b> preferences and anonymous usage statistics. Only with &quot;Accept all&quot;.
          </p>
        </div>
      )}
      <div className="onl-cc__actions">
        <button type="button" className="onl-cc__btn" onClick={() => choose("essential")}>
          Essential only
        </button>
        <button type="button" className="onl-cc__btn onl-cc__btn--primary" onClick={() => choose("all")} autoFocus>
          Accept all
        </button>
      </div>
      {!more && (
        <p style={{ marginTop: 10, textAlign: "center" }}>
          <button type="button" className="onl-cc__link" onClick={() => setMore(true)}>
            What&apos;s the difference?
          </button>
        </p>
      )}
    </div>
  );
}
