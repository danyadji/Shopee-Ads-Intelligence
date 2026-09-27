-- Shopee Ads Intelligence schema, MVP Phase 1
-- Jalankan di Supabase SQL Editor. Auth memakai auth.users bawaan Supabase.

create extension if not exists "pgcrypto";

-- Profil terhubung ke auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

-- Satu user dapat memiliki banyak toko
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  sku text,
  selling_price numeric(14,2) not null default 0,
  product_cost numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.ad_groups (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  name text not null
);

create table if not exists public.keywords (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  keyword text not null,
  created_at timestamptz not null default now()
);

-- Metrik harian tingkat campaign
create table if not exists public.ad_metrics (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  date date not null,
  impressions integer not null default 0,
  clicks integer not null default 0,
  orders integer not null default 0,
  spend numeric(14,2) not null default 0,
  revenue numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  unique(campaign_id, date)
);

create table if not exists public.product_metrics (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  date date not null,
  impressions integer not null default 0,
  clicks integer not null default 0,
  orders integer not null default 0,
  spend numeric(14,2) not null default 0,
  revenue numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  unique(product_id, date)
);

create table if not exists public.keyword_metrics (
  id uuid primary key default gen_random_uuid(),
  keyword_id uuid not null references public.keywords(id) on delete cascade,
  date date not null,
  impressions integer not null default 0,
  clicks integer not null default 0,
  orders integer not null default 0,
  spend numeric(14,2) not null default 0,
  revenue numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  unique(keyword_id, date)
);

-- Pengaturan margin per produk untuk break-even ROAS
create table if not exists public.profit_settings (
  product_id uuid primary key references public.products(id) on delete cascade,
  marketplace_fee numeric(14,2) not null default 0,
  other_costs numeric(14,2) not null default 0,
  target_margin numeric(14,2) not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  input_json jsonb not null,
  fact_text text not null,
  hypothesis_text text,
  action_text text,
  created_at timestamptz not null default now()
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  rule text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  title text not null,
  period_start date not null,
  period_end date not null,
  summary_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.decision_logs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  date date not null,
  action text not null,
  reason text,
  expected text,
  result text,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  owner_id uuid primary key references public.profiles(id) on delete cascade,
  plan text not null default 'free',
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.products enable row level security;
alter table public.campaigns enable row level security;
alter table public.ad_groups enable row level security;
alter table public.keywords enable row level security;
alter table public.ad_metrics enable row level security;
alter table public.product_metrics enable row level security;
alter table public.keyword_metrics enable row level security;
alter table public.profit_settings enable row level security;
alter table public.ai_insights enable row level security;
alter table public.alerts enable row level security;
alter table public.reports enable row level security;
alter table public.decision_logs enable row level security;
alter table public.subscriptions enable row level security;

-- Kebijakan dasar: user hanya mengakses data miliknya lewat stores.owner_id.
-- Sesuaikan di dashboard Supabase bila memakai service role untuk import CSV.

create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own stores" on public.stores
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
