-- ══════════════════════════════════════════════════════════════
--  SugarLoom Ph — stop deleted orders coming back
--  Run in: Supabase Dashboard → SQL Editor → New Query
--
--  ⚠ CHECK THE PROJECT FIRST — this site uses ruclytedzkdbranurfcq.
--
--  Safe to run more than once.
--
--  WHY THIS EXISTS
--
--  The admin panel keeps every order in memory and saveDB() writes the
--  whole lot back with an upsert. Until recently syncStoreOrders() only
--  ever ADDED from the database, so an order deleted anywhere — another
--  tab, another machine, the SQL editor — was simply re-uploaded by the
--  next save of any browser still holding it. Deleting looked like it
--  had worked and then quietly undid itself.
--
--  The panel no longer does that: the sync now drops orders that are no
--  longer in the database. But a browser tab that has not been
--  refreshed is still running the old code, and nothing in the app can
--  reach it. This makes the database refuse the resurrection instead of
--  asking every client to behave.
-- ══════════════════════════════════════════════════════════════

create table if not exists deleted_orders (
  id         text primary key,
  deleted_at timestamptz default now()
);

-- Silently drop any attempt to re-insert an order that was deleted.
-- RETURN NULL skips the row without raising, so a stale tab's bulk
-- upsert still succeeds for its other orders instead of failing whole.
create or replace function block_deleted_orders()
returns trigger
language plpgsql
as $$
begin
  if exists (select 1 from deleted_orders d where d.id = new.id) then
    return null;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_block_deleted on orders;
create trigger orders_block_deleted
  before insert on orders
  for each row execute function block_deleted_orders();


-- ── The orders cleared on 14 October 2026 ──
insert into deleted_orders (id) values
  ('WEB-1791968278762'),
  ('WEB-1791960070700'),
  ('WEB-1791959740128'),
  ('WEB-1791968158593'),
  ('WEB-1791966455338'),
  ('WEB-1790487580156'),
  ('WEB-1790843505741'),
  ('WEB-1790492149939'),
  ('WEB-1790488222307'),
  ('WEB-1790488190254'),
  ('WEB-1790487667941'),
  ('WEB-1790306023009'),
  ('WEB-1791796628442'),
  ('WEB-1790487631124'),
  ('WEB-1789715203794'),
  ('WEB-1791364467081'),
  ('WEB-1790079183570'),
  ('WEB-1790079115973'),
  ('WEB-1790078838622'),
  ('WEB-1788362939980'),
  ('WEB-1784211942330')
on conflict (id) do nothing;

-- Clear them again, in case a stale tab has put some back since.
delete from orders where id in (select id from deleted_orders);


-- ══════════════════════════════════════════════════════════════
--  CHECK IT WORKED
--  Expect: 0 orders left from the list, and the trigger present.
-- ══════════════════════════════════════════════════════════════

select count(*) as resurrected_orders_remaining
from orders where id in (select id from deleted_orders);

select tgname as trigger_name, tgenabled as enabled
from pg_trigger where tgname = 'orders_block_deleted';


-- ══════════════════════════════════════════════════════════════
--  IF YOU EVER WANT ONE BACK
--
--    delete from deleted_orders where id = 'WEB-…';
--
--  The row itself is gone; this only lifts the block. A backup of the
--  deleted orders was taken before they were removed.
-- ══════════════════════════════════════════════════════════════
