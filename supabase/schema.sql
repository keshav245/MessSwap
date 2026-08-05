-- MessSwap v3 schema — fixed ₹40 / ₹30 mechanism with timed slots,
-- payment-screenshot verification, and 12-hour QR expiry.
-- Run this in a NEW Supabase project's SQL editor. If you already have the v1/v2
-- schema deployed, use supabase/migration_003_full_mechanism.sql instead.

-- 1. Profiles ---------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('hosteller', 'day_scholar', 'admin')),
  full_name text not null,
  phone text,
  email text,
  upi_id text,
  payout_qr_path text,          -- hosteller's own QR, for the owner to pay them ₹30
  earnings_total numeric(10, 2) not null default 0, -- lifetime ₹30 credits for hostellers
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by any signed-in user"
  on public.profiles for select to authenticated using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, phone, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'day_scholar'),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone',
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- 2. Listings — one meal slot QR, expires 12h after posting -----------------
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  hosteller_id uuid not null references public.profiles(id) on delete cascade,
  meal_slot text not null check (meal_slot in ('breakfast', 'lunch', 'snack', 'dinner')),
  status text not null default 'available'
    check (status in ('available', 'pending', 'used', 'expired', 'cancelled')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '12 hours')
);

alter table public.listings enable row level security;

create policy "Listings are viewable by any signed-in user"
  on public.listings for select to authenticated using (true);

create policy "Hostellers can create their own listings"
  on public.listings for insert to authenticated with check (auth.uid() = hosteller_id);

create policy "Hostellers can update their own listings"
  on public.listings for update to authenticated using (auth.uid() = hosteller_id);

create policy "Hostellers can delete their own unused listings"
  on public.listings for delete to authenticated
  using (auth.uid() = hosteller_id and status in ('available', 'expired', 'cancelled'));

create policy "Admins can update any listing"
  on public.listings for update to authenticated using (public.is_admin());

-- The meal QR itself, kept separate from the browsable listing row so it is
-- never exposed until a request on it is approved.
create table if not exists public.listing_qr (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  image_path text not null,
  created_at timestamptz not null default now()
);

alter table public.listing_qr enable row level security;

create policy "Hostellers manage their own listing QR"
  on public.listing_qr for all to authenticated
  using (auth.uid() in (select hosteller_id from public.listings where listings.id = listing_qr.listing_id))
  with check (auth.uid() in (select hosteller_id from public.listings where listings.id = listing_qr.listing_id));

create policy "Admins can view any listing QR"
  on public.listing_qr for select to authenticated using (public.is_admin());

create policy "Approved day scholars can view the listing QR"
  on public.listing_qr for select to authenticated
  using (
    exists (
      select 1 from public.requests r
      where r.listing_id = listing_qr.listing_id
        and r.day_scholar_id = auth.uid()
        and r.status = 'approved'
    )
  );

-- 3. Requests — a day scholar's ₹40 claim on a listing -----------------------
create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  day_scholar_id uuid not null references public.profiles(id) on delete cascade,
  payment_screenshot_path text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.requests enable row level security;

create policy "Involved users can view a request"
  on public.requests for select to authenticated
  using (
    auth.uid() = day_scholar_id
    or auth.uid() in (select hosteller_id from public.listings where listings.id = requests.listing_id)
    or public.is_admin()
  );

create policy "Admins can update any request"
  on public.requests for update to authenticated using (public.is_admin());

