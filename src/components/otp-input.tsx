"use client";

/**
 * One-time code input (shared by every Onlyn.ify app; copied by scaffold-kit/login-kit/rollout.mjs, do not edit per app).
 * One box per digit: typing moves forward, Backspace moves back, arrows move, pasting or SMS autofill
 * (autocomplete="one-time-code") fills every box, and onComplete fires once all digits are in.
 * Styles ship with the component and use the apps' shared tokens.
 */
import { useEffect, useRef } from "react";

const CSS = `
.otp{display:grid;grid-template-columns:repeat(var(--otp-n,6),minmax(0,1fr));gap:8px;margin:0;padding:0;border:0;min-width:0}
.otp[data-split]{grid-template-columns:repeat(3,minmax(0,1fr)) 10px repeat(3,minmax(0,1fr))}
.otp__sep{align-self:center;justify-self:center;width:8px;height:2px;border-radius:2px;background:var(--line-strong,var(--line,#d0d6df))}
.otp__box{width:100%;min-width:0;height:56px;margin:0;border:1px solid var(--line-strong,var(--line,#d0d6df));border-radius:12px;background:var(--surface,#fff);color:var(--fg,#0a0f1a);text-align:center;font:600 22px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;caret-color:var(--brand,#1449a0);outline:0;transition:border-color .15s,box-shadow .15s,background-color .15s}
.otp__box:hover{border-color:color-mix(in srgb,var(--fg,#0a0f1a) 28%,transparent)}
.otp__box:focus{border-color:var(--brand,#1449a0);box-shadow:0 0 0 3px color-mix(in srgb,var(--brand,#1449a0) 16%,transparent)}
.otp__box[data-filled]{border-color:color-mix(in srgb,var(--brand,#1449a0) 55%,transparent);background:color-mix(in srgb,var(--brand,#1449a0) 5%,var(--surface,#fff))}
.otp[data-invalid] .otp__box{border-color:var(--danger,#dc2626);background:color-mix(in srgb,var(--danger,#dc2626) 5%,var(--surface,#fff))}
.otp__box:disabled{opacity:.55;cursor:not-allowed}
@media (max-width:360px){.otp{gap:6px}.otp__box{height:50px;font-size:20px}}
`;

export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled,
  invalid,
  autoFocus = true,
  label = "One-time code",
}: {
  value: string;
  onChange: (v: string) => void;
  /** Called with the full code when the last digit is entered. */
  onComplete?: (code: string) => void;
  length?: number;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
  label?: string;
}) {
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  useEffect(() => {
    if (autoFocus && !disabled) boxes.current[Math.min(value.length, length - 1)]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus, disabled]);

  const set = (next: string) => {
    const clean = next.replace(/\D/g, "").slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
    return clean;
  };

  const put = (i: number, raw: string) => {
    const v = raw.replace(/\D/g, "");
    if (!v) {
      // The code is kept without gaps: clearing a box removes that digit.
      set(value.slice(0, i) + value.slice(i + 1));
      return;
    }
    // Several digits at once (paste, SMS autofill or fast typing): fill from this box on.
    const arr = [...digits];
    for (let k = 0; k < v.length && i + k < length; k++) arr[i + k] = v[k]!;
    const joined = arr.join("");
    const firstGap = arr.findIndex((d) => !d);
    set(firstGap === -1 ? joined : joined.slice(0, firstGap));
    boxes.current[Math.min(length - 1, i + v.length)]?.focus();
  };

  const onKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      e.preventDefault();
      set(value.slice(0, i - 1));
      boxes.current[i - 1]?.focus();
    } else if (e.key === "ArrowLeft" && i > 0) boxes.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < length - 1) boxes.current[i + 1]?.focus();
  };

  const split = length === 6;
  return (
    <fieldset className="otp" role="group" aria-label={label} data-invalid={invalid ? "" : undefined} data-split={split ? "" : undefined} style={{ ["--otp-n" as string]: length }}>
      <style href="onl-otp-input" precedence="default">
        {CSS}
      </style>
      {digits.map((d, i) => [
        split && i === 3 ? <span key="sep" className="otp__sep" aria-hidden="true" /> : null,
        <input
          key={i}
          ref={(el) => {
            boxes.current[i] = el;
          }}
          className="otp__box"
          data-filled={d ? "" : undefined}
          value={d}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={length}
          aria-label={`Digit ${i + 1} of ${length}`}
          disabled={disabled}
          onChange={(e) => put(i, e.target.value)}
          onKeyDown={(e) => onKey(i, e)}
          onFocus={(e) => {
            // Never leave a hole: an empty box after the first gap sends focus back to the first empty box.
            if (i > value.length) boxes.current[value.length]?.focus();
            else e.currentTarget.select();
          }}
          onPaste={(e) => {
            e.preventDefault();
            put(0, e.clipboardData.getData("text"));
          }}
        />,
      ])}
    </fieldset>
  );
}
