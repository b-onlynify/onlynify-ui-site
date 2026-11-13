// node --test tests/lib.test.ts  (Node 22.18+ strips types natively)
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.DATA_DIR = mkdtempSync(join(tmpdir(), "onl-site-test-"));
process.on("exit", () => rmSync(process.env.DATA_DIR!, { recursive: true, force: true }));

const crypto = await import("../src/lib/crypto.ts");
const convert = await import("../src/lib/convert.ts");
const store = await import("../src/lib/store.ts");
const payments = await import("../src/lib/payments.ts");
const { PLANS, planById, priceLabel } = await import("../src/lib/plans.ts");

test("password hashing round-trips and rejects wrong passwords", () => {
  const h = crypto.hashPassword("correct horse");
  assert.ok(h.startsWith("scrypt$"));
  assert.ok(crypto.verifyPassword("correct horse", h));
  assert.ok(!crypto.verifyPassword("wrong horse", h));
  assert.ok(!crypto.verifyPassword("x", "garbage"));
});

test("licence keys are well-formed, checksummed and unique", () => {
  const keys = new Set(Array.from({ length: 200 }, () => crypto.generateLicenceKey()));
  assert.equal(keys.size, 200);
  for (const k of keys) assert.ok(crypto.isWellFormedLicence(k), k);
  const k = [...keys][0];
  const tampered = k.slice(0, 4) + (k[4] === "A" ? "B" : "A") + k.slice(5);
  assert.ok(!crypto.isWellFormedLicence(tampered));
  assert.ok(!crypto.isWellFormedLicence("ONL-AAAA"));
  assert.ok(crypto.isWellFormedLicence(k.toLowerCase()), "case-insensitive");
  assert.match(crypto.maskLicence(k), /^ONL-[A-Z0-9]{4}-••••-••••-[A-Z0-9]{4}$/);
});

test("payment gateway checkout and webhook signatures", () => {
  const secret = "s3cret";
  const sig = crypto.hmacHex(secret, "order_1|pay_1");
  assert.ok(crypto.verifyCheckoutSignature("order_1", "pay_1", sig, secret));
  assert.ok(!crypto.verifyCheckoutSignature("order_1", "pay_2", sig, secret));
  assert.ok(!crypto.verifyCheckoutSignature("order_1", "pay_1", sig, "other"));
  const body = JSON.stringify({ event: "payment.captured" });
  assert.ok(crypto.verifyWebhookSignature(body, crypto.hmacHex(secret, body), secret));
  assert.ok(!crypto.verifyWebhookSignature(body + " ", crypto.hmacHex(secret, body), secret));
});

test("plans: prices in paise, only paid plans purchasable", () => {
  assert.equal(planById("pro")?.amount, 299900);
  assert.equal(priceLabel(planById("pro")!), "₹2,999");
  assert.deepEqual(PLANS.filter((p) => p.purchasable).map((p) => p.id), ["pro", "team"]);
});

test("HTML → JSX conversion", () => {
  const jsx = convert.htmlToJsx(
    `<label class="onl-label" for="x">Name</label><input class="onl-input" id="x" value="Ravi" tabindex="0"><input type="checkbox" checked>` +
      `<div style="--value:72%;margin-top:8px" onclick="alert(1)">{a}</div><svg viewBox="0 0 24 24" stroke-width="2"><path d="M1 1"/></svg>` +
      `<select class="onl-select"><option>A</option><option selected>B</option></select><!-- note --><img data-ph="Kaju Katli|35" alt="">` +
      `<onl-chart type="bar" class="x" labels='["a"]'></onl-chart>`,
  );
  assert.match(jsx, /className="onl-label" htmlFor="x"/);
  assert.match(jsx, /defaultValue="Ravi" tabIndex=\{0\} \/>/);
  assert.match(jsx, /<input type="checkbox" defaultChecked \/>/);
  assert.match(jsx, /style=\{\{ "--value": "72%", marginTop: "8px" \} as React.CSSProperties\}/);
  assert.ok(!jsx.includes("onclick"), "inline handlers removed");
  assert.match(jsx, /\{"\{"\}a\{"\}"\}/);
  assert.match(jsx, /strokeWidth="2"/);
  assert.match(jsx, /<path d="M1 1" \/>/);
  assert.match(jsx, /<select className="onl-select" defaultValue="B">/);
  assert.ok(!/selected/.test(jsx.replace("defaultValue", "")));
  assert.match(jsx, /\{\/\* note \*\/\}/);
  assert.match(jsx, /src="\/images\/kaju-katli.jpg"/);
  assert.match(jsx, /<onl-chart type="bar" className="x" labels='\["a"\]'>/);
});

