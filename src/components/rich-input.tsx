"use client";

/**
 * Rich text input (shared by every Onlyn.ify app; copied by scaffold-kit/login-kit/rollout.mjs, do not edit per app).
 * The label sits inside the border: in the middle while the field is empty, then it moves to the top inner edge
 * when the field is focused or filled (also for browser autofill). Optional leading icon, trailing slot
 * (e.g. show / hide password), hint and error. Styles ship with the component (no Tailwind needed) and use the
 * apps' shared tokens (--brand, --line, --surface, --fg, --muted, --danger) with Onlyn.ify defaults.
 */
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";

const CSS = `
.ri{display:block;min-width:0}
.ri__box{position:relative;display:flex;align-items:stretch;min-height:56px;border:1px solid var(--line-strong,var(--line,#d0d6df));border-radius:12px;background:var(--surface,#fff);transition:border-color .15s,box-shadow .15s}
.ri__box:hover{border-color:color-mix(in srgb,var(--fg,#0a0f1a) 28%,transparent)}
.ri__box:focus-within{border-color:var(--brand,#1449a0);box-shadow:0 0 0 3px color-mix(in srgb,var(--brand,#1449a0) 16%,transparent)}
.ri[data-invalid] .ri__box{border-color:var(--danger,#dc2626)}
.ri[data-invalid] .ri__box:focus-within{box-shadow:0 0 0 3px color-mix(in srgb,var(--danger,#dc2626) 16%,transparent)}
.ri[data-disabled] .ri__box{opacity:.6}
.ri__icon{display:flex;align-items:center;padding-inline-start:14px;color:var(--muted,#5b6676);flex:none}
.ri__icon svg{width:18px;height:18px}
.ri__field{position:relative;flex:1;min-width:0}
.ri__input{display:block;width:100%;height:100%;min-height:54px;margin:0;border:0;outline:0;background:transparent;color:var(--fg,#0a0f1a);font:inherit;font-size:15px;line-height:1.25;padding:22px 14px 7px;border-radius:12px}
.ri__input::placeholder{color:transparent}
.ri__box:focus-within .ri__input::placeholder{color:var(--muted,#8a94a3)}
.ri__label{position:absolute;inset-inline-start:14px;top:50%;transform:translateY(-50%);max-width:calc(100% - 28px);overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-size:15px;color:var(--muted,#5b6676);pointer-events:none;transition:top .15s ease,font-size .15s ease,transform .15s ease,color .15s ease}
.ri__box:focus-within .ri__label,.ri__input:not(:placeholder-shown)+.ri__label{top:8px;transform:none;font-size:11.5px;font-weight:600;letter-spacing:.02em}
.ri__input:-webkit-autofill+.ri__label{top:8px;transform:none;font-size:11.5px;font-weight:600;letter-spacing:.02em}
.ri__box:focus-within .ri__label{color:var(--brand,#1449a0)}
.ri[data-invalid] .ri__label{color:var(--danger,#dc2626)}
.ri__req{color:var(--danger,#dc2626);margin-inline-start:2px}
.ri__trailing{display:flex;align-items:center;padding-inline-end:6px;flex:none}
.ri__trailing button{display:grid;place-items:center;width:36px;height:36px;border:0;border-radius:8px;background:transparent;color:var(--muted,#5b6676);cursor:pointer}
.ri__trailing button:hover{color:var(--fg,#0a0f1a);background:var(--surface-2,rgb(0 0 0/.04))}
.ri__trailing svg{width:18px;height:18px}
.ri__msg{margin:6px 2px 0;font-size:12.5px;line-height:1.35;color:var(--muted,#5b6676)}
.ri[data-invalid] .ri__msg{color:var(--danger,#dc2626)}
`;

export type RichInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "placeholder"> & {
  label: string;
  /** Shown under the field; an error replaces it and turns the field red. */
  hint?: string;
  error?: string | null;
  /** Leading icon (any 18 px SVG icon). */
  icon?: ReactNode;
  /** Trailing slot, e.g. a show / hide password button. */
  trailing?: ReactNode;
  /** Shown inside the field only while it is focused and empty. */
  placeholder?: string;
};

export const RichInput = forwardRef<HTMLInputElement, RichInputProps>(function RichInput({ label, hint, error, icon, trailing, placeholder, id, className, required, disabled, ...rest }, ref) {
  const auto = useId();
  const inputId = id ?? `ri-${auto}`;
  const msgId = `${inputId}-msg`;
  const msg = error || hint;
  return (
    <div className={`ri ${className ?? ""}`} data-invalid={error ? "" : undefined} data-disabled={disabled ? "" : undefined}>
      <style href="onl-rich-input" precedence="default">
        {CSS}
      </style>
      <div className="ri__box">
        {icon && <span className="ri__icon" aria-hidden="true">{icon}</span>}
        <div className="ri__field">
          {/* placeholder " " drives the floating label (:placeholder-shown) */}
          <input ref={ref} id={inputId} className="ri__input" placeholder={placeholder ?? " "} required={required} disabled={disabled} aria-invalid={error ? true : undefined} aria-describedby={msg ? msgId : undefined} {...rest} />
          <label className="ri__label" htmlFor={inputId}>
            {label}
            {required && <span className="ri__req" aria-hidden="true">*</span>}
          </label>
        </div>
        {trailing && <span className="ri__trailing">{trailing}</span>}
      </div>
      {msg && (
        <p id={msgId} className="ri__msg" role={error ? "alert" : undefined}>
          {msg}
        </p>
      )}
    </div>
  );
});
