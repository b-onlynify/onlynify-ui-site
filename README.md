# ui.onlynify.com: the Onlynify UI website

This is the public site for [onlynify-ui](../onlynify-ui). It provides:

- free docs and components (MIT), with code for HTML, React, Vue and Angular plus React Native conversion starters
- a blocks gallery with live previews, split into free blocks and premium (Pro) blocks (24 blocks, 13 Pro)
- Pro components at `/pro`: 56 full versions of the free kit components (41 components + 15 charts; 7 are Team-only), from `registry/pro.json` + `registry/pro/<slug>.html` + `registry/pro/pro.css`. Categories include Forms, Commerce (checkout, product cards, invoice, order tracking), Apps (scheduler, file manager, chat, kanban), Data, Marketing and Charts
- 8 Pro site templates (multi-page: SaaS, restaurant, real estate, clinic, agency, fitness, courses, hotel)
- Pro setup: every site template has 4 ready-made variations (`registry/site-variants.json`). A variation sets the business name, the copy on every page (nav, pages, footer), the theme and a page layout; choosing one in the studio updates all pages, the preview and the code download
- Page layouts (free, like style presets): classic, centred, editorial, immersive and minimal, applied with `data-layout` and shipped inside `theme.css`
- a theme builder: presets are free; Pro customises any colour, accent, radius, font and density, saves themes and applies them to site code
- paid licences through a payment gateway, with a built-in test gateway for development
- a licence-gated registry API for the CLI (`npx onlynify-ui add <block>`)

The site is built with onlynify-ui itself: there is no CSS framework and no UI library. It depends on `onlynify-ui` exactly as a customer's app would.

| | |
|---|---|
| Stack | Next.js 15 (App Router) and React 19 |
| Port | 3600 |
| Storage | `data/db.json` (users, sessions, orders, licences, events), written atomically and serialised |
| Payments | Hosted checkout, signature verification and webhook through one adapter (`src/lib/gateway.ts`); test gateway when keys are unset |

## Run

```bash
cd onlynify-ui-site
npm install
npm run dev        # builds onlynify-ui, syncs it to public/ui, extracts the registry, starts :3600
```

Try the purchase flow locally with no payment keys:

1. Sign up at `/login`.
2. Go to `/pricing` and choose **Get Pro**. The test gateway opens.
3. Click **Pay ₹2,999**.
4. `/account` now shows your licence key, and premium block pages show their code.
5. Use the key with the CLI:
   `ONLYNIFY_UI_REGISTRY=http://localhost:3600 npx onlynify-ui login <key>`, then `npx onlynify-ui add dashboard-01`.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js. `sync` runs automatically first |
| `npm run sync` | Rebuilds `../onlynify-ui`, copies its `dist/` to `public/ui/`, and regenerates `registry/components.json` + `icons.json` from the kit's style guide |
| `npm test` | `node --test`: crypto, licences, signatures, converter, store, fulfilment, themes, site assembly and code generation (17 tests) |
| `npm run check:generated` | Converts every block and demo to React and typechecks the output with `tsc` |
| `npm run typecheck` | `tsc --noEmit` |

## How it fits together

```
registry/
  components.json   ← generated from onlynify-ui/docs/index.html (one source of truth)
  icons.json        ← the style guide's SVG sprite
  blocks.json       ← block catalogue: slug, title, category, premium, preview height
  blocks/*.html     ← block source: framework-agnostic markup with <svg data-icon="…">
  sites.json        ← site templates: slug, pages, default theme
  site-variants.json ← Pro setup variations per site: name, tagline, description, theme, layout, copy (template text → variation text)
  sites/<slug>/     ← _nav.html, _footer.html and one file per page; links written as href="{{page:x}}"

src/lib/
  convert.ts        HTML → React (JSX), Vue SFC, Angular standalone component
  registry.ts       loads components and blocks, expands icons, produces framework files
  store.ts          JSON-file DB, the only persistence module (swap for Mongo/MySQL here)
  auth.ts           scrypt passwords, random session tokens (stored hashed), HttpOnly cookie
  gateway.ts        payment gateway adapter: the only module with provider endpoints
  payments.ts       live or test gateway, idempotent fulfilOrder() → licence
  crypto.ts         HMAC checks, licence keys ONL-XXXX-XXXX-XXXX-CCCC (with checksum)
  plans.ts          prices in paise: change them here
  theme.ts          Theme shape, validation, Pro gate (needsPro), CSS/attribute output, URL encoding
  sites.ts          site catalogue, page assembly, themed code for every framework
  pro.ts            requirePro(): licence key or signed-in Pro user

src/app/
  /                       landing page with a live component showcase
  /docs/[guide]           introduction, installation, theming, charts, CLI, licence
  /docs/components/[x]    live demos with HTML/React/Vue/Angular/React Native conversion code tabs
  /blocks, /blocks/[x]    gallery and viewer (desktop/tablet/mobile, light/dark, code)
  /preview/[x]            standalone block document for iframes
  /themes                 theme builder (presets free; custom colours, radius, font, density, save, export: Pro)
  /sites, /sites/[x]      site gallery and studio (page tabs, devices, light/dark, theme panel, Pro code)
  /preview/site/[x]/[page], /preview/theme   themed preview documents for iframes
  /api/sites/[x]          site source per framework with a theme (Pro)
  /api/themes[/id]        saved themes (save: Pro)
  /pricing, /login, /account, /pay/test/[order]
  /api/auth/*             signup, login, logout
  /api/checkout           create order (live or test gateway)
  /api/checkout/verify    checkout signature → licence
  /api/webhooks/payments  payment.captured / order.paid / payment.failed
  /api/test-pay/[order]   test gateway (dev, or ALLOW_TEST_PAYMENTS=true)
  /api/registry[/slug]    CLI catalogue and block source (premium needs Bearer licence)
  /api/licence/validate   used by `onlynify-ui login`
```

## Security notes

- Premium **source** is only sent to licence holders. The `/blocks/<slug>` page and `/api/registry` check this on the server. Live **previews** (`/preview/<slug>`) are public, the same way any live website's markup can be viewed. This matches how other premium UI kits work.
- State-changing routes check `Origin` (CSRF defence in depth on top of `SameSite=Lax`).
- Login, sign-up, checkout and the registry are rate-limited. Login compares against a dummy hash for unknown emails so response timing doesn't reveal which accounts exist.
- Payment fulfilment is idempotent. The browser callback and the webhook can both arrive, in either order, and only one licence is issued.
- The test gateway returns 404 in production unless `ALLOW_TEST_PAYMENTS=true`.
- The in-memory rate limiter and the JSON store assume **one server instance**. Before scaling out, move `store.ts` to MongoDB or MySQL and the limiter to Redis.

## Going live

1. Set `PAYMENT_GATEWAY_KEY_ID`, `PAYMENT_GATEWAY_KEY_SECRET` and `PAYMENT_GATEWAY_WEBHOOK_SECRET` (see `.env.example`).
2. Register the webhook `https://ui.onlynify.com/api/webhooks/payments` in your payment gateway dashboard.
3. Publish the kit with `cd ../onlynify-ui && npm publish`. The package is MIT licensed and includes the `onlynify-ui` CLI bin, whose default registry is `https://ui.onlynify.com`.
4. Persist `DATA_DIR` on a volume, or replace `store.ts` with your database.