test("framework files", () => {
  const html = `<button class="onl-btn" onclick="go()">Email me@x.io {now}</button><onl-chart type="line"></onl-chart>`;
  const [react] = convert.toFramework(html, "react", "hero-01");
  assert.equal(react.path, "Hero01.tsx");
  assert.match(react.content, /export function Hero01\(\)/);
  const [vue] = convert.toFramework(html, "vue", "hero-01");
  assert.equal(vue.path, "Hero01.vue");
  assert.match(vue.content, /<template>[\s\S]*class="onl-btn"/);
  assert.match(vue.content, /isCustomElement/);
  const [ng] = convert.toFramework(html, "angular", "hero-01");
  assert.equal(ng.path, "hero-01.component.ts");
  assert.match(ng.content, /CUSTOM_ELEMENTS_SCHEMA/);
  assert.match(ng.content, /me&#64;x\.io/, "Angular @ escaped");
  assert.match(ng.content, /\{\{ '\{' \}\}now\{\{ '\}' \}\}/, "Angular braces escaped");
  assert.ok(!ng.content.includes("onclick"));
  const [h] = convert.toFramework(html, "html", "hero-01");
  assert.match(h.content, /onclick="go\(\)"/, "HTML keeps handlers");
});

test("React Native component conversion maps common elements and strips web-only markup", () => {
  const html = `<div class="onl-row"><button class="onl-btn" onclick="go()">Save</button><a class="onl-btn onl-btn--link" href="/more">More</a><input type="password" placeholder="Password"><img data-ph="School|35" alt="School"><onl-chart type="bar"></onl-chart><svg><path d="M1 1"/></svg></div>`;
  const [native] = convert.toFramework(html, "react-native", "native-demo");
  assert.equal(native.path, "NativeDemo.tsx");
  assert.match(native.content, /from "react-native"/);
  assert.match(native.content, /<View style=\{styles\.row\}>/);
  assert.match(native.content, /<Pressable accessibilityRole="button" style=\{styles\.button\}>/);
  assert.match(native.content, /<Pressable accessibilityRole="link" style=\{styles\.link\}>/);
  assert.match(native.content, /<TextInput style=\{styles\.input\} secureTextEntry=\{true\} placeholder=\{"Password"\} \/>/);
  assert.match(native.content, /<Image style=\{styles\.image\} source=\{\{ uri: "\/images\/school\.jpg" \}\} accessibilityLabel="School" \/>/);
  assert.match(native.content, /Chart preview: bar/);
  assert.ok(!native.content.includes("<div"));
  assert.ok(!native.content.includes("onclick"));
  assert.ok(!native.content.includes("<svg"));
});

test("every component demo has a React Native conversion example", () => {
  const components = JSON.parse(readFileSync(new URL("../registry/components.json", import.meta.url), "utf8")) as {
    slug: string;
    demos: { html: string }[];
  }[];
  for (const component of components) {
    for (const [index, demo] of component.demos.entries()) {
      const [native] = convert.toFramework(demo.html, "react-native", `${component.slug}-${index + 1}`);
      assert.match(native.content, /from "react-native"/, `${component.slug}/${index + 1}`);
      assert.ok(!/<(?:div|span|button|img|input)\b/i.test(native.content), `${component.slug}/${index + 1} contains web-only tags`);
    }
  }
});

test("every registry block converts for every framework", async () => {
  const blocks = JSON.parse(readFileSync(new URL("../registry/blocks.json", import.meta.url), "utf8")) as { slug: string }[];
  const icons = JSON.parse(readFileSync(new URL("../registry/icons.json", import.meta.url), "utf8")) as Record<string, unknown>;
  for (const b of blocks) {
    const html = readFileSync(new URL(`../registry/blocks/${b.slug}.html`, import.meta.url), "utf8");
    for (const m of html.matchAll(/data-icon="([\w-]+)"/g)) assert.ok(icons[m[1]], `${b.slug}: unknown icon ${m[1]}`);
    for (const fw of convert.FRAMEWORKS) {
      const files = convert.toFramework(html, fw, b.slug);
      assert.ok(files[0].content.length > 100, `${b.slug}/${fw}`);
      if (fw === "react") {
        assert.ok(!/\sclass="/.test(files[0].content), `${b.slug}: class left in JSX`);
        assert.ok(!/<(input|img|br|hr)\b[^>]*[^/]>/.test(files[0].content), `${b.slug}: unclosed void tag`);
      }
    }
  }
});

test("store: serialised writes don't lose updates", async () => {
  await Promise.all(Array.from({ length: 25 }, (_, i) => store.write((db) => void db.events.push({ id: String(i), type: "t", at: store.now(), data: {} }))));
  const db = await store.read();
  assert.equal(db.events.filter((e) => e.type === "t").length, 25);
});

test("payments: test-gateway order → idempotent fulfilment → licence lookup", async () => {
  delete process.env.PAYMENT_GATEWAY_KEY_ID;
  await store.write((db) => void db.users.push({ id: "usr_1", email: "a@b.co", name: "A", passHash: "x", createdAt: store.now() }));
  await assert.rejects(payments.createOrder("usr_1", "free"), /can't be purchased/);
  const { order, checkout } = await payments.createOrder("usr_1", "pro");
  assert.equal(order.gateway, "test");
  assert.equal(checkout.mode, "test");
  assert.equal(order.amount, 299900);

  const [a, b] = await Promise.all([
    payments.fulfilOrder({ orderId: order.id }, "pay_1", "checkout"),
    payments.fulfilOrder({ gatewayOrderId: order.gatewayOrderId }, "pay_1", "webhook"),
  ]);
  assert.equal(a.licence.key, b.licence.key, "browser callback + webhook issue one licence");
  const db = await store.read();
  assert.equal(db.licences.length, 1);
  assert.equal(db.orders[0].status, "paid");

  assert.ok(await payments.userHasPremium("usr_1"));
  assert.ok(!(await payments.userHasPremium("usr_2")));
  const found = await payments.findLicence(a.licence.key.toLowerCase());
  assert.equal(found?.user.email, "a@b.co");
  assert.equal(await payments.findLicence("ONL-0000-0000-0000-0000"), null);

  await payments.recordDownload(a.licence.key, "dashboard-01", "react");
  assert.equal((await store.read()).licences[0].downloads, 1);

  await assert.rejects(payments.fulfilOrder({ orderId: "ord_missing" }, "p", "x"), /not found/);
});
