# Assisted sales checklist — completing a paid plan upgrade end-to-end

DQ.lk has **no checkout, trial, invoice, or automatic upgrade**. Plans are
changed by an administrator, after payment is confirmed offline. This is the
procedure for every paid upgrade or new paid account. Do not promise a buyer
an automatic upgrade, a trial period, or an invoice from the site — none of
those exist.

## The flow the buyer sees

1. The buyer reads `/pricing` (Free: 1 shop, Pro: 5 shops, Business: 50 shops,
   all marked "Contact to buy" — no prices are published on the site).
2. The buyer contacts the administrator with: account email, current plan,
   desired plan, and how many shops they need.
3. The administrator confirms payment offline, then sets the plan.
4. The buyer's new shop limit applies immediately; they refresh their
   Account page to see it.

## Administrator steps (for each sale)

- [ ] **Receive the request.** Confirm the account email, current plan,
      desired plan (free / pro / business), and shop count. If the buyer has
      no account yet, create one first (Accounts page, or
      `npm run create-admin` for an administrator) and give them the
      temporary password — they must replace it on first sign-in.
- [ ] **Confirm payment offline.** Record how and when payment was received,
      outside DQ.lk. Do not mark a plan as paid until payment is confirmed.
- [ ] **Set the plan.** Either:
      - Studio: **Accounts** → find the account → change its plan, or
      - CLI: `npm run set-plan -- owner@example.com pro`
      (for the live site, run `vercel env pull .env.local` first so the
      command writes to Neon, as described in the README).
- [ ] **Verify the limit.** Sign in as, or ask, the buyer to refresh
      **Account & plan**: the plan name and "X of N shops" must show the new
      plan. Then confirm the buyer can actually create a shop up to the new
      limit — a plan change that only looks right on screen is not verified.
- [ ] **Notify the buyer.** Tell them the plan is active, the new shop
      limit, and that they should refresh their Account page if it still
      shows the old plan. Keep the payment confirmation with the sale record.
- [ ] **If the buyer cannot sign in,** do not share their password. Use
      **Accounts → reset password** (temporary password, signs them out
      everywhere) or point them to **Forgot password?** on `/signin`, which
      emails a single-use link valid for 1 hour (see README, "Password
      reset by email" — SMTP must be configured in Vercel for the email
      to send).

## What not to do

- Do not invent a price in a message, on a page, or in the studio — prices
  are not published until the owner confirms them.
- Do not tell a buyer they can pay, trial, or upgrade on the site itself.
- Do not change a plan before payment is confirmed offline.
- Do not log, email, or paste a temporary password anywhere except the
  one-time handover to the account owner.
- Do not use a plan change to bypass shop limits for an unpaid account:
  plan limits are enforced server-side, and assigned shops (via
  **Shop ownership**) do not count against the recipient's plan limit —
  use that feature only for shops you set up yourself, as documented.

## Verification after a sale (the C4 acceptance test)

1. Buyer contacts the administrator (step 1 above) — no form on the site
   submits a plan request anywhere.
2. Administrator sets the plan (Accounts page or `set-plan` CLI).
3. Buyer refreshes **Account & plan** and sees the new plan and limit.
4. Buyer creates a shop within the new limit, and is refused beyond it.
