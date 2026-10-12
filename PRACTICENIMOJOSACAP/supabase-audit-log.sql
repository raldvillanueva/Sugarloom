-- ══════════════════════════════════════════════════════════════
--  SugarLoom Ph — Audit Trail table
--  Run in: Supabase Dashboard → SQL Editor → New Query
--
--  ⚠ CHECK THE PROJECT FIRST. This site uses project ruclytedzkdbranurfcq
--  (see js/supabase-config.js).
--
--  Safe to run more than once.
--
--  Until this has been run, the panel still works: the Audit Trail page
--  says the table is missing and nothing else is affected. Actions taken
--  before you run it are not recorded.
--
--  YES, ENABLE RLS HERE — and this file does it for you.
--
--  Everywhere else in this project RLS is either off or on with a policy
--  that allows everything, because the admin panel talks to Supabase with
--  the same public anon key a customer does and Postgres cannot tell them
--  apart. An open policy there is paperwork, not protection.
--
--  This table is the exception, and it is worth understanding why. The
--  panel only ever INSERTs rows here and SELECTs them back — it never
--  updates or deletes one. So a policy can grant exactly those two
--  things and withhold update and delete, and nothing breaks. Anyone
--  holding the anon key can then add to the trail and read it, but
--  cannot quietly edit or erase what is already in it.
--
--  That makes the trail append-only at the database level, not merely by
--  convention. It is the one place in this project where RLS buys you
--  something real.
-- ══════════════════════════════════════════════════════════════

create table if not exists audit_log (
  id   text        primary key,
  date timestamptz default now(),
  data jsonb       not null
);

create index if not exists idx_audit_log_date on audit_log (date desc);


-- ── Append-only access ────────────────────────────────────────
--  insert: anyone using the app may add an entry (that is how the
--          panel records what staff do)
--  select: anyone using the app may read it back (the panel shows the
--          trail to a Super Admin; the restriction to that role is in
--          the application, not here)
--  update / delete: NO POLICY AT ALL, which means nobody using the anon
--          key can do either. A missing policy is a denial.
-- ──────────────────────────────────────────────────────────────

alter table audit_log enable row level security;

drop policy if exists "app access"       on audit_log;   -- in case supabase-rls.sql ran first
drop policy if exists "audit: append"    on audit_log;
drop policy if exists "audit: read"      on audit_log;

create policy "audit: append"
  on audit_log for insert to anon, authenticated with check (true);

create policy "audit: read"
  on audit_log for select to anon, authenticated using (true);


-- ══════════════════════════════════════════════════════════════
--  CHECK IT WORKED
--  Expect: rls_enabled = true, and exactly the two policies below.
--  If you see a policy named "app access" with cmd = ALL, supabase-rls.sql
--  has been run since — re-run this file to put the narrow ones back.
-- ══════════════════════════════════════════════════════════════

select
  c.relrowsecurity as rls_enabled,
  p.policyname,
  p.cmd
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policies p on p.schemaname = 'public' and p.tablename = c.relname
where n.nspname = 'public' and c.relname = 'audit_log';


-- ══════════════════════════════════════════════════════════════
--  IF YOU RUN supabase-rls.sql LATER
--
--  That file loops over every table and gives each one an "app access"
--  policy allowing everything, which would undo the restriction above.
--  It has been changed to skip audit_log for that reason — but if you
--  ever widen it by hand, re-run this file afterwards.
--
--  TESTING IT YOURSELF
--
--  Not from this SQL editor: queries here run as the table owner, which
--  bypasses RLS entirely, so a delete will appear to succeed. The
--  restriction applies to the anon key the browser uses. To see it,
--  try a delete with that key:
--
--    curl -X DELETE "https://ruclytedzkdbranurfcq.supabase.co/rest/v1/audit_log?id=eq.SOMEID" \
--         -H "apikey: <anon key from js/supabase-config.js>"
--
--  It should come back refused, while the panel keeps recording normally.
--
--  WHAT THIS STILL DOES NOT COVER
--
--  The service_role key, and the dashboard, bypass RLS by design. This
--  protects the trail from anyone with the public key — which is the
--  realistic threat here, since that key ships in the page source. It is
--  not protection against whoever owns the Supabase project.
-- ══════════════════════════════════════════════════════════════
