-- ══════════════════════════════════════════════════════════════
--  SugarLoom Ph — Row Level Security
--  Run in: Supabase Dashboard → SQL Editor → New Query
--
--  ⚠ CHECK THE PROJECT FIRST. This site uses project ruclytedzkdbranurfcq
--  (see js/supabase-config.js). If the SQL editor is open on a different
--  project you will get: relation "products" does not exist.
--
--  Safe to run more than once.
--
--  READ THIS FIRST
--  Turning RLS on for a table WITHOUT adding policies denies everything.
--  The site goes blank: no products, no orders, no admin data, and every
--  write fails with "new row violates row-level security policy". If that
--  has happened, running this file fixes it — the data was never gone,
--  just hidden.
--
--  This file enables RLS on every table AND gives each one the policies
--  the app actually needs, so the Supabase dashboard stops warning about
--  unprotected tables while the site keeps working.
-- ══════════════════════════════════════════════════════════════


-- ──────────────────────────────────────────────────────────────
--  profiles — the one table that is genuinely locked down
--
--  Customer names, phone numbers and delivery addresses. Only
--  js/login.js and js/orders.js touch it, and both query the signed-in
--  customer's own row, so each customer can reach theirs and nobody
--  else's. The admin panel never reads this table.
-- ──────────────────────────────────────────────────────────────

alter table profiles enable row level security;

drop policy if exists "own profile: read"   on profiles;
drop policy if exists "own profile: create" on profiles;
drop policy if exists "own profile: update" on profiles;

create policy "own profile: read"
  on profiles for select using (auth.uid() = id);

create policy "own profile: create"
  on profiles for insert with check (auth.uid() = id);

create policy "own profile: update"
  on profiles for update using (auth.uid() = id) with check (auth.uid() = id);


-- ──────────────────────────────────────────────────────────────
--  Everything else — RLS on, with open policies
--
--  These are deliberately permissive, and it is worth being clear why.
--  The admin panel signs staff in against its own admin_users table and
--  then talks to Supabase with the same public anon key a customer uses.
--  Postgres cannot tell an administrator from a visitor — to the database
--  they are the same anonymous caller. A stricter policy here would not
--  add protection, it would just block the admin panel.
--
--  So this is the same access as before, written down explicitly rather
--  than left as "RLS disabled". The real fix is to move staff logins onto
--  Supabase Auth, or to put the admin panel behind a server holding the
--  service_role key — see the notes at the bottom.
-- ──────────────────────────────────────────────────────────────

do $$
declare
  t text;
  missing text[] := '{}';
begin
  foreach t in array array[
    'products', 'ingredients', 'admin_users', 'orders', 'transactions',
    'stock_log', 'order_tracking', 'site_content', 'inquiries', 'reviews'
  ] loop
    -- Skip anything that isn't here rather than aborting the whole script,
    -- which would leave some tables locked and others untouched.
    if to_regclass('public.' || quote_ident(t)) is null then
      missing := missing || t;
      continue;
    end if;

    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "app access" on public.%I', t);
    execute format(
      'create policy "app access" on public.%I for all to anon, authenticated using (true) with check (true)', t
    );
  end loop;

  if array_length(missing, 1) > 0 then
    raise warning 'Skipped tables that do not exist here: %', array_to_string(missing, ', ');
    raise warning 'If that list is long, you are probably in the wrong Supabase project. The app uses ruclytedzkdbranurfcq — check the project selector, then run supabase-schema.sql if the tables really are absent.';
  end if;
end $$;


-- ══════════════════════════════════════════════════════════════
--  CHECK IT WORKED
--  Every table below should say rls_enabled = true and policies >= 1.
--  A table with rls_enabled = true and policies = 0 is a broken table —
--  it will read as empty and reject every write.
-- ══════════════════════════════════════════════════════════════

select
  c.relname                                   as table_name,
  c.relrowsecurity                            as rls_enabled,
  (select count(*) from pg_policies p
     where p.schemaname = 'public'
       and p.tablename  = c.relname)          as policies
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
order by c.relname;


-- ══════════════════════════════════════════════════════════════
--  MAKING THIS ACTUALLY STRICT, LATER
--
--    1. Move staff logins to Supabase Auth, give each staff user a role
--       claim, and write policies against auth.jwt(). The admin panel
--       keeps talking to Supabase directly. Largest code change, best
--       result.
--
--    2. Put the admin panel behind js/server.js and have that server hold
--       the service_role key, so the browser never sees a privileged key.
--       Requires hosting the server, which also switches on order emails
--       and the forgot-password OTP.
--
--  Until one of those, treat the anon key as public — because it is.
--  Staff passwords are stored as SHA-256 hashes, so reading admin_users
--  no longer hands over working logins.
-- ══════════════════════════════════════════════════════════════
