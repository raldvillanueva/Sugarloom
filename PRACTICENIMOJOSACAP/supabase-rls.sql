-- ══════════════════════════════════════════════════════════════
--  SugarLoom Ph — Row Level Security
--  Run in: Supabase Dashboard → SQL Editor → New Query
--
--  Everything in this project currently runs with RLS switched off, so
--  the public anon key in js/supabase-config.js can read and write every
--  table. This file closes the part of that which can be closed without
--  redesigning how the admin panel signs in.
-- ══════════════════════════════════════════════════════════════


-- ──────────────────────────────────────────────────────────────
--  profiles — customer names, phone numbers and delivery addresses
--
--  Safe to lock. Only js/login.js and js/orders.js touch this table, and
--  both always query the signed-in customer's own row
--  (.eq('id', session.user.id)). The admin panel never reads it.
--
--  Without this, anyone who opens the site, copies the anon key out of
--  supabase-config.js and runs one query gets every customer's name,
--  phone number and home address. This is the single most valuable
--  change in this file.
-- ──────────────────────────────────────────────────────────────

alter table profiles enable row level security;

drop policy if exists "own profile: read"   on profiles;
drop policy if exists "own profile: create" on profiles;
drop policy if exists "own profile: update" on profiles;

create policy "own profile: read"
  on profiles for select
  using (auth.uid() = id);

create policy "own profile: create"
  on profiles for insert
  with check (auth.uid() = id);

create policy "own profile: update"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No delete policy: nothing in the app deletes a profile, and the row is
-- removed automatically when the auth user is (see the cascade in
-- supabase-schema.sql).


-- ══════════════════════════════════════════════════════════════
--  WHY THE OTHER TABLES ARE STILL OPEN
--
--  orders, products, ingredients, admin_users, transactions, stock_log,
--  order_tracking and site_content are all written by the admin panel.
--
--  That panel signs staff in against its own admin_users table and then
--  talks to Supabase with the same public anon key a customer uses.
--  Postgres therefore cannot tell an administrator apart from a visitor —
--  to the database they are the same anonymous caller. Adding policies to
--  those tables would either block the admin panel completely or permit
--  everyone, so they would be security theatre rather than security.
--
--  Closing that properly means one of:
--
--    1. Move staff logins to Supabase Auth, give each staff user a role
--       claim, and write policies against auth.jwt(). The admin panel
--       keeps talking to Supabase directly. Largest code change, best
--       result.
--
--    2. Put the admin panel behind js/server.js and have that server hold
--       the service_role key. The browser never sees a privileged key.
--       Requires hosting the server, which also fixes order emails and
--       the forgot-password OTP.
--
--  Until then, treat the anon key as public — because it is — and keep
--  nothing in those tables you would not be comfortable showing someone.
--  Staff passwords are now stored as SHA-256 hashes rather than plain
--  text, so a read of admin_users no longer hands over working logins.
-- ══════════════════════════════════════════════════════════════
