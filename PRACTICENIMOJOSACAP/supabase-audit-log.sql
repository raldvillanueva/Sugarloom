-- ══════════════════════════════════════════════════════════════
--  SugarLoom Ph — Audit Trail table
--  Run in: Supabase Dashboard → SQL Editor → New Query
--
--  ⚠ CHECK THE PROJECT FIRST. This site uses project ruclytedzkdbranurfcq
--  (see js/supabase-config.js).
--
--  This is the one new table behind Super Admin → Audit Trail. It is
--  also included in supabase-schema.sql, so running that file instead
--  does the same thing — this is just the short version.
--
--  Safe to run more than once.
--
--  Until this has been run, the panel still works: the Audit Trail page
--  says the table is missing and nothing else is affected. Actions taken
--  before you run it are not recorded.
-- ══════════════════════════════════════════════════════════════

create table if not exists audit_log (
  id   text        primary key,
  date timestamptz default now(),
  data jsonb       not null
);

create index if not exists idx_audit_log_date on audit_log (date desc);

-- Match the other tables: RLS off, so the panel's anon key can write.
-- If you have run supabase-rls.sql, use the policy below instead.
alter table audit_log disable row level security;

-- Only needed if RLS is switched on across the project:
--   alter table audit_log enable row level security;
--   drop policy if exists "app access" on audit_log;
--   create policy "app access" on audit_log
--     for all to anon, authenticated using (true) with check (true);


-- ══════════════════════════════════════════════════════════════
--  CHECK IT WORKED — expect one row back
-- ══════════════════════════════════════════════════════════════

select
  c.relname        as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'audit_log';


-- ══════════════════════════════════════════════════════════════
--  A NOTE ON WHAT THIS DOES AND DOES NOT GIVE YOU
--
--  The panel never updates or deletes rows in this table, so the trail
--  is append-only as far as the application is concerned. It is not
--  append-only at the database level: anyone holding the anon key could
--  delete from it directly, exactly as they could with any other table
--  here (see "Known gaps" in CLAUDE.md).
--
--  Making it genuinely tamper-proof means the same fix as the rest:
--  move staff onto Supabase Auth and write a policy that grants insert
--  but not update or delete, or put the panel behind a server holding
--  the service_role key.
-- ══════════════════════════════════════════════════════════════
