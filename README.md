# GtaMods

Redesigned presentation layer — dark cyberpunk/gamer marketplace UI. Phase 1: Landing page + shared design system.

## Setup

1. Unzip this into a new folder.
2. Push it to a new GitHub repo:
   - Create a repo on GitHub named `gtamods` (don't initialize with a README).
   - On your machine (or via GitHub Desktop), add this folder as the repo and push to `main`.
   - If you don't want to use git commands: on the empty repo page, use **Add file → Upload files**, then drag the entire unzipped folder contents in and commit.
3. Add a placeholder image: drop any 16:9 image into `public/placeholder-mod.jpg` (used by the mod cards until real R2 thumbnails are wired in).
4. Deploy on Vercel:
   - vercel.com → **Add New → Project** → Import this repo.
   - Framework preset auto-detects **Next.js**. Deploy.

## What's included

- Design system: Tailwind config (colors, glow shadows, animations), Space Grotesk / Inter / JetBrains Mono fonts, glass + reticle-lock hover utilities in `app/globals.css`.
- Shared layout: `Navbar`, `BottomNav` (mobile), `Footer`.
- Shared UI: `GlassCard`, `NeonButton`.
- Landing page (`/`): `Hero` (animated mesh gradient), `PurchaseTicker` (mock data — swap for a real Supabase query later), `FeaturedCarousel` (3D tilt cards), `CategoryGrid`.
- `ModCard` component used across landing/browse/category pages.

## Phase 2 additions

- `lib/mods-data.ts` — shared mock catalog (6 mods). Replace `getAllMods`, `getModBySlug`, `getModsByCategory` with real Supabase queries later; every page below keeps working as long as the function signatures stay the same.
- `/browse` — client-side search, category filter, price slider, sort (popular/newest/price). Empty state with reset CTA.
- `/category/:slug` — static per-category page (`generateStaticParams` pre-renders all 4 categories).
- `/mod/:slug` — split-screen: `MediaGallery` (thumbnail selector) on the left, sticky `PurchasePanel` (price, Buy Now, view/download/rating stats) on the right, description + `Changelog` below.
- `EmptyState` — reusable illustrated empty state with optional CTA.

The `PurchasePanel`'s `handleBuyNow` is a stub (`setTimeout`) — wire it to your Razorpay order-creation server action next.

## Phase 3 additions

- `/auth` — sign in / sign up tab toggle, Google OAuth button, email/password form, forgot-password link. `AuthForm.tsx` has `TODO` comments marking exactly where `supabase.auth.signInWithOAuth` / `signInWithPassword` / `signUp` calls go.
- `/library` — owned mods grid (`OwnedModCard` with a Download button) + download history table. Currently reads from `lib/library-data.ts` mock data; the page has a `TODO` comment for adding the auth guard (middleware or `supabase.auth.getUser()` redirect) and swapping in a real Supabase query scoped to the signed-in user.
- Both pages are pure UI — no session state is created yet, so `/library` is not actually protected until you wire the auth check back in.

## Phase 4 additions

- `/dashboard` (Employee console) — sidebar layout (`components/dashboard/Sidebar.tsx`), stat cards with inline SVG sparklines (no chart library dependency), and a mods data table with inline publish/unpublish and delete-draft actions.
- `/dashboard/upload` — mod upload form: title (auto-slugifies), slug (editable), description, price, category, a screenshot multi-upload grid with previews, and a drag-and-drop mod-file dropzone with an animated circular progress ring.
- `lib/dashboard-data.ts` — mock employee mods + sparkline series. Swap `EMPLOYEE_MODS` for a real query scoped to `auth.uid()`, and wire the `TODO` comments in `ModsTable.tsx` (publish/unpublish/delete) and `upload/page.tsx` (R2 upload + insert mod row) to real server actions.
- `UploadDropzone`'s progress is simulated with `setInterval` — swap for real upload progress via `XMLHttpRequest.upload.onprogress` when you wire it to R2 (plain `fetch` doesn't expose upload progress).

## Phase 5 additions — `/admin` (Owner console), final phase

- `components/ui/ToastProvider.tsx` — toast context + `useToast()` hook, now wrapping the whole app in `app/layout.tsx`. Each toast carries a severity (`success`/`error`/`warning`/`info`) with its own icon and color, auto-dismisses after 4s, animates in/out with Framer Motion.
- `/admin` — revenue overview: stat cards + top-mods and top-employees leaderboards.
- `/admin/roles` — command-palette-style role grant (email + role select), and a chip list of current role holders with a revoke-on-click `X`. `RoleCommandPalette.tsx` returns a structured `{ ok, code, message }` result from its stub functions and maps each `code` to the right toast severity — including `user_not_found`, handled gracefully as "role will apply once they sign up" rather than an error.
- `/admin/moderation` — platform-wide mods table (not just one employee's), with status filter tabs and approve/unpublish/delete actions.
- `/admin/employees` — per-employee audit: upload count, sales, revenue, expandable activity log.
- `/admin/users` — searchable user directory with expandable purchase history per user.
- All mock data lives in `lib/admin-data.ts` — swap `PLATFORM_USERS`, `PLATFORM_MODS`, `EMPLOYEE_AUDITS` for real Supabase queries (all should go through `private.has_role(auth.uid(), 'owner')`-gated RLS).

## That's the full route set

`/`, `/browse`, `/category/:slug`, `/mod/:slug`, `/auth`, `/library`, `/dashboard` (+ `/dashboard/upload`), `/admin` (+ `/roles`, `/moderation`, `/employees`, `/users`) — every page from the spec, redesigned. Every interactive backend touchpoint (auth, purchase, download links, role grants, moderation, uploads) is a clearly-marked `TODO` stub ready for your Supabase/Razorpay/R2 wiring — the presentation layer is done.

Backend logic (Supabase RLS, `private.has_role()`, Razorpay webhook, R2 presigned URLs) is untouched — this is UI only.
