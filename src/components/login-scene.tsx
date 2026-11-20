/**
 * Sign-in illustration: a person walks up and shows something to sign in (a staff badge, an ID card, a phone
 * with a QR code or one-time code, a key, a case file…) to a scanner, door, laptop, counter terminal, vault or
 * tablet. A beam scans it, the lock on the screen turns into a tick and a "verified" chip pops up. Loops every 6 s.
 *
 * Self-contained (inline SVG + its own <style>), so the same file works in every Onlyn.ify app.
 * Under prefers-reduced-motion it shows the final, verified pose without moving.
 */

export type SceneId =
  | "hospital"
  | "school"
  | "hr"
  | "billing"
  | "shop"
  | "social"
  | "realestate"
  | "interiors"
  | "malkhana"
  | "law"
  | "platform"
  | "site"
  | "ui"
  | "kb";

type Wear = "coat" | "cap" | "backpack" | "tie" | "apron" | "hardhat" | "gown" | "hoodie" | "blazer" | "none";
type Hair = "short" | "long" | "bun" | "curly";
type Item = "id" | "badge" | "key" | "file" | "blueprint" | "phone-qr" | "phone-otp" | "phone-face" | "phone-finger" | "card";
type Device = "kiosk" | "door" | "laptop" | "terminal" | "vault" | "tablet";

type Spec = { skin: string; hair: string; hairStyle: Hair; shirt: string; pants: string; wear: Wear; item: Item; device: Device; label: string };

const SCENES: Record<SceneId, Spec> = {
  hospital: { skin: "#f1c27d", hair: "#2b1d14", hairStyle: "bun", shirt: "#0ea5a4", pants: "#1f3a5f", wear: "coat", item: "badge", device: "kiosk", label: "Staff badge verified" },
  school: { skin: "#c68642", hair: "#1b1b1b", hairStyle: "short", shirt: "#2563eb", pants: "#334155", wear: "backpack", item: "id", device: "kiosk", label: "Student ID verified" },
  hr: { skin: "#e0ac69", hair: "#3b2416", hairStyle: "long", shirt: "#7c3aed", pants: "#1e293b", wear: "blazer", item: "phone-finger", device: "tablet", label: "Checked in" },
  billing: { skin: "#8d5524", hair: "#111111", hairStyle: "short", shirt: "#059669", pants: "#1f2937", wear: "apron", item: "phone-qr", device: "terminal", label: "Counter unlocked" },
  shop: { skin: "#f1c27d", hair: "#6b3e26", hairStyle: "long", shirt: "#e5484d", pants: "#27272a", wear: "none", item: "phone-otp", device: "laptop", label: "Code accepted" },
  social: { skin: "#c68642", hair: "#2a1a10", hairStyle: "curly", shirt: "#db2777", pants: "#18181b", wear: "hoodie", item: "phone-face", device: "tablet", label: "Face matched" },
  realestate: { skin: "#e0ac69", hair: "#1c1917", hairStyle: "short", shirt: "#0891b2", pants: "#1e293b", wear: "tie", item: "key", device: "door", label: "Key accepted" },
  interiors: { skin: "#f1c27d", hair: "#7c4a1e", hairStyle: "bun", shirt: "#b45309", pants: "#292524", wear: "hardhat", item: "blueprint", device: "tablet", label: "Studio unlocked" },
  malkhana: { skin: "#a0662f", hair: "#111111", hairStyle: "short", shirt: "#a8865a", pants: "#5b4a33", wear: "cap", item: "badge", device: "vault", label: "Officer verified" },
  law: { skin: "#e0ac69", hair: "#1a1a1a", hairStyle: "long", shirt: "#111827", pants: "#111827", wear: "gown", item: "file", device: "door", label: "Advocate verified" },
  platform: { skin: "#c68642", hair: "#1b1b1b", hairStyle: "short", shirt: "#1449a0", pants: "#0f172a", wear: "tie", item: "key", device: "vault", label: "Access granted" },
  site: { skin: "#f1c27d", hair: "#2b1d14", hairStyle: "long", shirt: "#1a4fd6", pants: "#1e293b", wear: "blazer", item: "card", device: "laptop", label: "Welcome back" },
  ui: { skin: "#e0ac69", hair: "#3b2416", hairStyle: "curly", shirt: "#4f46e5", pants: "#1f2937", wear: "hoodie", item: "key", device: "laptop", label: "Licence verified" },
  kb: { skin: "#8d5524", hair: "#111111", hairStyle: "bun", shirt: "#6366f1", pants: "#1e1b4b", wear: "none", item: "phone-otp", device: "tablet", label: "Code verified" },
};

