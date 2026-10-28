# DQ.lk (Digital QR) — shop pages, menus and QR posters

React + Vite owner studio with a Node.js API and Postgres, built to host on Vercel with Neon. Each business owner has an account created by an administrator; each shop has its own saved profile, landing page, searchable menu, QR destinations and feedback inbox.

## Development

Use Node.js 22. Without `DATABASE_URL`, development uses an embedded Postgres (PGlite) stored in `.data/pglite`, so you do not need a database server. Only one process can open it at a time: stop `npm run dev` before running the `npm run create-admin` style commands locally.

```powershell
npm install
npm run dev
```

Open the address printed by Vite (normally http://127.0.0.1:5173). The development API is built into Vite and is the same code that runs on Vercel.

`npm run dev` always uses the local database, even when `.env.local` contains your Neon `DATABASE_URL`, so trying things out never changes live shops. To work against the live Neon database on purpose, run `vercel env pull .env.local` and then `npm run dev:live`. The admin commands (`create-admin`, `reset-password` and so on) do read `DATABASE_URL` from `.env.local`, because they are meant for the live site; their first line of output says which database they used.

1. Create an administrator with `npm run create-admin` (see Accounts and plans) and sign in.
2. The studio opens with three setup steps: the shop's name and type, a menu design, and a few dishes. The shop starts as a draft that only you can see.
3. Add details, logo and cover photo in Business profile, and the rest of the menu in Menu.
4. Press **Publish** in the top bar. A live shop shows **Live** there; **Unpublish** is under the "⋯" menu.
5. Open **QR & print**: choose where the code goes (menu, shop page, feedback page or another website), style it, and download or print a table stand, tent card, sticker or poster.
6. Read customer submissions in Feedback.

## Studio

The owner studio uses a sidebar layout with a shop switcher, light and dark themes, and shareable page links (`#/menu`, `#/inbox` and so on).

- A shop's top bar shows **Draft** or **Live**. A draft has **Save draft** and **Publish**; a live shop has **Save changes**, **View page** and, under "⋯", **Unpublish**. The shop switcher and these buttons only appear on pages about a shop.
- **Overview** for a draft shop shows what to do next instead of empty figures. Once the shop is live it shows QR scans per day (7, 30 or 90 days, as a chart or table), average rating, feedback received, unread feedback, the rating breakdown, recent feedback and a setup checklist. With more than one shop it also lists every shop's figures.
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

**Forgotten password.** Print a new temporary password for any account (including your own administrator account). It signs that account out on every device and asks for a new password at the next sign-in. As above, run `vercel env pull .env.local` first to reset an account on the live site:

```powershell
npm run reset-password -- you@example.com
```

**Client accounts.** Administrators get a **Clients** page in the studio. It can:

- create a client account with a name, email and plan. A 12-character temporary password is generated and shown once, with a button to copy the sign-in details.
- change any account's plan.
- reset a password. This generates a new temporary password and signs the client out everywhere.
- delete an account, together with its shops, feedback and scan history. Administrators cannot delete their own account.
- move any shop to any account under **Shop ownership**. You can set up a shop in your own account, then hand it to the client. Plan limits do not apply to shops assigned this way.

A client signing in with a temporary password must choose their own password (at least 8 characters) before the studio opens. Until then, every shop request is refused.

**Security.** Passwords are hashed with scrypt. Signing in sets an HttpOnly, SameSite=Lax session cookie that lasts 30 days, and it is marked Secure when the site is served over HTTPS. Sign-in is limited to 10 attempts per address every 15 minutes. Owners only ever see and manage their own shops. Requests for another account's shop return 404, so shop IDs are not confirmed. Writes from another origin, and any write that is not a JSON request, are refused.

**My account** shows how many shops the owner can have and lets them change their name and password. Changing the password signs out their other devices. **All shops** can delete a single shop.

**Plans** limit how many shops an owner can create: Free 1, Pro 5, Business 50 (see `src/data/plans.js`). Billing is not connected yet. Administrators set plans on the Accounts page, or with:

```powershell
npm run set-plan -- owner@example.com pro
```

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

Tests run against an in-memory Postgres and cover administrator-created accounts, temporary passwords, password resets, shop hand-over, sign-in, sessions, password changes, account deletion, isolation between accounts, plan limits, import of the old JSON store, shop profiles, updates, draft visibility, persistence across restarts, cross-origin and non-JSON write rejection, per-shop feedback, visit pruning, malformed browser storage, URL validation and menu prices.

## Menu templates and design settings

Menu → Design has 23 templates in six collections: cafés and bakeries, restaurants, fast food and street food, bars and lounges, healthy food and desserts, and shops and services. They include Italian, pizza, sushi, Indian and Sri Lankan curry, tacos, steakhouse, seafood, fine dining, noodles, brunch, cocktails, desserts and retro diner designs. Gallery previews use sample dishes and photos; applying a template keeps your items, prices and text, and resets layout, fonts and colours to that template.

Every template can then be customised. Each setting defaults to "Template", which follows the template's own look:

- **Layout:** image cards, side-photo cards, classic rows, compact board or photo tiles; 1–3 columns; shadow, outline, flat or tinted cards; square to extra-round corners; wide, square or circle photos placed left or right; comfortable or compact spacing.
- **Typography:** 19 Google Font pairings (loaded only when used), heading and item alignment, heading size and uppercase headings.
- **Prices and sections:** prices beside or under the name, with dotted leaders or as a price tag; currency or amount only; line, dotted, dashed or no row dividers; pill, underline, boxed or sidebar category navigation; section headings with a rule, centred, as a banner or numbered.
- **Colours:** accent, page background, card and text colours, plus paper, dots, grid, stripes or chalk textures. Text switches between dark and light automatically when a colour choice would make it unreadable.
- **Content:** menu heading and introduction, and switches for the cover, logo header, photos, descriptions, prices, search and category navigation.

The live preview shows the customer page at phone or desktop size. Save the menu to publish design changes to the existing QR destination.

## QR & print

One page for the shop's QR code, saved with the shop:

- **Where the QR code goes:** the menu (the default for new shops), the shop page, the feedback page or another https website. The printed code is the shop's link (`/q/<shop-id>`); change the destination and save, and existing prints follow.
- **QR code style:** colours, frame, caption, rounded corners and an optional logo in the middle. Low-contrast colours are flagged before download.
- **Printed stand or poster:** five looks (Bright, Obsidian & gold, Minimal, Neon, Warm bistro), four sizes (table stand, tent card, sticker, A4 poster), headline and subtitle. A "tap your phone here" line is only added when you switch it on for stands with an NFC tag; to use a tag, write the shop's link to it with any NFC app.
- **Other QR codes:** website, WhatsApp and Wi-Fi codes. These print their content directly, cannot be changed later and are never saved.

Downloads are available once the shop is live and saved. New shops get short IDs (10 characters, for example `/q/k7m2qx9a4b`), which make printed codes less dense; existing shops keep their IDs, so codes already printed keep working.

When WhatsApp, Facebook, Telegram and similar apps fetch a shop link to draw a preview, they get a small page with the shop's name, tagline and cover photo instead of the redirect. These previews and other automated visitors are not counted as scans. Visit totals count scans from phones and browsers, at most 30 a minute from one address.

Subscriptions and billing, password reset email, team members per account, media-file hosting and an AI design assistant are not implemented yet.

Images are uploaded from the device: the logo and cover photo in Business profile, and item photos in Menu. PNG/JPEG/WebP/GIF inputs up to 10 MB are resized and compressed in the browser; transparency is preserved with WebP, and GIF uploads use a still frame. Previews can be replaced or removed. Optimized images are stored with the shop on Save; total profile uploads are checked against the API request limit. Existing image URLs still render, while editing uses file uploads.
