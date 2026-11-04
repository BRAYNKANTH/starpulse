# Speed and accessibility audit

Audited 4 November 2026 on the live site (https://starpulse-beta.vercel.app) and a local production build. The figures below are from before the fixes.

## After the fixes (local build; live figures still to be measured after deployment)

| Check | Before | After |
|---|---|---|
| axe-core, page states with no problems | 18 of 36 | 36 of 36 |
| One keystroke in a dish's name (4x slower CPU) | 300 to 540 ms | Mostly 120 to 190 ms, with one 686 ms outlier |
| Studio pages that scroll sideways on a phone | 2 | 0 |
| Fonts downloaded on public pages | Inter and Plus Jakarta Sans | Inter only |
| Database statements when a server instance starts on a current database | 15 | 1 |
| Database requests per counted QR scan | 4, or 5 on the day's first scan | 2, or 3 on the day's first scan |

Not changed: unused JavaScript and CSS (fix 7, the smallest gain). Font weights were not trimmed, because the families are single variable files and fewer weights would not reduce the download.

## Summary

- **Speed:** public pages are usable but slow on phones. Largest content appears in about 2.8 to 4.5 seconds on slow 4G. The biggest cause is the server's location: it runs in Washington (`iad1`), while the database is in Singapore (`ap-southeast-1`).
- **Accessibility:** customer pages and public pages are in good shape. The studio has a small number of repeated problems, mostly contrast, wide tables on phones, and keyboard navigation.

## Speed

### Live page load (Lighthouse, mobile: slow 4G, 4x slower CPU; middle of 3 runs)

| Page | Speed score | First content | Largest content | Blocking time | Layout shift | Download |
|---|---|---|---|---|---|---|
| `/` | 87 | 3.0 s | 3.0 s | 0 ms | 0.038 | 177 KB |
| `/pricing` | 91 | 2.2 s | 3.1 s | 84 ms | 0.001 | 177 KB |
| `/about` | 82 | 3.2 s | 3.2 s | 0 ms | 0.005 | 177 KB |
| `/contact` | 91 | 1.9 s | 2.8 s | 48 ms | 0.021 | 177 KB |
| `/signin` | 72 | 2.5 s | 4.5 s | 90 ms | 0 | 239 KB |
| `/demo` | 85 | 2.0 s | 3.4 s | 188 ms | 0 | 226 KB |
| `/demo/cards` | 85 | 2.4 s | 3.3 s | 187 ms | 0 | 141 KB |
| Shop page `/?biz=al-maas` | 72 | 4.4 s | 4.4 s | 0 ms | 0.001 | 258 KB |
| Customer menu `view=menu` | 73 | 4.1 s | 4.1 s | 0 ms | 0 | 212 KB |
| Feedback `view=review` | 78 | 3.6 s | 3.6 s | 0 ms | 0.002 | 178 KB |

Google's target for largest content is under 2.5 s. No page met it.

### Live server response (time to first byte, 7 requests each, from the computer used for this audit)

| Route | Fastest | Typical | Slowest |
|---|---|---|---|
| Static pages (`/`, `/pricing`, `/about`, `/contact`, `/terms`, `/privacy`) | 255 ms | 287 to 323 ms | 635 ms |
| `/signin` | 268 ms | 331 ms | 2.3 s |
| `/demo` | 308 ms | 828 ms | 3.1 s |
| `/?biz=al-maas&view=menu` (page file only) | 279 ms | 1.9 s | 12 s |
| `/api/auth/me` (no database query) | 557 ms | 595 ms | 3.1 s |
| Unknown shop (1 database query) | 731 ms | 764 ms | 1.3 s |
| `/q/al-maas`, not counted as a scan | 955 ms | 1.0 s | 1.2 s |
| `/q/al-maas`, counted as a scan (one sample) | | 2.6 s | |

The slow extremes come and go, and this connection also varied in other tests, so treat them as signs of instability, not exact figures. From this computer, a database query takes about 80 ms once connected.

### Studio (local build, 4x slower CPU, network time excluded)

| Action | Time |
|---|---|
| Reload Overview | 1.4 to 1.6 s |
| Reload Menu (72 dishes) | 2.3 to 3.9 s |
| Reload QR & print | 1.2 to 2.8 s |
| Switch to Menu / QR & print / Feedback / Business profile | About 1.5 / 1.3 / 1.0 / 1.0 s |
| One keystroke in a dish's name | 300 to 540 ms |
| Opening Menu → Design | 23 font files, about 20 KB as measured |

Studio speed on the live site was not measured because it needs a login. Every studio request adds the server-to-database delay above, so the live studio will be slower than these figures.

### Speed fixes, most valuable first

1. **Move the server to Singapore.** Add `"regions": ["sin1"]` to `vercel.json`. Measured: `X-Vercel-Id: sin1::iad1`. Requests from the audit computer entered Vercel in Singapore, went on to Washington, and each database query then had to reach Singapore from there. The size of the gain needs measuring after deployment.
2. **Cache app files for a year.** `/assets/*` files have version codes in their names but are sent with `max-age=0, must-revalidate`, so returning visitors must re-check each one. Add a `Cache-Control: public, max-age=31536000, immutable` rule for `/assets/(.*)`.
3. **Make QR scans faster.** A counted scan reads the shop, checks the rate limit and records the visit, one after another, before redirecting. Combine these queries, or record the visit after responding using Vercel's `waitUntil`.
4. **Stop running database setup on every cold start.** `createStore` runs 15 setup statements one at a time whenever a new server instance starts. Run them at deploy time instead, or skip them when the schema is already current.
5. **Load fewer fonts.** Fonts are about 74 KB of the 177 KB on a typical page. `index.html` asks for 14 weights across three families, and customer pages then add their template's font. Keep only the weights in use, and consider hosting them on the site.
6. **Make the menu editor lighter.** Typing re-renders the editor, which has about 2,300 page elements with 72 dishes. Memoise the dish rows and render only the open editor's form.
7. **Trim the first download.** Lighthouse found about 30 to 36 KB of unused JavaScript and 20 KB of unused CSS on public pages. This is the smallest gain of the group.

## Accessibility

### Results

- **Lighthouse on live public pages:** 100 on 9 of 10 pages, and 95 on `/demo/cards`.
- **axe-core (WCAG 2.0 and 2.1 A and AA, plus best practices):** 36 page states scanned, on desktop and phone sizes, with 18 fully clean. Sign-in and all three customer pages are clean on both sizes.
- **Keyboard (Menu page, first 25 Tab stops):** every stop has a visible focus style. The action menu closes on Escape and returns focus to its button.
- **Also in place:** `lang="en"`, zoom not blocked, reduced-motion styles, and main and navigation landmarks.

### Problems found

| # | Severity | Problem | Where | WCAG |
|---|---|---|---|---|
| 1 | Serious | Sidebar section labels have low contrast: 3.04:1 in light mode, 3.38:1 in dark. They need 4.5:1 | Every studio page, desktop | 1.4.3 |
| 2 | Serious | QR preview image has no text alternative | QR & print | 1.1.1 |
| 3 | Serious | Dark mode contrast: primary button 3.67:1, category counts 4.36:1, and "Aa" sample 1.13:1 | Menu, QR & print | 1.4.3 |
| 4 | Serious | Link text is dark blue on a dark background, 1.99:1 | `/demo/cards` | 1.4.3 |
| 5 | Serious | Tables make the whole page scroll sideways on phones: 608 px on All shops, 407 px on Clients, on a 375 px screen | All shops, Clients | 1.4.10 |
| 6 | Moderate | Quick-tag remove buttons are 12 × 12 px on a phone. The minimum is 24 × 24 px | Business profile | 2.5.8 (WCAG 2.2) |
| 7 | Moderate | No skip link, so keyboard users Tab about 15 times to reach the Menu page's content | Every studio page | 2.4.1 |
| 8 | Moderate | The page title stays the same across studio pages, and page changes aren't announced to screen readers | Every studio page | 2.4.2, 4.1.3 |
| 9 | Minor | The Design preview's `aside` is nested inside another landmark | Menu → Design | Best practice |

QR & print's style radio buttons measure 13 × 13 px on a phone. Check by hand whether their labels make the tap area big enough.

## What this audit didn't cover

- Automated tools find only part of all accessibility problems. No screen reader or real-user testing was done.
- Studio speed and studio accessibility were measured on the local build, not the live site, using a sample shop.
- Lighthouse simulates a phone. Real phones and networks in Sri Lanka will differ.
- The region fix's gain is an expectation until it is deployed and measured again.