/* Where each device "looks" from (beam origin) and where its screen icon sits. */
const DEVICE_GEO: Record<Device, { sensor: [number, number]; icon: [number, number]; iconScale: number; chipX: number }> = {
  kiosk: { sensor: [226, 127], icon: [269, 119], iconScale: 1, chipX: 269 },
  door: { sensor: [224, 127], icon: [233, 117], iconScale: 0.55, chipX: 280 },
  laptop: { sensor: [244, 140], icon: [278, 150], iconScale: 1, chipX: 278 },
  terminal: { sensor: [224, 134], icon: [303, 134], iconScale: 0.9, chipX: 285 },
  vault: { sensor: [232, 127], icon: [264, 113], iconScale: 0.6, chipX: 291 },
  tablet: { sensor: [240, 123], icon: [285, 123], iconScale: 1.1, chipX: 285 },
};

const CSS = `
.ls { --ls-ok: #10b981; overflow: visible; }
.ls * { transform-box: view-box; }
.ls-person { animation: ls-bob 3s ease-in-out infinite; }
.ls-arm { transform-origin: 128px 136px; animation: ls-arm 6s cubic-bezier(.45,.05,.3,1) infinite; }
.ls-held { transform-box: fill-box; transform-origin: center; animation: ls-held 6s cubic-bezier(.45,.05,.3,1) infinite; }
.ls-eyes { transform-box: fill-box; transform-origin: center; animation: ls-blink 4.2s infinite; }
.ls-beam { animation: ls-beam 6s ease-in-out infinite; }
.ls-scan { animation: ls-scan 6s linear infinite; }
.ls-screen { animation: ls-screen 6s ease-in-out infinite; }
.ls-lock { animation: ls-lock 6s ease-in-out infinite; }
.ls-ok { transform-box: fill-box; transform-origin: center; animation: ls-ok 6s cubic-bezier(.2,.9,.3,1.4) infinite; }
.ls-chip { animation: ls-chip 6s cubic-bezier(.2,.9,.3,1.3) infinite; }
.ls-spark { transform-box: fill-box; transform-origin: center; animation: ls-spark 6s ease-out infinite; }
.ls-spark:nth-of-type(2) { animation-delay: .12s; }
.ls-spark:nth-of-type(3) { animation-delay: .24s; }
.ls-door { transform-origin: 330px 160px; animation: ls-door 6s ease-in-out infinite; }
.ls-wheel { transform-box: fill-box; transform-origin: center; animation: ls-wheel 6s ease-in-out infinite; }
.ls-sensor { animation: ls-sensor 6s ease-in-out infinite; }
@keyframes ls-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
@keyframes ls-arm { 0%,8% { transform: rotate(0deg); } 24%,80% { transform: rotate(-100deg); } 94%,100% { transform: rotate(0deg); } }
@keyframes ls-held { 0%,8% { transform: rotate(0deg); } 24%,80% { transform: rotate(100deg); } 94%,100% { transform: rotate(0deg); } }
@keyframes ls-blink { 0%,44%,48%,100% { transform: scaleY(1); } 46% { transform: scaleY(.1); } }
@keyframes ls-beam { 0%,27% { opacity: 0; } 31%,50% { opacity: .55; } 55%,100% { opacity: 0; } }
@keyframes ls-scan { 0%,28% { transform: translateY(-16px); opacity: 0; } 30% { opacity: 1; } 40% { transform: translateY(16px); } 50% { transform: translateY(-16px); opacity: 1; } 52%,100% { opacity: 0; } }
@keyframes ls-screen { 0%,53% { fill: #0b1220; } 57%,86% { fill: #064e3b; } 92%,100% { fill: #0b1220; } }
@keyframes ls-lock { 0%,52% { opacity: 1; } 55%,88% { opacity: 0; } 92%,100% { opacity: 1; } }
@keyframes ls-ok { 0%,54% { opacity: 0; transform: scale(.3); } 60% { opacity: 1; transform: scale(1.15); } 64%,86% { opacity: 1; transform: scale(1); } 90%,100% { opacity: 0; transform: scale(.6); } }
@keyframes ls-chip { 0%,56% { opacity: 0; transform: translateY(8px); } 62%,86% { opacity: 1; transform: translateY(0); } 92%,100% { opacity: 0; transform: translateY(-6px); } }
@keyframes ls-spark { 0%,57% { opacity: 0; transform: scale(.2) rotate(0deg); } 63% { opacity: 1; transform: scale(1.1) rotate(45deg); } 74%,100% { opacity: 0; transform: scale(.4) rotate(90deg); } }
@keyframes ls-door { 0%,58% { transform: scaleX(1); } 66%,84% { transform: scaleX(.82); } 92%,100% { transform: scaleX(1); } }
@keyframes ls-wheel { 0%,56% { transform: rotate(0deg); } 70%,100% { transform: rotate(180deg); } }
@keyframes ls-sensor { 0%,28%,52%,100% { opacity: .55; } 31%,49% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .ls *, .ls-person { animation: none !important; }
  .ls-arm { transform: rotate(-100deg); }
  .ls-held { transform: rotate(100deg); }
  .ls-lock, .ls-beam, .ls-scan { opacity: 0; }
  .ls-ok, .ls-chip { opacity: 1; }
  .ls-screen { fill: #064e3b; }
}
`;

