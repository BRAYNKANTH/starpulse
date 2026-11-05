# DQ.lk — UX/UI Audit

**Scope** public site, demo customer pages, owner studio, admin Clients page, first-run setup · **Accounts** local sample owner, throwaway local admin · **Viewports** 375×812, 1280×800, 1440×900 · **Date** 2026-11-05 · **Code** `main` at 875ca8e on the local dev server, with local data

## Status after fixes (5 November 2026)

The findings below describe the app before these fixes. Lint, all 40 tests and the build pass.

- **Fixed:** 02, 03, 04, 05, 09, 12, 14, 16, the wording in 07 and 08, most of 11, and in 20 the unstyled print button, list padding and phone nav. The sign-in page in 18 now links to `/contact`.
- **Still open, needs your input:** 01 (a real contact channel; the wording is cleaned up, but customers still can't reach you), the date and legal entity in 08, and a qualified review of 07 and 08.
- **Still open, needs code:** 06, 10, 13, 15, 17, 19, and the rest of 18.
- **Left as is:** in 11, the Ratings card has no button because the Recent feedback card beside it now has one.

## Summary

| | Count |
|---|---|
| Critical | 2 |
| Major | 9 |
| Accessibility | 3 |
| Note | 6 |

The build quality is good. Contrast, labels, focus handling and phone layouts held up across light and dark themes, and most fixes from the 4 November audit were still in place on the screens I re-measured. The problems are about meaning: the path to buying has no end, one plan promises something it doesn't include, and several pieces of copy disagree with the product or read like internal notes. Most of the fixes are copy changes.

---

## Findings

### 01 · Critical · /contact, and every "contact the administrator" link

**A prospective customer has no way to contact you.**

There is no public sign-up, so every sale depends on contact. The home page, Pricing and sign-in all send people to an administrator, and `/contact` has no address, phone number or form. Its fallback only works for people who already have an account.

```
/contact   tel/mailto/WhatsApp links: 0    email addresses in the text: 0
"Contact details are to be confirmed by the owner — no phone number, email
 address or postal address is published here yet"
"Until then, use the administrator contact you were given when your account
 was set up."
meta description: "contact details are to be confirmed by the owner."
/signin    "Need an account? Contact your DQ.lk administrator." (not a link)
Studio     My account and the shop-limit message both say "contact your administrator"
```

**Fix:** publish one real channel (WhatsApp suits this market) as a button on `/contact`, Pricing and sign-in. Remove the "to be confirmed" wording, including from the meta description.

---

### 02 · Critical · /pricing

**The Business plan promises client accounts, which that plan doesn't include.**

A buyer such as an agency would pay for this and find nothing there. Creating client accounts needs the administrator role, not a plan. The plan data only holds a shop limit.

```
Pricing:           "For agencies and larger groups, including client accounts."
src/data/plans.js: business: { id: 'business', name: 'Business', shops: 50 }
server/api.mjs:184 if (user.role !== 'admin') → 403 "Only administrators can manage accounts."
Sidebar.jsx:5      Clients is hidden unless user.role === 'admin'
```

**Fix:** remove "including client accounts" from Pricing, or build the feature first. This rendered value matches what `PublicPages.jsx` holds, so it is a content fix.

---

### 03 · Major · /pricing

**The Free plan tells people to buy it.**

All three cards share the same text, so the free tier reads as a purchase with an unknown price.

```
Free · 1 shop · "Contact to buy"
"No price is published yet and no payment is taken on this site."
```

**Fix:** give Free its own wording, such as "Free — ask for an account". Keep "Contact to buy" for Pro and Business.

---

### 04 · Major · /pricing, /contact, My account

**Internal operating details are shown to customers, under two names.**

Customers don't need to know about a command-line tool, and they can't see the admin page these lines mention. The same page also has two names.

```
/pricing     "The administrator sets your plan on the Accounts page or with the set-plan command."
My account   "...sets your plan on the Clients page or with the set-plan command..."
Admin page   <h1>Clients</h1>
/pricing     "(assisted only)", "refresh your Account page"; the sidebar says "My account"
```

**Fix:** tell the customer only what they do and what happens: "Message us, pay, and we'll upgrade your account." Use "Clients" and "My account" everywhere.

---

### 05 · Major · Home page

**The home page has no next step for a new visitor, and the live demo isn't linked.**

The only filled button is "Sign in", which is useless without an account. The way forward is a text link in the last paragraph of a page 1,749 px tall on a phone. A working demo exists at `/demo`, but no public page links to it. This is the cheapest fix for conversion, because the demo is already built.

```
Filled controls on /:  "Sign in" (rgb(56,94,67))
"See plans":           inline text link, 74×20, last paragraph
Links to /demo in PublicPages.jsx: 0
```

**Fix:** add two buttons under the headline: "See a live menu" (`/demo`) and "Talk to us" (`/contact`, once 01 is fixed).

---

### 06 · Major · Customer feedback page

**"On Google, or both" isn't what happens: sending privately removes the Google button.**

The page offers both. After "Send to the team", the Google button is gone, so anyone taking the page at its word loses the option. In the other order, the rating is recorded twice, which skews the shop's average and counts. I read this from the code and didn't submit a test.

```
CustomerFunnel.jsx:53  "Every rating is welcome. Share it with our team, on Google, or both."
CustomerFunnel.jsx:71  sent ? <thank-you message> : <both buttons>
CustomerFunnel.jsx:34  the Google button POSTs feedback when a rating is selected
CustomerFunnel.jsx:43  Send POSTs feedback again
server/api.mjs:288     only a rate limit (20 a minute), no duplicate check
```

**Fix:** keep the Google button on the thank-you state. Record one response per visit by reusing its ID, so a second action updates it rather than adding another.

---

### 07 · Major · /privacy, Overview

**The Privacy Policy leaves out IP addresses and Google Fonts, and the scan chart contradicts it.**

The policy lists what is collected, but addresses are used in rate-limit keys and customers' phones request fonts from Google. Separately, the owner's chart says bots are included while the policy and the server say they are filtered out. Please have someone qualified review the policy; this is not legal advice.

```
/privacy                "automated crawlers are filtered out"
Dashboard.jsx:68        "Last 30 days · includes test scans and bots"
server/api.mjs:65       looksAutomated() / isLinkPreviewer() skip recordScan
server/api.mjs:65       rate-limit key `scan:${clientAddress(req)}:${id}`
server/store.mjs:145    expired rate-limit rows deleted after 1 day, on 1% of requests
menuFonts.js:43         fonts.googleapis.com
/privacy                "Images are stored with your shop data." (they now have their own table)
```

**Fix:** add IP addresses, their purpose and retention, and Google Fonts to the policy, or host fonts yourself. Change the chart caption to "may include your own test scans".

---

### 08 · Major · /terms

**The Terms of Service call themselves a draft.**

Businesses are asked to accept these terms, and the opening line undercuts them. They also have no date, operator name or contact point.

```
"These are the starter terms for using DQ.lk."
```

**Fix:** remove "starter" and add an effective date, legal entity and contact address. Have a lawyer review them before charging for plans.

---

### 09 · Major · Public pages vs the product

**The template count is wrong everywhere customers read it.**

This undersells the product and contradicts its own sign-in page.

```
src/data/menuDesign.js  MENU_TEMPLATES.length = 25
Menu → Design           "25 designs"
AuthScreen.jsx:6        "25 designer templates"
PublicPages.jsx:21,118,192,200   "23"
```

**Fix:** use `MENU_TEMPLATES.length`, or "25+", so the number can't drift. The public pages may need a lazy import to avoid adding the data to their first download.

---

### 10 · Major · Customer menu, phone

**A customer who scans the QR code has to scroll to reach the first dish.**

This is the most-used screen in the product, and people are standing or sitting with their phone out, wanting food. The heading stack takes up almost the whole first screen.

```
375×812, /demo   first dish heading at y = 776 of 812
                 banner 62 px (demo only, so about y = 714 on a real shop)
                 shop nav 141 px, then cover photo, kicker, heading, search, tabs
                 "Al Maas" appears again directly above the category tabs
Real shop page:  measured on /demo only; the live design may differ
```

**Fix:** on phones, shrink or remove the cover on the menu view, and drop the repeated shop name. Aim for at least two dishes on the first screen.

---

### 11 · Major · New shops: Overview, Feedback

**Feedback empty states are dead ends.**

A new owner reaches these first, and the next step (print a QR code, or share the feedback page) isn't offered. The scan chart's empty state does this properly, with a "Print your QR code" button. I read these from the code, because the sample shop has data.

```
Dashboard.jsx:77       "Ratings appear when customers use your feedback page."   → 0 buttons
Dashboard.jsx:87       "No feedback yet."                                        → 0 buttons
FeedbackInbox.jsx:91   "No feedback yet. Responses from your customer page..."   → 0 buttons
Dashboard.jsx:71       "No scans in this period yet." → "Print your QR code"     ✓
```

**Fix:** copy the scan chart's pattern, with a button pointing to QR & print with the Feedback page as the destination.

---

### 12 · Accessibility · WCAG 1.4.11 · Public pages

**The focus ring on the public site is 2.52:1; 3:1 is required.**

The ring exists and is thick enough. Only its colour fails on light backgrounds. The sign-in page (5.17:1) and customer pages (7.87:1) pass, so this is the shared default.

```
src/index.css:19   outline: 3px solid #60a5fa; outline-offset: 3px
ground:            rgb(255, 254, 249)
ratio:             2.52:1      required ≥ 3:1
```

**Fix:** on light themes use a darker blue. `#2563eb`, which sign-in already uses, measures 5.17:1 on white.

---

### 13 · Accessibility · WCAG 4.1.2 · New shop setup

**The business type choices are announced as radios but don't behave like them.**

Each option is a separate Tab stop with no arrow-key handling, which is not how a radio group works for keyboard and screen reader users. `aria-pressed` also isn't valid on `role="radio"`. Read from the code.

```
ShopSetup.jsx:40  role="radio" aria-checked={…} aria-pressed={…} onClick={…}
                  no onKeyDown, no roving tabindex
```

**Fix:** use real `<input type="radio">` elements styled as buttons, and remove `aria-pressed`.

---

### 14 · Accessibility · WCAG 2.5.8 · Business profile

**"Test review link" measures 107×15 px at both widths, below the 24 px minimum.**

WCAG allows smaller targets with enough clear space around them. I did not measure the spacing, so treat this as likely rather than certain. The fix is cheap either way.

**Fix:** give the link `min-height: 24px`, or style it as a small button.

---

### 15 · Note · QR & print, phone

The preview sits far below the controls it reflects, so owners change a colour and can't see the result. The sticky preview is deliberately turned off on small screens (`studio.css:481`).

```
375×812   style controls from y = 1025, poster controls from y = 1710
          preview at y = 2545, Download at y = 3082, page height 3225
```

**Fix:** add a small floating preview, or a "See preview" button that jumps to it.

### 16 · Note · Menu editor, phone

Dish names and descriptions are cut to 157 px, and names lose their endings: "Hyderabadi chicken dum biryani" needs 218 px. On a menu of similar names, the ending is what tells dishes apart.

**Fix:** let names wrap to two lines.

### 17 · Note · First-run setup

Until a shop exists, every shop link in the sidebar opens setup while the page title names something else. At `#/inbox` the title is "Feedback | DQ.lk" and the heading is "Let's set up your shop".

**Fix:** disable those links during setup, or use a "New shop" title.

### 18 · Note · Sign-in

The page has no link back to the public site (0 links), and its title stays on the generic "DQ.lk | Branded QR & Digital Menu Studio". Its primary colour is blue, `rgb(37,99,235)`, while the public site's is green, `rgb(56,94,67)`, so it can feel like a different product. In the studio, the address stays at `/signin#/menu`.

### 19 · Note · Page metadata

Customer shop pages use the studio's sales description ("Create branded QR codes, editable digital menus…"). `index.html` has 0 `og:` tags, so public pages have no designed preview on WhatsApp or Facebook. QR links already handle this well on the server.

### 20 · Note · /demo, /demo/cards, public site lists

- "Print both cards" is unstyled on a direct load: 28 px tall, `2px outset` border, 0 padding. `.btn-primary` is only defined in `studio.css`, which this page doesn't import.
- The demo uses a real restaurant's name with invented prices, and the review card leads to its real Google listing. The demo says the prices are examples. I could not verify whether Al Maas has agreed to this, so please confirm it.
- On public pages, lists have 0 left padding, so the numbers on `/contact` sit against the screen edge at 375 px.
- On phones the public nav wraps to two rows and takes up 174 px (21% of the screen). Terms and Privacy could live in the footer only.

---

## What works

- **Contrast:** 0 failures in every text check that could be measured, on public, customer and studio pages at both sizes, and in dark mode for all 7 studio pages. Hero text over photos could not be measured (see limits).
- **Phone layout:** no sideways page scroll on any of the 7 studio pages at 375 px (`scrollWidth` = 375). Wide tables scroll inside their own containers.
- **Honest copy:** the About page's "What DQ.lk does not do" section and the Feedback page's "Google link clicks don't confirm that a review was posted" build trust. Keep these.
- **Google link fairness:** the link is shown at every rating, with no review gating.
- **Printed card claims match the data:** "72 dishes · 15 kinds of rice" is exactly 72 items and 15 in Rice varieties.
- **Protection against lost work:** a browser warning covers unsaved changes, and deletes, sign-out and shop switching ask for confirmation first.
- **Tap targets:** the QR radios look like 13×13, but their labels make the real target 220×85 or larger. This settles the question left open in the last audit. Rating stars are 52×52.
- **Forms:** every sign-in field has a real label, with `autocomplete` set to `email` and `current-password`.
- **Keyboard and titles:** the studio has a skip link, and titles change per page. Customer page focus rings measure 7.87:1.
- **Error pages:** the 404 and "This shop isn't available" pages explain what happened in plain language. The 404 offers links onward.

---

## Where to start

Ranked by impact ÷ effort. This order is my judgment, not a standard.

| | Action | Findings | Why |
|---|---|---|---|
| 1 | Publish a real contact channel | 01 | Nobody can buy until this exists |
| 2 | Remove "including client accounts" | 02 | One line; removes a false promise |
| 3 | Add home page buttons and link the demo | 05 | The demo already exists |
| 4 | Rewrite Pricing copy | 03, 04 | Copy only, on your most important page |
| 5 | Fix template count, chart caption, "starter" | 07, 08, 09 | Small edits that remove contradictions |
| 6 | Change the focus ring colour | 12 | One line of CSS |
| 7 | Fix the feedback page | 06 | Protects the accuracy of the owner's data |
| 8 | Complete the Privacy Policy and Terms | 07, 08 | Needed before you take money |
| 9 | Bring dishes up on the phone menu | 10 | Helps every customer who scans |
| 10 | Add empty-state actions | 11 | Guides new owners to their first result |

---

## Method and limits

Browser audit using measurement scripts on the running app, plus a full read of the visible text and a check of each contradiction against its source. Accessibility findings are judged against WCAG 2.2. Usability findings are reasoned arguments, not standards. Severity is my own judgment. No house design system or style guide was found in the repo.

**Not verified or not covered:**

- **Speed:** not assessed. Dev server timings say nothing about production.
- **Live site:** only checked that `/`, `/demo`, `/demo/cards` and `/contact` respond, and that `/demo/review` redirects to Google. All measurements are from local code, and the live deployment may differ from `main`.
- **Read from code, not run:** findings 06, 11 and 13. No test feedback was submitted.
- **Reset and first-sign-in password screens, and the later setup steps:** only partly reviewed from source. No shop was created.
- **Hero text over photos:** contrast can't be calculated from the DOM, and the screenshot looked readable.
- **Clients page:** content was read, but the app window was hidden during that run, so its layout and tap targets were not measured.
- **Not run:** Arabic/RTL and cross-language checks, because the product is English-only. Sinhala and Tamil customers are a product question for you.
- **Not tested:** screen readers, 200%/400% zoom, Windows High Contrast Mode, real phones.
