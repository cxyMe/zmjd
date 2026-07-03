-- ============================================
-- 筑梦激斗：赛季手册系统数据库脚本（安全可重复执行）
-- 适用于 Supabase PostgreSQL
-- ============================================

create table if not exists public.season_pass_orders (
  id uuid primary key default gen_random_uuid(),
  order_id text unique not null,
  season_id text not null,
  user_id text,
  user_contact text,
  pass_tier text not null check (pass_tier in ('advanced', 'premium')),
  amount numeric not null default 0,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by text,
  reviewed_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.season_pass_entitlements (
  id uuid primary key default gen_random_uuid(),
  season_id text not null,
  user_id text not null,
  pass_tier text not null check (pass_tier in ('free', 'advanced', 'premium')),
  source_order_id text,
  level_boost int not null default 0,
  is_active boolean not null default true,
  granted_by text,
  granted_at timestamptz not null default now(),
  unique (season_id, user_id)
);

create table if not exists public.season_pass_progress (
  id uuid primary key default gen_random_uuid(),
  season_id text not null,
  user_id text not null,
  pass_xp int not null default 0,
  season_coupons int not null default 0,
  claimed_free jsonb not null default '[]'::jsonb,
  claimed_paid jsonb not null default '[]'::jsonb,
  task_progress jsonb not null default '{}'::jsonb,
  weekly_match_xp int not null default 0,
  last_login_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (season_id, user_id)
);

create table if not exists public.season_pass_pay_qr_album (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text not null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  uploaded_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.season_pass_ops_events (
  id uuid primary key default gen_random_uuid(),
  season_id text not null,
  event_type text not null,
  user_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.season_pass_orders enable row level security;
alter table public.season_pass_entitlements enable row level security;
alter table public.season_pass_progress enable row level security;
alter table public.season_pass_pay_qr_album enable row level security;
alter table public.season_pass_ops_events enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'season_pass_orders_insert_anon') then
    create policy "season_pass_orders_insert_anon" on public.season_pass_orders for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'season_pass_orders_select_admin') then
    create policy "season_pass_orders_select_admin" on public.season_pass_orders for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'season_pass_orders_update_admin') then
    create policy "season_pass_orders_update_admin" on public.season_pass_orders for update using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'season_pass_entitlements_all') then
    create policy "season_pass_entitlements_all" on public.season_pass_entitlements for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'season_pass_progress_all') then
    create policy "season_pass_progress_all" on public.season_pass_progress for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'season_pass_pay_qr_album_all') then
    create policy "season_pass_pay_qr_album_all" on public.season_pass_pay_qr_album for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'season_pass_ops_events_all') then
    create policy "season_pass_ops_events_all" on public.season_pass_ops_events for all using (true) with check (true);
  end if;
end $$;

insert into public.game_config (config_key, config_value)
values
  ('season_pass_rewards', '{"maxLevel":100,"freeCouponsMax":1000,"paidCouponsApprox":2400}'::jsonb),
  ('season_pass_tasks', '{"daily":["参与1局对局","收集50个资源","放置20个方块"],"weekly":["全队累计造成5000伤害","全队累计拆掉2张床","全队累计收集500银币"],"season":["累计拆床50次","使用刺客角色获胜30局"]}'::jsonb)
on conflict (config_key) do nothing;
