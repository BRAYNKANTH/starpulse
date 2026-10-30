# DQ.lk (starpulse) final audit and system report

Audited on 30 October 2026, on `main` at `aed4533` (merge of PR #12). Live site: https://starpulse-beta.vercel.app

## Summary

The system is in good shape. The production build is green, all 35 tests pass, production dependencies have no known vulnerabilities, and the code scan found no unsafe patterns. The menu templates passed the accessibility re-check on phone and desktop.

There are **no blockers**. Four things need a decision or action from you, and they are listed first under "Action needed".

| Area | Result |
|---|---|
| Lint, build, tests | Pass. 35 tests, 0 failures. Main CI green on the last three merges. |
| Production deploy | `aed4533` deployed successfully. Open pull requests: none. |
| Dependencies (shipped to users) | 0 known vulnerabilities. |
| Dependencies (dev tools only) | 3 flagged: vite, esbuild, source-map-js. They affect the local dev server and build tools, not the live site. |
| Security scan of code | Clean. See "Security". |
| Menu accessibility (25 templates x phone and desktop) | Pass, with two small notes. |
| Live routes and headers | All main pages respond. Security headers present. |

## Action needed

1. **The `/demo` pages show a real restaurant with invented data, and Google can index them.**
   - `/demo` and `/demo/cards` use the real name "Al Maas" with sample dishes and prices that I made up. Nothing on the page says it is a sample.
   - The pages are public and have no `noindex` tag. They are not in the sitemap or blocked in `robots.txt`.
   - The printed menu card's QR opens `/demo`. If that card goes on real tables, customers will see invented prices.
   - Recommended: add a visible "Sample menu" banner and a `noindex` tag to `/demo*`, and get the restaurant's agreement. Do not give the menu card to the restaurant for real use until the menu is real.
2. **Vercel preview deployments fail** with "One or more integration resources failed to provision." Production deploys work. It is probably a limit on per-branch preview databases in the Neon integration (not confirmed). Delete old preview branches in Neon, or turn off preview databases for the integration.
3. **Unknown web addresses return HTTP 200 instead of 404.** For example `/nope-404` shows the app's "page not found" screen but with a success status. This is a "soft 404" and is poor for search engines. The cause is the catch-all rewrite in `vercel.json`.
4. **The review card is not yet a print option in the studio.** It exists only at `/demo/cards`. Real shops cannot print one yet.

## Details

### Build and tests
- Lint clean. Build succeeds in about 5 seconds.
- Main bundle: `index` 237 kB (75 kB compressed). Owner studio: 154 kB (42 kB compressed). CSS: 102 kB (19 kB compressed) plus 64 kB for the studio. These are reasonable.
- Tests: `api` 14, `storage` 7, `auth-reset` 6, `google-place` 4, `qr` 3, `demo-review` 1, plus the new Google destination and lookup tests in `api`. All pass.
- About 8,000 lines across `src`, `server`, `api` and `tests`. 25 menu templates in 6 groups.

### Dependencies
- Production: `npm audit --omit=dev` reports 0 vulnerabilities.
- Dev only: `vite` 5 (path traversal in the dev server's source maps, and an editor-launch issue), `esbuild` (any website can send requests to the dev server) and `source-map-js` (denial of service from crafted source maps). The fix for vite and esbuild is `vite@8`, which is a major upgrade and needs its own testing. `source-map-js` has a normal fix.
- Risk: only while running `npm run dev` on a machine. Do not expose the dev server to the internet.
- `npm outdated` could not reach the registry during the audit, so I did not check for newer versions.

### Security
- No `dangerouslySetInnerHTML`, `innerHTML =`, `eval`, `new Function` or `document.write` in `src`.
- No secrets in tracked files. `.env*`, `.vercel`, `dist` and `node_modules` are ignored. The only match was a placeholder in the README.
- Sessions use an `HttpOnly`, `SameSite=Lax` cookie, `Secure` over HTTPS. Passwords are hashed with scrypt.
- Rate limits on 7 routes (sign-in, password reset, scans and the new Google lookup).
- Writes refuse other origins and anything that is not JSON.
- All the main security headers are present on the live site: HSTS, CSP, `X-Frame-Options: DENY`, `nosniff`, referrer and permissions policies.
- QR redirects: https only, no embedded credentials, private addresses refused, and re-checked on every scan. The new "Google review" destination follows the same rules.
- New Google lookup (`POST /api/google/place`): signed-in accounts only, 30 lookups a minute, only `maps.app.goo.gl` short links, only Google hosts along the redirect chain, at most 5 hops. Live check: it returns 401 when signed out.

### Accessibility (public menu, all 25 templates at 390 px and 1280 px, 50 renders)
- No sideways page overflow.
- No text-contrast failures (text over photos was skipped).
- No clickable item under the 24 px minimum, and none under 44 px high.
- Focus ring colour is at least 4.6:1 against the page in every template.
- The shop name appears in the pinned bar in every template.
- Notes: the "Powered by DQ.lk" footer text is 11.3 px (below the 12 px we use elsewhere), and one element on desktop measured 10.4 px that I did not identify.
- Not covered: screen-reader testing, keyboard-only walkthrough, real devices, and the owner studio screens.

### Live site (https://starpulse-beta.vercel.app)
- `/`, `/pricing`, `/about`, `/contact`, `/terms`, `/privacy`, `/signin`, `/demo`, `/demo/cards`: all respond with 200.
- `/demo/review`: 307 redirect to Google's review form for Al-maas Wattala (`ChIJAzAcyndY4joRuKjmzPLJEt8`). That ID opened the right review box in a signed-in Chrome.
- `robots.txt` and `sitemap.xml` are present. The sitemap lists the 6 public marketing pages.

### What changed in this project
Menu accessibility fixes, the 4 x 6 table stand, Al Maas demo shop with LKR prices, two premium print cards, a pinned and scrolling category bar with the shop name, denser phone menu with clear gaps between categories, the direct Google review redirect, and the studio's "Build the link" tool plus a "Google review" QR destination. PRs #4 to #12 are all merged.

### Housekeeping
- 13 merged branches remain on GitHub and can be deleted.
- There is no `.gitattributes` and `core.autocrlf` is on, which causes the "LF will be replaced by CRLF" warnings. Adding one is a small fix.

### Not tested
- Real phones (pinned bar, smooth scrolling, QR scanning of the printed cards).
- A real `maps.app.goo.gl` short link through the new lookup, and the "Google review" QR on the live site.
- Performance scores, screen readers, load, database backup and restore, and password-reset email delivery.

## Suggested next steps, in order
1. Add a "Sample menu" banner and `noindex` to `/demo*` (and decide about the restaurant's agreement).
2. Clear old Neon preview branches so previews deploy again.
3. Return a real 404 status for unknown pages.
4. Add the review card as a print option in the studio.
5. Plan the vite 8 upgrade and test it.
6. Test the printed cards and the pinned bar on a real phone.
