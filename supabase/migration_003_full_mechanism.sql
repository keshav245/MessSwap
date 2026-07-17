-- MessSwap v3 migration — run this in your EXISTING Supabase project's SQL editor.
-- This replaces the old "hosteller sets a price / picks a date" model with the
-- fixed ₹40 / ₹30 mechanism, timed slots, payment screenshots, and QR expiry.
-- Your existing profiles/auth accounts are kept; test listings/requests get
-- their statuses remapped rather than deleted.

-- 0. Admin role + is_admin() helper (in case migration_002 was skipped) -------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('hosteller', 'day_scholar', 'admin'));

alter table public.profiles add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;

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

create or replace function public.is_admin()
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- 1. Profiles: payouts ---------------------------------------------------------
alter table public.profiles add column if not exists payout_qr_path text;
alter table public.profiles add column if not exists earnings_total numeric(10, 2) not null default 0;

-- 2. Listings: drop the old price/date model, move to fixed slots + expiry ----
alter table public.listings drop constraint if exists listings_status_check;
alter table public.listings drop constraint if exists listings_meal_type_check;
alter table public.listings drop constraint if exists listings_meal_slot_check;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'listings' and column_name = 'meal_type'
  ) then
    update public.listings set meal_type = 'snack' where meal_type = 'snacks';
  end if;
end $$;
update public.listings set status = 'pending' where status = 'requested';
update public.listings set status = 'used' where status = 'completed';

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'listings' and column_name = 'meal_type'
  ) then
    alter table public.listings rename column meal_type to meal_slot;
  end if;
end $$;
alter table public.listings drop column if exists meal_date;
alter table public.listings drop column if exists price;
alter table public.listings drop column if exists notes;

alter table public.listings add column if not exists expires_at timestamptz;
update public.listings set expires_at = created_at + interval '12 hours' where expires_at is null;
alter table public.listings alter column expires_at set default (now() + interval '12 hours');
alter table public.listings alter column expires_at set not null;

alter table public.listings add constraint listings_meal_slot_check
  check (meal_slot in ('breakfast', 'lunch', 'snack', 'dinner'));
alter table public.listings add constraint listings_status_check
  check (status in ('available', 'pending', 'used', 'expired', 'cancelled'));

drop policy if exists "Hostellers can delete their own listings" on public.listings;
create policy "Hostellers can delete their own unused listings"
  on public.listings for delete to authenticated
  using (auth.uid() = hosteller_id and status in ('available', 'expired', 'cancelled'));

drop policy if exists "Admins can update any listing" on public.listings;
create policy "Admins can update any listing"
  on public.listings for update to authenticated using (public.is_admin());

-- 3. Requests: payment screenshots instead of hosteller self-approval ---------
alter table public.requests drop constraint if exists requests_status_check;
update public.requests set status = 'approved' where status = 'completed';
alter table public.requests add constraint requests_status_check
  check (status in ('pending', 'approved', 'rejected'));
alter table public.requests add column if not exists payment_screenshot_path text;

-- Only the owner verifies and decides now — drop the old direct-insert and
-- hosteller-self-approve policies. New requests go through create_request(),
-- and only approve_request() / reject_request() can change a request's status.
drop policy if exists "Day scholars can create requests" on public.requests;
drop policy if exists "Hostellers can update requests on their listings" on public.requests;
drop policy if exists "Day scholars can view their own requests" on public.requests;
drop policy if exists "Admins can view all requests" on public.requests;
drop policy if exists "Admins can update any request" on public.requests;

drop policy if exists "Involved users can view a request" on public.requests;
create policy "Involved users can view a request"
  on public.requests for select to authenticated
  using (
    auth.uid() = day_scholar_id
    or auth.uid() in (select hosteller_id from public.listings where listings.id = requests.listing_id)
    or public.is_admin()
  );

create policy "Admins can update any request"
  on public.requests for update to authenticated using (public.is_admin());

-- 4. Drop the old per-hosteller reusable QR table — QR is per-listing now -----
drop table if exists public.hosteller_qr cascade;

create table if not exists public.listing_qr (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  image_path text not null,
  created_at timestamptz not null default now()
);

alter table public.listing_qr enable row level security;

drop policy if exists "Hostellers manage their own listing QR" on public.listing_qr;
create policy "Hostellers manage their own listing QR"
  on public.listing_qr for all to authenticated
  using (auth.uid() in (select hosteller_id from public.listings where listings.id = listing_qr.listing_id))
  with check (auth.uid() in (select hosteller_id from public.listings where listings.id = listing_qr.listing_id));

drop policy if exists "Admins can view any listing QR" on public.listing_qr;
create policy "Admins can view any listing QR"
  on public.listing_qr for select to authenticated using (public.is_admin());

drop policy if exists "Approved day scholars can view the listing QR" on public.listing_qr;
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

-- 5. Site settings (owner's payment QR) ----------------------------------------
create table if not exists public.settings (
  key text primary key,
  value text
);

alter table public.settings enable row level security;

drop policy if exists "Settings are viewable by any signed-in user" on public.settings;
create policy "Settings are viewable by any signed-in user"
  on public.settings for select to authenticated using (true);

drop policy if exists "Admins can manage settings" on public.settings;
create policy "Admins can manage settings"
  on public.settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.settings (key, value) values ('owner_payment_qr_path', null)
  on conflict (key) do nothing;

-- 6. Atomic RPCs ----------------------------------------------------------------
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

-- 7. Storage buckets ------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('qr-codes', 'qr-codes', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('payment-screenshots', 'payment-screenshots', false)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('payout-qr', 'payout-qr', false)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('site-assets', 'site-assets', true)
  on conflict (id) do nothing;

drop policy if exists "Users upload their own QR file" on storage.objects;
drop policy if exists "Users update their own QR file" on storage.objects;
drop policy if exists "Users delete their own QR file" on storage.objects;
drop policy if exists "Users manage files in their own qr-codes folder" on storage.objects;
create policy "Users manage files in their own qr-codes folder"
  on storage.objects for all to authenticated
  using (bucket_id = 'qr-codes' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'qr-codes' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users upload to their own payment-screenshots folder" on storage.objects;
create policy "Users upload to their own payment-screenshots folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'payment-screenshots' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Owner or uploader can view a payment screenshot" on storage.objects;
create policy "Owner or uploader can view a payment screenshot"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'payment-screenshots'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

drop policy if exists "Users manage their own payout-qr folder" on storage.objects;
create policy "Users manage their own payout-qr folder"
  on storage.objects for all to authenticated
  using (bucket_id = 'payout-qr' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'payout-qr' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Owner or uploader can view a payout QR" on storage.objects;
create policy "Owner or uploader can view a payout QR"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'payout-qr'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

drop policy if exists "Only admins manage site-assets" on storage.objects;
create policy "Only admins manage site-assets"
  on storage.objects for all to authenticated
  using (bucket_id = 'site-assets' and public.is_admin())
  with check (bucket_id = 'site-assets' and public.is_admin());

-- 8. Indexes ---------------------------------------------------------------------
create index if not exists requests_status_idx on public.requests (status);

-- If you haven't already, promote your account to owner/admin:
-- update public.profiles set role = 'admin' where email = 'you@example.com';
