# StarPulse — shop pages, menus and QR posters

React + Vite owner studio with a Node.js API. Business owners sign up for their own account; each shop has its own saved profile, landing page, searchable menu, QR destinations and feedback inbox.

## Development

Use Node.js 22.13 or later (the database uses the built-in `node:sqlite` module, so there is nothing native to install).

```powershell
npm install
npm run dev
```

Open the address printed by Vite (normally http://127.0.0.1:5173). The development API is built into Vite and uses the same accounts and database as production. Customer pages use the same API as production.

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

Daily scan and feedback counts use the server's local date. Set `TZ` (for example `TZ=Asia/Colombo`) to choose the time zone. Daily scan counts are kept for 120 days; the all-time total is kept indefinitely. Scans are written straight to the database.

## Accounts and plans

There is no public sign-up. An administrator creates every account and gives the client their sign-in details.

**First administrator.** Create it once from the server, then sign in with the printed temporary password:

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

**Plans** limit how many shops an owner can create: Free 1, Pro 5, Business 50 (see `src/data/plans.js`). Billing is not connected yet. Administrators set plans on the Accounts page, or from the server:

```powershell
npm run set-plan -- owner@example.com pro
```

## Production

```powershell
npm run build
$env:PORT = '3000'
npm start
```

The Node server serves both `dist` and `/api`. Deploy the entire application behind HTTPS. The default listen address is 127.0.0.1; set HOST=0.0.0.0 when your hosting platform requires it. Hosting only the static dist directory will not provide menus, profiles or feedback.

Accounts, sessions, shops, feedback and QR visit counts are stored in the SQLite database `.data/starpulse.db` (WAL mode, ignored by Git). Set DATA_DIR to an absolute persistent storage directory on your host, and back up the `.db` file together with its `-wal` file, or use `sqlite3 starpulse.db ".backup backup.db"`. Run one server per data directory. For several servers behind a load balancer, move to a networked database such as Postgres.

**Upgrading from the single-owner version:** on first start, an existing `.data/store.json` (and `visits.json`) is imported into the database once. The old files are left in place as a backup. Imported shops keep working for customers and their printed QR codes, but no account owns them yet. Assign each one to an account under **Accounts → Shop ownership**, or give them all to one account from the server:

```powershell
npm run claim-shops -- you@example.com
```

`OWNER_KEY` is no longer used.

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

Tests cover administrator-created accounts, temporary passwords, password resets, shop hand-over, sign-in, sessions, password changes, account deletion, isolation between accounts, plan limits, import of the old JSON store, shop profiles, updates, draft visibility, persistence across restarts, cross-origin and non-JSON write rejection, per-shop feedback, visit pruning, malformed browser storage, URL validation and menu prices.

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

Subscriptions and billing, password reset email, team members per account, media-file hosting and an AI design assistant are not implemented yet.

Images can be uploaded from the device in Business Studio and Menu Builder: logo, cover photo, and each menu item photo. PNG/JPEG/WebP/GIF inputs up to 10 MB are resized and compressed in the browser; transparency is preserved with WebP, and GIF uploads use a still frame. Previews can be replaced or removed. Optimized images are stored with the shop on Save; total profile uploads are checked against the API request limit. Existing image URLs still render, while editing uses file uploads.
