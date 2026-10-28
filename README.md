# DQ.lk (Digital QR) — shop pages, menus and QR posters

React + Vite owner studio with a Node.js API and Postgres, built to host on Vercel with Neon. Each business owner has an account created by an administrator; each shop has its own saved profile, landing page, searchable menu, QR destinations and feedback inbox.

## Development

Use Node.js 22. Without `DATABASE_URL`, development uses an embedded Postgres (PGlite) stored in `.data/pglite`, so you do not need a database server. Only one process can open it at a time: stop `npm run dev` before running the `npm run create-admin` style commands locally.

```powershell
npm install
npm run dev
```

Open the address printed by Vite (normally http://127.0.0.1:5173). The development API is built into Vite and is the same code that runs on Vercel. To develop against your Neon database instead, run `vercel env pull .env.local` first; the dev server and the admin commands read `DATABASE_URL` from it.

1. Create an administrator with `npm run create-admin` (see Accounts and plans), sign in, then register a shop and enter its branding, contact information and optional Google review URL.
2. Open Menu Builder; add items, categories, prices, descriptions and optional image URLs. Set unavailable items off to hide them.
3. Select Publish this shop, then Save menu & page. Unpublished drafts are unavailable to customers.
4. Open Print Stand & NFC Studio. Select the landing page, menu, or direct Google review destination.
5. For customer scans, set Public website address to the deployed site address. Download the QR SVG, export the poster PNG, or print it.
6. Read customer submissions in Feedback. Only successful server submissions display a delivery confirmation.

## Studio

The owner studio uses a sidebar layout with a shop switcher, light and dark themes, and shareable page links (`#/menu`, `#/inbox` and so on).

- **Overview** shows QR scans per day (7, 30 or 90 days, as a chart or table), average rating, feedback received, unread feedback, the rating breakdown, recent feedback and a setup checklist. With more than one shop it also lists every shop's figures.
- **Feedback** has read and unread states, search, rating and type filters, CSV export of the filtered list, single deletes and mark-all-as-read. The sidebar shows the unread count.
- **Menu** groups items by category. Categories can be added, renamed, reordered and deleted. Items can be dragged between positions and categories, duplicated, labelled (Popular, New, Vegetarian, Vegan, Spicy, Gluten-free) and set to Available, Sold out (shown with a label) or Hidden (left out of the public API).

Daily scan and feedback counts use the date in `APP_TIME_ZONE` (for example `Asia/Colombo`); without it, the server's own time zone, which is UTC on Vercel. Daily scan counts are kept for 120 days; the all-time total is kept indefinitely. Scans are written straight to the database.

## Accounts and plans

There is no public sign-up. An administrator creates every account and gives the client their sign-in details.

**First administrator.** Create it once from your computer, then sign in with the printed temporary password. For the live site, run `vercel env pull .env.local` first so the command writes to Neon:

```powershell
npm run create-admin -- you@example.com "Your Name"
```

Run the same command with an existing account's email to make that account an administrator.

**Client accounts.** Administrators get an **Accounts** page in the studio. It can:

- create a client account with a name, email and plan. A 12-character temporary password is generated and shown once, with a button to copy the sign-in details.
- change any account's plan.
- reset a password. This generates a new temporary password and signs the client out everywhere.
- delete an account, together with its shops, feedback and scan history. Administrators cannot delete their own account.
- move any shop to any account under **Shop ownership**. You can set up a shop in your own account, then hand it to the client. Plan limits do not apply to shops assigned this way.

A client signing in with a temporary password must choose their own password (at least 8 characters) before the studio opens. Until then, every shop request is refused.

**Security.** Passwords are hashed with scrypt. Signing in sets an HttpOnly, SameSite=Lax session cookie that lasts 30 days, and it is marked Secure when the site is served over HTTPS. Sign-in is limited to 10 attempts per address every 15 minutes. Owners only ever see and manage their own shops. Requests for another account's shop return 404, so shop IDs are not confirmed. Writes from another origin, and any write that is not a JSON request, are refused.

**Account & plan** shows an owner's plan usage and lets them change their name and password. Changing the password signs out their other devices. **All shops** can delete a single shop.

**Plans** limit how many shops an owner can create: Free 1, Pro 5, Business 50 (see `src/data/plans.js`). There is no checkout, trial, invoice, or automatic upgrade — selling is assisted-only: the buyer contacts the administrator, the administrator confirms payment offline, then sets the plan on the Accounts page, or with:

```powershell
npm run set-plan -- owner@example.com pro
```

The full procedure, including verification, is in `docs/assisted-sales-checklist.md`, and the buyer-facing steps are on `/pricing` and `/contact`. No prices are published on the site until the owner confirms them.

**Password reset by email.** The sign-in page has a real **Forgot password?** link. It sends a single-use reset link (valid 1 hour) to the account's email address. The link is `/signin?reset=<token>`; only a SHA-256 hash of the token is stored, it stops working once used or once the password is changed another way, and asking for a reset never reveals whether an email address belongs to an account (every request gets the same generic reply). Forgot requests are limited to 10 per address per 15 minutes, reset attempts to 20 per address per 15 minutes. A reset signs the owner out on every device. If email is not configured, the request still shows the generic reply and the owner is told to contact their administrator, who can reset the password directly from the Accounts page.

Email is sent via SMTP, configured only through environment variables (never in the repo):

```powershell
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=you@example.com
SMTP_PASS=…
SMTP_FROM=DQ.lk <you@example.com>
APP_BASE_URL=https://starpulse-beta.vercel.app
```

`APP_BASE_URL` is the public address used to build reset links. It must be set for live emails to send (Vercel's own `VERCEL_URL` is used as a fallback); the link is deliberately never built from a request's Host header, which an unauthenticated forgot-password request could forge. Set all six variables in Vercel under **Settings → Environment Variables** and redeploy — until then, password recovery falls back to the administrator.

## Deploy to Vercel with Neon

1. Push this repository to GitHub and import it in Vercel (**Add New → Project**). Vercel reads `vercel.json`: the Vite build is served as static files, and `/api/*` and `/q/*` run the function in `api/index.js`.
2. In the project, open **Storage → Create Database → Neon** (Serverless Postgres) and connect it to the project for all environments. This adds `DATABASE_URL`. Tables are created automatically on the first request.
3. Under **Settings → Environment Variables**, add `APP_TIME_ZONE` = `Asia/Colombo` (or your time zone). Redeploy after adding variables.
4. Create your administrator against Neon from your computer:

   ```powershell
   npm i -g vercel
   vercel link
   vercel env pull .env.local
   npm run create-admin -- you@example.com "Your Name"
   ```

5. Optional: bring in shops from the old single-owner version, then assign them under **Accounts → Shop ownership**:

   ```powershell
   npm run import-json -- .data
   ```

   `npm run claim-shops -- you@example.com` gives every unassigned shop to one account.

`.env.local` holds the database password. It is ignored by Git; do not commit or share it. Neon keeps point-in-time backups; check your plan's retention.

Rate limits are stored in the database, so they apply across all Vercel instances. Requests are limited to 4 MB, below Vercel's 4.5 MB function limit, so keep uploaded images small.

### Self-hosting

The same app also runs as a single Node server:

```powershell
npm run build
$env:DATABASE_URL = 'postgres://…'
$env:PORT = '3000'
npm start
```

The Node server serves both `dist` and `/api`. Without `DATABASE_URL` it uses the embedded Postgres in `DATA_DIR` (default `.data`), which suits one small server only. Deploy behind HTTPS, set HOST=0.0.0.0 when your platform requires it, and set TRUST_PROXY=true behind a reverse proxy so rate limits see real client addresses.

Permanent links use `/?biz=<shop-id>` for the landing page and `/?biz=<shop-id>&view=menu` for its menu. Edits to the published shop update the same URL; printed QR codes do not need to change. Unknown IDs and unpublished shops display an unavailable message. Do not put a localhost address on a customer-facing QR code.

NFC support is link generation: program a physical NFC tag with the generated URL using a tag-writing application. The app does not write NFC hardware.

## Exports and reviews

PNG export copies computed styles and embeds image data before rendering. Remote images must allow CORS; otherwise the app reports the image error instead of providing a broken export. Uploaded logos avoid that restriction. System font fallbacks may be used in exported images. The poster export also shows a preview and a download link. Print can save a PDF using the browser dialog; check print scale and page settings on your printer.

No Google rating is invented or displayed. Review incentives are not included. Google links remain available regardless of the feedback rating. A Google link click is recorded only when the customer has selected a rating and never represents a confirmed Google review.

## Checks

```powershell
npm run lint
npm test
npm run build
```

Tests run against an in-memory Postgres and cover administrator-created accounts, temporary passwords, password resets, email password resets (enumeration resistance, expiry, single-use, rate limiting), shop hand-over, sign-in, sessions, password changes, account deletion, isolation between accounts, plan limits, import of the old JSON store, shop profiles, updates, draft visibility, persistence across restarts, cross-origin and non-JSON write rejection, per-shop feedback, visit pruning, malformed browser storage, URL validation and menu prices.

## Menu templates and design settings

Menu → Design has 23 templates in six collections: cafés and bakeries, restaurants, fast food and street food, bars and lounges, healthy food and desserts, and shops and services. They include Italian, pizza, sushi, Indian and Sri Lankan curry, tacos, steakhouse, seafood, fine dining, noodles, brunch, cocktails, desserts and retro diner designs. Gallery previews use sample dishes and photos; applying a template keeps your items, prices and text, and resets layout, fonts and colours to that template.

Every template can then be customised. Each setting defaults to "Template", which follows the template's own look:

- **Layout:** image cards, side-photo cards, classic rows, compact board or photo tiles; 1–3 columns; shadow, outline, flat or tinted cards; square to extra-round corners; wide, square or circle photos placed left or right; comfortable or compact spacing.
- **Typography:** 19 Google Font pairings (loaded only when used), heading and item alignment, heading size and uppercase headings.
- **Prices and sections:** prices beside or under the name, with dotted leaders or as a price tag; currency or amount only; line, dotted, dashed or no row dividers; pill, underline, boxed or sidebar category navigation; section headings with a rule, centred, as a banner or numbered.
- **Colours:** accent, page background, card and text colours, plus paper, dots, grid, stripes or chalk textures. Text switches between dark and light automatically when a colour choice would make it unreadable.
- **Content:** menu heading and introduction, and switches for the cover, logo header, photos, descriptions, prices, search and category navigation.

The live preview shows the customer page at phone or desktop size. Save the menu to publish design changes to the existing QR destination.

## Branded QR workspace

The Overview dashboard connects the Branded QR editor, Menu Builder and Business Studio. The QR editor supports custom colours, four design presets, frames, captions, optional business logos and PNG/SVG downloads. Designs are saved per shop. High error correction and a four-module quiet zone are preserved; low-contrast or inverted designs are blocked from export.

Dynamic codes use `/q/<business-id>`. Save and publish the shop before exporting. Select a shop landing page, menu, feedback page or custom HTTP(S) website as the destination, and save to update where the same printed code leads. Publishing controls also apply to dynamic redirects. Use the deployed domain when printing: localhost is only accessible on the computer running the server. The domain and business ID must remain stable. Serve `/q/` through the included Node server (or Vite in development), not a static-only host.

Visit totals and the last visit are persisted per business; these count GET requests to dynamic links, including tests and bots, rather than unique visitors. Analytics require owner access. Website, WhatsApp and Wi-Fi codes are static and need regeneration when their content changes. Wi-Fi passwords and static input fields are never saved to the server.

Subscriptions and billing (checkout, trials, invoices), team members per account, media-file hosting and an AI design assistant are not implemented yet. Selling is assisted-only (see Accounts and plans), and password reset by email works once SMTP is configured (see above).

Images can be uploaded from the device in Business Studio and Menu Builder: logo, cover photo, and each menu item photo. PNG/JPEG/WebP/GIF inputs up to 10 MB are resized and compressed in the browser; transparency is preserved with WebP, and GIF uploads use a still frame. Previews can be replaced or removed. Optimized images are stored with the shop on Save; total profile uploads are checked against the API request limit. Existing image URLs still render, while editing uses file uploads.