-- 4. Site settings (owner's payment QR) --------------------------------------
create table if not exists public.settings (
  key text primary key,
  value text
);

alter table public.settings enable row level security;

create policy "Settings are viewable by any signed-in user"
  on public.settings for select to authenticated using (true);

create policy "Admins can manage settings"
  on public.settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.settings (key, value) values ('owner_payment_qr_path', null)
  on conflict (key) do nothing;

-- 5. Atomic RPCs --------------------------------------------------------------
-- Reserve a listing and file a request in one transaction (avoids two day
-- scholars claiming the same QR at once).
create or replace function public.create_request(p_listing_id uuid, p_payment_screenshot_path text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_status text;
  v_request_id uuid;
begin
  select status into v_status from public.listings where id = p_listing_id for update;

  if v_status is null then
    raise exception 'Listing not found.';
  end if;
  if v_status <> 'available' then
    raise exception 'This meal is no longer available.';
  end if;

  insert into public.requests (listing_id, day_scholar_id, payment_screenshot_path)
  values (p_listing_id, auth.uid(), p_payment_screenshot_path)
  returning id into v_request_id;

  update public.listings set status = 'pending' where id = p_listing_id;

  return v_request_id;
end;
$$;

grant execute on function public.create_request(uuid, text) to authenticated;

-- Approve: marks the listing used and credits the hosteller ₹30.
create or replace function public.approve_request(p_request_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_listing_id uuid;
  v_hosteller_id uuid;
  v_req_status text;
begin
  if not public.is_admin() then
    raise exception 'Only the owner can approve requests.';
  end if;

  select listing_id, status into v_listing_id, v_req_status
  from public.requests where id = p_request_id for update;

  if v_req_status is null then
    raise exception 'Request not found.';
  end if;
  if v_req_status <> 'pending' then
    raise exception 'This request has already been decided.';
  end if;

  select hosteller_id into v_hosteller_id from public.listings where id = v_listing_id;

  update public.requests set status = 'approved' where id = p_request_id;
  update public.listings set status = 'used' where id = v_listing_id;
  update public.profiles set earnings_total = earnings_total + 30 where id = v_hosteller_id;
end;
$$;

grant execute on function public.approve_request(uuid) to authenticated;

-- Reject: frees the listing back up for someone else to request.
create or replace function public.reject_request(p_request_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_listing_id uuid;
  v_req_status text;
  v_listing_status text;
begin
  if not public.is_admin() then
    raise exception 'Only the owner can reject requests.';
  end if;

  select listing_id, status into v_listing_id, v_req_status
  from public.requests where id = p_request_id for update;

  if v_req_status is null then
    raise exception 'Request not found.';
  end if;
  if v_req_status <> 'pending' then
    raise exception 'This request has already been decided.';
  end if;

  select status into v_listing_status from public.listings where id = v_listing_id for update;

  update public.requests set status = 'rejected' where id = p_request_id;

  if v_listing_status = 'pending' and now() < (select expires_at from public.listings where id = v_listing_id) then
    update public.listings set status = 'available' where id = v_listing_id;
  else
    update public.listings set status = 'expired' where id = v_listing_id;
  end if;
end;
$$;

grant execute on function public.reject_request(uuid) to authenticated;

-- Daily sweep: expire anything past its 12-hour window (see /api/cron/cleanup).
create or replace function public.expire_stale_listings()
returns setof uuid
language plpgsql
security definer set search_path = public
as $$
begin
  return query
    update public.listings
    set status = 'expired'
    where status = 'available' and expires_at <= now()
    returning id;
end;
$$;

grant execute on function public.expire_stale_listings() to authenticated;
grant execute on function public.expire_stale_listings() to anon;

-- 6. Storage buckets ----------------------------------------------------------
-- qr-codes: PUBLIC — meal QR images. Kept unguessable by random UUID paths;
--   the metadata row in listing_qr (which IS access-controlled) is what your
--   app should treat as the real gate for who gets shown the link.
-- payment-screenshots / payout-qr: PRIVATE — only the owner and the uploader
--   can read these, enforced by RLS + signed URLs.
insert into storage.buckets (id, name, public) values ('qr-codes', 'qr-codes', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('payment-screenshots', 'payment-screenshots', false)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('payout-qr', 'payout-qr', false)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('site-assets', 'site-assets', true)
  on conflict (id) do nothing;

create policy "Users manage files in their own qr-codes folder"
  on storage.objects for all to authenticated
  using (bucket_id = 'qr-codes' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'qr-codes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users upload to their own payment-screenshots folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'payment-screenshots' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Owner or uploader can view a payment screenshot"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'payment-screenshots'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

create policy "Users manage their own payout-qr folder"
  on storage.objects for all to authenticated
  using (bucket_id = 'payout-qr' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'payout-qr' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Owner or uploader can view a payout QR"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'payout-qr'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

create policy "Only admins manage site-assets"
  on storage.objects for all to authenticated
  using (bucket_id = 'site-assets' and public.is_admin())
  with check (bucket_id = 'site-assets' and public.is_admin());

-- 7. Indexes -------------------------------------------------------------------
create index if not exists listings_status_idx on public.listings (status);
create index if not exists listings_hosteller_idx on public.listings (hosteller_id);
create index if not exists requests_listing_idx on public.requests (listing_id);
create index if not exists requests_day_scholar_idx on public.requests (day_scholar_id);
create index if not exists requests_status_idx on public.requests (status);

-- After running this file, promote your own account to admin:
-- update public.profiles set role = 'admin' where email = 'you@example.com';
