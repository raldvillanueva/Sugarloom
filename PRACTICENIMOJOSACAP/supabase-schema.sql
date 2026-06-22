-- ══════════════════════════════════════════════════════════════
--  SugarLoom Ph — Supabase Schema
--  Run this entire file in: Supabase Dashboard → SQL Editor → New Query
-- ══════════════════════════════════════════════════════════════

-- Products managed by admin
create table if not exists products (
  id   text primary key,
  data jsonb not null
);

-- Ingredient inventory
create table if not exists ingredients (
  id   text primary key,
  data jsonb not null
);

-- Admin panel users (separate from Supabase Auth)
create table if not exists admin_users (
  id   text primary key,
  data jsonb not null
);

-- All customer orders (shared between customer and admin)
create table if not exists orders (
  id             text primary key,
  customer_email text        default '',
  status         text        default 'Pending',
  date           timestamptz default now(),
  data           jsonb       not null
);

create index if not exists idx_orders_customer_email on orders (customer_email);
create index if not exists idx_orders_status         on orders (status);
create index if not exists idx_orders_date           on orders (date desc);

-- Fulfilled order archive (used in sales reports)
create table if not exists transactions (
  id   text primary key,
  data jsonb not null
);

-- Ingredient / product stock change log
create table if not exists stock_log (
  id   text        primary key,
  date timestamptz default now(),
  data jsonb       not null
);

-- Customer reviews (written after delivery)
create table if not exists reviews (
  id         uuid default gen_random_uuid() primary key,
  order_id   text not null,
  user_email text not null,
  data       jsonb not null
);

create index if not exists idx_reviews_user_email on reviews (user_email);
create index if not exists idx_reviews_order_id   on reviews (order_id);

-- Lalamove delivery tracking per order
create table if not exists order_tracking (
  order_id text primary key,
  data     jsonb not null
);

-- Customer profile data linked to Supabase Auth users
create table if not exists profiles (
  id   uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb
);

-- ── Disable RLS for now (re-enable with proper policies before going live) ──
alter table products       disable row level security;
alter table ingredients    disable row level security;
alter table admin_users    disable row level security;
alter table orders         disable row level security;
alter table transactions   disable row level security;
alter table stock_log      disable row level security;
alter table reviews        disable row level security;
alter table order_tracking disable row level security;
alter table profiles       disable row level security;