function HairShape({ style, color }: { style: Hair; color: string }) {
  switch (style) {
    case "long":
      return (
        <g fill={color}>
          <path d="M89 98c0-15 10-24 22-24s22 9 22 24v26c0 4-4 6-7 4l-1-22c-6-2-14-8-17-14-3 6-9 11-16 13l-1 23c-3 2-7 0-7-4z" />
        </g>
      );
    case "bun":
      return (
        <g fill={color}>
          <circle cx="111" cy="72" r="8" />
          <path d="M90 98c0-14 9-22 21-22s21 8 21 22c-5-6-13-9-21-9s-16 3-21 9z" />
        </g>
      );
    case "curly":
      return (
        <g fill={color}>
          {[[94, 88], [101, 81], [110, 78], [119, 81], [127, 88], [130, 96], [91, 96]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="7" />
          ))}
        </g>
      );
    default:
      return <path fill={color} d="M90 99c0-15 9-23 21-23 13 0 21 8 21 21-6-5-11-7-18-7-9 0-15 4-24 9z" />;
  }
}

function WearShape({ wear, shirt }: { wear: Wear; shirt: string }) {
  switch (wear) {
    case "coat":
      return (
        <g>
          <path d="M88 146c0-10 8-18 18-18h3l2 30 2-30h3c10 0 18 8 18 18v58H88z" fill="#f8fafc" />
          <path d="M106 128l5 24 5-24" fill={shirt} />
          <path d="M100 132c-6 10-6 22 0 30M122 132c6 10 6 22 0 30" stroke="#334155" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <circle cx="122" cy="164" r="4" fill="#94a3b8" stroke="#334155" strokeWidth="1.5" />
          <rect x="92" y="170" width="11" height="9" rx="2" fill="#e2e8f0" />
        </g>
      );
    case "cap":
      return (
        <g>
          <path d="M89 86c0-10 10-16 22-16s22 6 22 16z" fill="#4b3a26" />
          <rect x="88" y="84" width="46" height="6" rx="3" fill="#2f2417" />
          <path d="M120 90h18c2 0 2 3 0 3h-18z" fill="#1c140c" />
          <circle cx="111" cy="78" r="3" fill="#facc15" />
          <path d="M120 148l3 4 4 1-3 3 1 4-5-2-4 2 1-4-3-3 4-1z" fill="#facc15" />
          <rect x="94" y="146" width="12" height="3" rx="1.5" fill="#1d4ed8" />
        </g>
      );
    case "backpack":
      return (
        <g>
          <rect x="76" y="138" width="16" height="44" rx="6" fill="#f59e0b" />
          <path d="M96 130l-6 52" stroke="#b45309" strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    case "tie":
      return (
        <g>
          <path d="M104 128l7 8 7-8z" fill="#f8fafc" />
          <path d="M109 136h4l2 4-3 22-3-22z" fill="#be123c" />
        </g>
      );
    case "blazer":
      return (
        <g>
          <path d="M88 146c0-10 8-18 18-18l5 26 5-26c10 0 18 8 18 18v58H88z" fill="#1f2937" opacity=".88" />
          <path d="M106 128l5 26 5-26z" fill="#f8fafc" />
          <circle cx="111" cy="170" r="1.6" fill="#cbd5e1" />
        </g>
      );
    case "apron":
      return (
        <g>
          <path d="M96 150h30v52H96z" fill="#fef3c7" />
          <path d="M96 150c2-10 6-16 15-18M126 150c-2-10-6-16-15-18" stroke="#fef3c7" strokeWidth="2.5" fill="none" />
          <rect x="104" y="168" width="14" height="10" rx="2" fill="#fde68a" />
        </g>
      );
    case "hardhat":
      return (
        <g>
          <path d="M89 88c0-13 10-20 22-20s22 7 22 20z" fill="#facc15" />
          <rect x="86" y="86" width="50" height="5" rx="2.5" fill="#eab308" />
          <rect x="108" y="69" width="6" height="18" rx="3" fill="#fde047" />
        </g>
      );
    case "gown":
      return (
        <g>
          <path d="M106 128h10l-2 14h-6z" fill="#f8fafc" />
          <rect x="107" y="138" width="3" height="10" rx="1" fill="#f8fafc" />
          <rect x="112" y="138" width="3" height="10" rx="1" fill="#f8fafc" />
        </g>
      );
    case "hoodie":
      return (
        <g>
          <path d="M92 132c-6-6-8-14-6-22 4 10 12 16 25 16s21-6 25-16c2 8 0 16-6 22z" fill={shirt} />
          <path d="M104 132v14M118 132v14" stroke="#f8fafc" strokeWidth="1.8" strokeLinecap="round" />
          <rect x="99" y="176" width="24" height="12" rx="4" fill="#000" opacity=".12" />
        </g>
      );
    default:
      return null;
  }
}

function HeldItem({ item, accent }: { item: Item; accent: string }) {
  // Drawn around (0, 0); the parent places it in the hand.
  if (item.startsWith("phone")) {
    return (
      <g>
        <rect x="-10" y="-17" width="20" height="34" rx="4" fill="#0f172a" />
        <rect x="-8" y="-14" width="16" height="27" rx="2" fill="#e0f2fe" />
        {item === "phone-qr" && (
          <g fill="#0f172a">
            <rect x="-6" y="-11" width="5" height="5" />
            <rect x="1" y="-11" width="5" height="5" />
            <rect x="-6" y="-4" width="5" height="5" />
            <rect x="2" y="-3" width="2" height="2" />
            <rect x="4" y="-1" width="2" height="2" />
            <rect x="1" y="1" width="2" height="2" />
            <rect x="-6" y="4" width="12" height="2" rx="1" fill={accent} />
          </g>
        )}
        {item === "phone-otp" && (
          <g>
            <rect x="-6" y="-9" width="12" height="3" rx="1.5" fill="#94a3b8" />
            {[-6, -2, 2, 6].map((x) => (
              <rect key={x} x={x - 1.6} y="-3" width="3.2" height="5" rx="1" fill={accent} />
            ))}
            <rect x="-6" y="6" width="12" height="4" rx="2" fill={accent} />
          </g>
        )}
        {item === "phone-face" && (
          <g fill="none" stroke={accent} strokeWidth="1.4" strokeLinecap="round">
            <path d="M-6-8v-3h3M6-8v-3H3M-6 6v3h3M6 6v3H3" />
            <circle cx="0" cy="-1" r="4.5" />
            <path d="M-2 0.5c1 1.2 3 1.2 4 0" />
          </g>
        )}
        {item === "phone-finger" && (
          <g fill="none" stroke={accent} strokeWidth="1.2" strokeLinecap="round">
            <path d="M-4 4c0-6 1-9 4-9s4 3 4 9" />
            <path d="M-6 2c0-8 2-11 6-11s6 3 6 11" />
            <path d="M-2 6c0-5 0-7 2-7s2 2 2 7" />
          </g>
        )}
      </g>
    );
  }
  switch (item) {
    case "id":
      return (
        <g>
          <path d="M0-30v12" stroke={accent} strokeWidth="2" />
          <rect x="-17" y="-18" width="34" height="24" rx="3" fill="#ffffff" stroke="#cbd5e1" />
          <rect x="-17" y="-18" width="34" height="6" rx="3" fill={accent} />
          <rect x="-14" y="-9" width="10" height="12" rx="2" fill="#e2e8f0" />
          <circle cx="-9" cy="-5" r="2.6" fill="#94a3b8" />
          <rect x="-1" y="-8" width="14" height="2.4" rx="1.2" fill="#334155" />
          <rect x="-1" y="-3" width="11" height="2" rx="1" fill="#94a3b8" />
          <rect x="-1" y="1" width="8" height="2" rx="1" fill="#94a3b8" />
        </g>
      );
    case "card":
      return (
        <g>
          <rect x="-18" y="-12" width="36" height="24" rx="4" fill={accent} />
          <rect x="-18" y="-6" width="36" height="4" fill="#0f172a" opacity=".5" />
          <rect x="-13" y="3" width="8" height="5" rx="1" fill="#facc15" />
          <rect x="0" y="5" width="13" height="2" rx="1" fill="#fff" opacity=".8" />
        </g>
      );
    case "badge":
      return (
        <g>
          <path d="M0-16l13 5v8c0 9-6 15-13 18-7-3-13-9-13-18v-8z" fill="#facc15" stroke="#a16207" strokeWidth="1.5" />
          <path d="M0-7l2.3 4.6 5 .7-3.6 3.5.9 5L0 4.4l-4.6 2.4.9-5-3.6-3.5 5-.7z" fill={accent} />
        </g>
      );
    case "key":
      return (
        <g>
          <circle cx="-9" cy="0" r="8" fill="none" stroke="#eab308" strokeWidth="4" />
          <rect x="-2" y="-2" width="22" height="4" rx="2" fill="#eab308" />
          <rect x="12" y="1" width="3" height="6" rx="1" fill="#eab308" />
          <rect x="17" y="1" width="3" height="4" rx="1" fill="#eab308" />
        </g>
      );
    case "file":
      return (
        <g>
          <rect x="-13" y="-17" width="26" height="34" rx="2" fill="#fef3c7" stroke="#d6a74b" />
          {[-11, -6, -1, 4].map((y) => (
            <rect key={y} x="-9" y={y} width={y === 4 ? 10 : 18} height="2" rx="1" fill="#a16207" opacity=".55" />
          ))}
          <circle cx="7" cy="10" r="4.5" fill="#dc2626" />
          <path d="M5 14l-1 5 3-2 3 2-1-5" fill="#dc2626" />
        </g>
      );
    case "blueprint":
      return (
        <g>
          <rect x="-17" y="-14" width="34" height="28" rx="2" fill="#1d4ed8" />
          <g stroke="#bfdbfe" strokeWidth=".8" fill="none">
            <rect x="-13" y="-10" width="26" height="20" />
            <path d="M-13 0h12V10M-1-10v6h14" />
            <path d="M4 4h6v6" />
          </g>
          <circle cx="17" cy="-14" r="3" fill="#e2e8f0" />
        </g>
      );
  }
  return null;
}

function Icons({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className="ls-lock" fill="none" stroke="#93c5fd" strokeWidth="2.4" strokeLinecap="round">
        <rect x="-8" y="-3" width="16" height="12" rx="2.5" fill="#93c5fd" stroke="none" />
        <path d="M-5-3v-4a5 5 0 0 1 10 0v4" />
        <circle cx="0" cy="3" r="1.6" fill="#0b1220" stroke="none" />
      </g>
      <g className="ls-ok">
        <circle r="11" fill="var(--ls-ok)" />
        <path d="M-5 0l3.5 3.5L5.5-4" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>
  );
}

function DeviceShape({ device }: { device: Device }) {
  switch (device) {
    case "kiosk":
      return (
        <g>
          <rect x="263" y="150" width="12" height="108" rx="4" fill="#475569" />
          <rect x="246" y="250" width="46" height="8" rx="4" fill="#334155" />
          <rect x="230" y="88" width="78" height="70" rx="12" fill="#1e293b" />
          <rect className="ls-screen" x="240" y="98" width="58" height="42" rx="6" fill="#0b1220" />
          <rect x="248" y="146" width="42" height="5" rx="2.5" fill="#334155" />
          <rect className="ls-sensor" x="223" y="114" width="8" height="26" rx="4" fill="#38bdf8" />
        </g>
      );
    case "door":
      return (
        <g>
          <rect x="250" y="64" width="88" height="194" rx="4" fill="#cbd5e1" />
          <rect x="256" y="70" width="76" height="188" fill="#0f172a" opacity=".85" />
          <g className="ls-door">
            <rect x="256" y="70" width="76" height="188" rx="2" fill="#8b5e3c" />
            <rect x="264" y="82" width="60" height="70" rx="3" fill="#7a5134" />
            <rect x="264" y="164" width="60" height="80" rx="3" fill="#7a5134" />
            <rect x="262" y="156" width="10" height="4" rx="2" fill="#fde68a" />
          </g>
          <rect x="220" y="98" width="26" height="54" rx="6" fill="#1e293b" />
          <rect className="ls-screen" x="224" y="104" width="18" height="26" rx="3" fill="#0b1220" />
          <rect className="ls-sensor" x="226" y="136" width="14" height="10" rx="3" fill="#38bdf8" />
        </g>
      );
    case "laptop":
      return (
        <g>
          <rect x="206" y="186" width="144" height="8" rx="3" fill="#94a3b8" />
          <rect x="216" y="194" width="6" height="64" rx="2" fill="#64748b" />
          <rect x="334" y="194" width="6" height="64" rx="2" fill="#64748b" />
          <rect x="240" y="118" width="76" height="64" rx="6" fill="#1e293b" />
          <rect className="ls-screen" x="245" y="124" width="66" height="52" rx="3" fill="#0b1220" />
          <circle className="ls-sensor" cx="278" cy="121" r="1.8" fill="#38bdf8" />
          <path d="M232 186h92l-6-5h-80z" fill="#cbd5e1" />
          <rect x="322" y="170" width="12" height="16" rx="2" fill="#f97316" opacity=".9" />
        </g>
      );
    case "terminal":
      return (
        <g>
          <rect x="208" y="172" width="146" height="10" rx="4" fill="#64748b" />
          <rect x="214" y="182" width="134" height="76" rx="6" fill="#475569" />
          <rect x="226" y="200" width="110" height="6" rx="3" fill="#334155" />
          <rect x="234" y="142" width="8" height="30" rx="3" fill="#334155" />
          <rect x="220" y="124" width="34" height="20" rx="6" fill="#1e293b" />
          <rect className="ls-sensor" x="219" y="128" width="5" height="12" rx="2" fill="#f43f5e" />
          <rect x="298" y="156" width="10" height="16" rx="2" fill="#334155" />
          <rect x="268" y="108" width="70" height="50" rx="6" fill="#1e293b" />
          <rect className="ls-screen" x="273" y="113" width="60" height="40" rx="4" fill="#0b1220" />
        </g>
      );
    case "vault":
      return (
        <g>
          <rect x="236" y="88" width="112" height="170" rx="10" fill="#475569" />
          <rect x="242" y="94" width="100" height="158" rx="8" fill="#64748b" />
          <circle cx="292" cy="182" r="40" fill="#475569" stroke="#334155" strokeWidth="4" />
          <g className="ls-wheel" stroke="#e2e8f0" strokeWidth="4" strokeLinecap="round">
            <path d="M292 160v44M270 182h44M277 167l30 30M307 167l-30 30" />
            <circle cx="292" cy="182" r="7" fill="#e2e8f0" />
          </g>
          <rect className="ls-screen" x="248" y="100" width="34" height="26" rx="4" fill="#0b1220" />
          <rect className="ls-sensor" x="229" y="114" width="8" height="26" rx="4" fill="#38bdf8" />
          <rect x="336" y="150" width="6" height="64" rx="3" fill="#334155" />
        </g>
      );
    case "tablet":
      return (
        <g>
          <rect x="280" y="160" width="10" height="98" rx="4" fill="#475569" />
          <rect x="262" y="250" width="46" height="8" rx="4" fill="#334155" />
          <rect x="236" y="84" width="98" height="78" rx="12" fill="#1e293b" />
          <rect className="ls-screen" x="246" y="93" width="78" height="60" rx="6" fill="#0b1220" />
          <circle className="ls-sensor" cx="240" cy="123" r="2.4" fill="#38bdf8" />
        </g>
      );
  }
}

/** The animated "show it to sign in" illustration. */
export function LoginScene({ scene, className = "", title }: { scene: SceneId; className?: string; title?: string }) {
  const s = SCENES[scene];
  const chipW = Math.max(96, s.label.length * 6.6 + 34);
  // Keep the chip (and its sparkles) inside the frame.
  const geo = DEVICE_GEO[s.device];
  const g = { ...geo, chipX: Math.min(geo.chipX, 346 - chipW / 2) };
  const accent = s.shirt;
  const [sx, sy] = g.sensor;
  // The held item sits at about (177, 127) when the arm is raised.
  const ix = 177;
  const iy = 127;
  return (
    <svg viewBox="0 0 360 280" role="img" aria-label={title ?? `${s.label}: a person shows their credential to sign in`} className={`ls ${className}`}>
      <style>{CSS}</style>
      <ellipse cx="190" cy="260" rx="160" ry="10" fill="currentColor" opacity=".12" />

      <DeviceShape device={s.device} />
      <Icons x={g.icon[0]} y={g.icon[1]} s={g.iconScale} />

      {/* scan beam from the device to the item */}
      <path className="ls-beam" d={`M${sx} ${sy - 4}L${ix + 16} ${iy - 22}L${ix + 16} ${iy + 22}L${sx} ${sy + 4}z`} fill="#38bdf8" opacity="0" />
      <rect className="ls-scan" x={ix - 20} y={iy - 1} width="40" height="2" rx="1" fill="#38bdf8" opacity="0" />

      {/* verified chip + sparkles */}
      <g className="ls-chip" opacity="0">
        <rect x={g.chipX - chipW / 2} y="40" width={chipW} height="26" rx="13" fill="var(--ls-ok)" />
        <circle cx={g.chipX - chipW / 2 + 15} cy="53" r="7" fill="#fff" />
        <path d={`M${g.chipX - chipW / 2 + 11.5} 53l2.5 2.5 4.5-5`} fill="none" stroke="var(--ls-ok)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <text x={g.chipX - chipW / 2 + 27} y="57.5" fill="#fff" fontSize="12" fontWeight="600" fontFamily="inherit">
          {s.label}
        </text>
      </g>
      <g fill="#facc15">
        {[
          [g.chipX + chipW / 2 + 6, 42],
          [g.chipX - chipW / 2 - 8, 72],
          [g.chipX + chipW / 2 - 4, 78],
        ].map(([x, y], i) => (
          <path key={i} className="ls-spark" opacity="0" d={`M${x} ${y - 6}l1.6 4.4 4.4 1.6-4.4 1.6-1.6 4.4-1.6-4.4-4.4-1.6 4.4-1.6z`} />
        ))}
      </g>

      {/* the person */}
      <g className="ls-person">
        {/* legs + shoes */}
        <rect x="96" y="196" width="12" height="60" rx="6" fill={s.pants} />
        <rect x="114" y="196" width="12" height="60" rx="6" fill={s.pants} />
        <ellipse cx="101" cy="256" rx="10" ry="4.5" fill="#111827" />
        <ellipse cx="122" cy="256" rx="10" ry="4.5" fill="#111827" />
        {s.wear === "backpack" && <WearShape wear="backpack" shirt={s.shirt} />}
        {/* back arm */}
        <rect x="83" y="134" width="11" height="56" rx="5.5" fill={s.shirt} />
        <circle cx="88.5" cy="191" r="5.5" fill={s.skin} />
        {/* body */}
        <rect x="88" y="128" width="46" height="76" rx="18" fill={s.shirt} />
        <rect x="105" y="114" width="12" height="16" rx="4" fill={s.skin} />
        {s.wear !== "backpack" && s.wear !== "cap" && s.wear !== "hardhat" && <WearShape wear={s.wear} shirt={s.shirt} />}
        {/* head */}
        {s.hairStyle === "long" && <path d="M89 100v26c0 4 4 6 7 4h30c3 2 7 0 7-4v-26z" fill={s.hair} />}
        <circle cx="111" cy="98" r="20" fill={s.skin} />
        {s.wear !== "cap" && s.wear !== "hardhat" && <HairShape style={s.hairStyle} color={s.hair} />}
        {(s.wear === "hardhat" || s.wear === "cap") && <WearShape wear={s.wear} shirt={s.shirt} />}
        <g className="ls-eyes" fill="#111827">
          <circle cx="104.5" cy="99" r="2" />
          <circle cx="118.5" cy="99" r="2" />
        </g>
        <path d="M105 107c3.5 3.2 9 3.2 12.5 0" fill="none" stroke="#7c2d12" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="100" cy="105" r="2.6" fill="#f87171" opacity=".25" />
        <circle cx="123" cy="105" r="2.6" fill="#f87171" opacity=".25" />
        {/* presenting arm: swings up and holds the item out to the device */}
        <g className="ls-arm">
          <rect x="123" y="132" width="11" height="58" rx="5.5" fill={s.wear === "coat" ? "#f8fafc" : s.wear === "blazer" ? "#1f2937" : s.shirt} />
          <circle cx="128.5" cy="190" r="5.5" fill={s.skin} />
          <g transform="translate(128.5 186)">
            <g className="ls-held">
              <HeldItem item={s.item} accent={accent} />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}
