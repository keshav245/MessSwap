-- MessSwap v3 migration 004 — owner messaging (direct + broadcast to a role).
-- Run this in your Supabase project's SQL editor. Purely additive — safe to
-- run alongside everything you already have.

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid references public.profiles(id) on delete cascade, -- null = broadcast
  audience text not null default 'direct'
    check (audience in ('direct', 'all_hostellers', 'all_day_scholars', 'everyone')),
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz -- only meaningful for direct messages
);

alter table public.messages enable row level security;

-- A user sees: messages sent directly to them, broadcasts aimed at their role
-- (or everyone), anything they sent themselves, or everything if they're admin.
drop policy if exists "Users see their own inbox" on public.messages;
create policy "Users see their own inbox"
  on public.messages for select
  to authenticated
  using (
    recipient_id = auth.uid()
    or sender_id = auth.uid()
    or public.is_admin()
    or audience = 'everyone'
    or (
      audience = 'all_hostellers'
      and exists (select 1 from public.profiles where id = auth.uid() and role = 'hosteller')
    )
    or (
      audience = 'all_day_scholars'
      and exists (select 1 from public.profiles where id = auth.uid() and role = 'day_scholar')
    )
  );

-- Only the owner can send messages.
drop policy if exists "Only admins send messages" on public.messages;
create policy "Only admins send messages"
  on public.messages for insert
  to authenticated
  with check (public.is_admin() and sender_id = auth.uid());

-- A direct-message recipient can mark their own message read.
drop policy if exists "Recipients can mark their messages read" on public.messages;
create policy "Recipients can mark their messages read"
  on public.messages for update
  to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

create index if not exists messages_recipient_idx on public.messages (recipient_id, created_at desc);
create index if not exists messages_audience_idx on public.messages (audience);
