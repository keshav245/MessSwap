# MessSwap v2

A clean rebuild of MessSwap: plain Next.js (App Router) + Supabase, deployed
natively on Vercel. No Lovable, no Nitro presets — just a normal Next.js app
you can edit freely.

This is a brand-new project. It does **not** touch or depend on the original
`keshav245/messswap` repo or its Supabase project in any way.

## The mechanism

1. **Hostler uploads a QR.** Won't eat a meal? Upload its mess QR (PNG) for
   one of four fixed slots — Breakfast (7–9:30 AM), Lunch (12:30–2:30 PM),
   Snack (4:30–6 PM), Dinner (7:30–9:30 PM). It's live for 12 hours, then
   auto-expires.
2. **Day scholar browses & pays.** They pick an available meal, scan the
   owner's Paytm/UPI QR, pay ₹40, and upload a screenshot of the payment.
3. **Owner verifies.** The request shows up in the owner console as
   *Pending*, with the payment screenshot attached.
4. **Approve → QR released.** One click reveals the meal QR in the day
   scholar's "Your meal QR codes" section (Open + Download), marks the
   listing *Used*, and credits the hostler ₹30.

No Razorpay — payment is verified manually via screenshot, by design (see
"Payments" below for how to add Razorpay later if you want it).

## Roles

**Hostler** — upload a QR per slot · see own listings (Not used / Used) ·
delete unused listings · upload a payout QR so the owner can pay them ₹30 ·
listings auto-expire after 12h.

**Day Scholar** — browse by slot · pay ₹40 and submit a screenshot · track
request status (Pending → Approved/Rejected) · "Your meal QR codes" with
Open/Download · full request history.

**Owner (Admin)** — review every pending request with payment screenshot +
meal QR + hostler's payout QR side by side · one-click Approve/Reject ·
search & browse all users, their roles, contact info, and earnings ·
upload the QR day scholars pay into.

## Stack

Next.js 14 (App Router, TypeScript) · Tailwind CSS · Supabase (Postgres +
Auth + Storage), via `@supabase/ssr` · deploys to Vercel with zero config.

## 1. Set up Supabase

**Starting fresh?** Run [`supabase/schema.sql`](./supabase/schema.sql) in a
new project's SQL editor — it sets up everything in one go.

**Already deployed the earlier version of this app?** Run
[`supabase/migration_003_full_mechanism.sql`](./supabase/migration_003_full_mechanism.sql)
instead. It's additive/transformative but keeps your existing accounts —
read the comments at the top before running it.

Either way, at the bottom of the file there's a commented line — after
running the rest, uncomment it, put in your own email, and run just that
line to make yourself the owner:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

Then go to **Project Settings → API** and copy the **Project URL** and
`anon` public key.

## 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in the two Supabase values from step 1. The email vars are optional —
see "Email alerts" below.

## 3. Run it locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Register as a hostler,
a day scholar, and promote a third account (or yourself) to admin via SQL to
try the full flow end to end.

## 4. Deploy to Vercel

1. Push this folder to a **new** GitHub repo (files at the repo root, not
   nested in a subfolder).
2. In Vercel: **Add New → Project → Import** that repo — Next.js is
   auto-detected.
3. Add the environment variables from step 2, then deploy.
4. `vercel.json` already registers a daily cron (`/api/cron/cleanup`) that
   sweeps any listing past its 12-hour window. This runs once a day (the
   max frequency Vercel's Hobby plan allows) — it's just housekeeping,
   though, since listings already stop showing up for day scholars the
   moment they pass 12 hours regardless of when the sweep runs.

## Email alerts (optional)

To get an email when a new request comes in:

1. Create a free [Resend](https://resend.com) account, verify a sender (or
   use their shared `onboarding@resend.dev` for testing), and grab an API key.
2. Set `RESEND_API_KEY` and `OWNER_EMAIL` in your environment (locally and
   in Vercel). Leave them unset to skip email entirely — nothing else
   breaks if you do.

## Payments (optional upgrade path)

Screenshot verification works fine at small scale but doesn't stop someone
uploading a fake or reused screenshot. If you want real verification later,
swap the `payment-screenshots` upload step in `BrowseListings.tsx` for a
Razorpay order + webhook that confirms payment server-side before calling
`create_request`.

## Security notes

- Meal QR images sit in a **public** Supabase Storage bucket (so the app can
  show them via plain URLs) at unguessable per-listing paths. The real
  access control is the `listing_qr` table's row-level security — a day
  scholar can only look up a listing's `image_path` after their request is
  approved. Someone with the raw file URL in hand could still view it
  directly; that's an inherent tradeoff of using public storage URLs.
- Payment screenshots and payout QRs are **private** buckets — only the
  uploader and the admin can generate a signed URL to view them.
- New accounts can only ever be `hosteller` or `day_scholar`. `admin` is
  granted exclusively via a manual SQL update, never through the signup form.

## Project structure

```
app/
  page.tsx                       landing page
  auth/page.tsx                  sign in / register
  dashboard/page.tsx             redirects by role
  dashboard/hosteller/           post listings, payout QR, earnings
  dashboard/dayscholar/          browse, pay, request history, your QR codes
  dashboard/admin/               owner console
  api/notify-owner/              optional email on new request
  api/cron/cleanup/              daily expiry sweep
components/                      shared UI + role-specific components
lib/constants.ts                 meal slots, pricing, QR lifetime
lib/storage.ts                   upload / signed URL helpers
lib/supabase/                    browser + server Supabase clients
middleware.ts                    keeps the Supabase session refreshed
supabase/schema.sql              fresh install
supabase/migration_003_full_mechanism.sql   upgrade from the earlier version
vercel.json                      daily cron registration
```
