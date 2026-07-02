-- ============================================
-- 3D 起床战争成长系统 Supabase Schema（可重复执行安全版）
-- 使用位置：Supabase Dashboard -> SQL Editor -> New query
-- 说明：
--   1. 仅创建表、索引、RLS 与开放策略，不插入任何手机号相关或默认业务数据。
--   2. 使用 CREATE TABLE/INDEX IF NOT EXISTS、DROP POLICY IF EXISTS，支持重复执行。
--   3. 原型阶段开放匿名读写；正式上线时建议改为基于 JWT 的玩家级 RLS。
-- ============================================

create extension if not exists pgcrypto;

-- ============================================
-- 1. 玩家成长档案：星尘、排位分、段位、赛季积分
-- ============================================
create table if not exists public.player_growth_profiles (
  id uuid primary key default gen_random_uuid(),
  player_id text not null unique,
  stardust integer not null default 0 check (stardust >= 0),
  ranked_score integer not null default 1000 check (ranked_score >= 0),
  rank_tier text not null default 'bronze',
  rank_division integer not null default 5 check (rank_division between 1 and 5),
  season_id text not null default 'default',
  season_points integer not null default 0 check (season_points >= 0),
  total_matches integer not null default 0 check (total_matches >= 0),
  total_wins integer not null default 0 check (total_wins >= 0),
  total_kills integer not null default 0 check (total_kills >= 0),
  total_beds_broken integer not null default 0 check (total_beds_broken >= 0),
  profile_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- 2. 玩家天赋节点：30 节点解锁
-- ============================================
create table if not exists public.player_talent_nodes (
  id uuid primary key default gen_random_uuid(),
  player_id text not null,
  node_index integer not null check (node_index between 1 and 30),
  node_key text not null,
  node_level integer not null default 1 check (node_level >= 1),
  is_unlocked boolean not null default true,
  unlocked_at timestamptz not null default now(),
  node_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (player_id, node_index),
  unique (player_id, node_key)
);

-- ============================================
-- 3. 玩家激活天赋：最多 3 个激活位
-- ============================================
create table if not exists public.player_active_talents (
  id uuid primary key default gen_random_uuid(),
  player_id text not null,
  slot_index integer not null check (slot_index between 1 and 3),
  node_key text not null,
  activated_at timestamptz not null default now(),
  talent_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (player_id, slot_index),
  unique (player_id, node_key)
);

-- ============================================
-- 4. 角色熟练度：击杀、拆床、胜利、等级、外观标记
-- ============================================
create table if not exists public.role_mastery (
  id uuid primary key default gen_random_uuid(),
  player_id text not null,
  role_key text not null,
  kill_count integer not null default 0 check (kill_count >= 0),
  bed_break_count integer not null default 0 check (bed_break_count >= 0),
  win_count integer not null default 0 check (win_count >= 0),
  match_count integer not null default 0 check (match_count >= 0),
  mastery_exp integer not null default 0 check (mastery_exp >= 0),
  mastery_level integer not null default 1 check (mastery_level >= 1),
  skin_flags jsonb not null default '[]'::jsonb,
  mastery_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (player_id, role_key)
);

-- ============================================
-- 5. 赛季任务：日/周任务进度
-- ============================================
create table if not exists public.season_tasks (
  id uuid primary key default gen_random_uuid(),
  player_id text not null,
  season_id text not null default 'default',
  task_key text not null,
  task_type text not null check (task_type in ('daily', 'weekly')),
  progress integer not null default 0 check (progress >= 0),
  target integer not null default 1 check (target >= 1),
  is_completed boolean not null default false,
  is_claimed boolean not null default false,
  reward_points integer not null default 0 check (reward_points >= 0),
  period_key text not null,
  reset_at timestamptz,
  completed_at timestamptz,
  claimed_at timestamptz,
  task_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (player_id, season_id, task_key, period_key)
);

-- ============================================
-- 6. 赛季奖励：通行证奖励领取状态
-- ============================================
create table if not exists public.season_rewards (
  id uuid primary key default gen_random_uuid(),
  player_id text not null,
  season_id text not null default 'default',
  reward_level integer not null check (reward_level >= 1),
  reward_key text not null,
  reward_track text not null default 'free' check (reward_track in ('free', 'premium')),
  required_points integer not null default 0 check (required_points >= 0),
  is_unlocked boolean not null default false,
  is_claimed boolean not null default false,
  claimed_at timestamptz,
  reward_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (player_id, season_id, reward_level, reward_track)
);

-- ============================================
-- 7. 单局成长结算：对局结束后的成长收益与统计
-- ============================================
create table if not exists public.match_growth_results (
  id uuid primary key default gen_random_uuid(),
  match_id text not null,
  player_id text not null,
  season_id text not null default 'default',
  role_key text,
  team_key text,
  placement integer check (placement is null or placement >= 1),
  is_win boolean not null default false,
  kills integer not null default 0 check (kills >= 0),
  deaths integer not null default 0 check (deaths >= 0),
  beds_broken integer not null default 0 check (beds_broken >= 0),
  final_kills integer not null default 0 check (final_kills >= 0),
  stardust_delta integer not null default 0,
  ranked_score_delta integer not null default 0,
  season_points_delta integer not null default 0,
  mastery_exp_delta integer not null default 0,
  task_progress_delta jsonb not null default '{}'::jsonb,
  reward_unlocks jsonb not null default '[]'::jsonb,
  result_meta jsonb not null default '{}'::jsonb,
  settled_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (match_id, player_id)
);

-- ============================================
-- 索引
-- ============================================
create index if not exists player_growth_profiles_player_idx on public.player_growth_profiles(player_id);
create index if not exists player_growth_profiles_season_rank_idx on public.player_growth_profiles(season_id, ranked_score desc);

create index if not exists player_talent_nodes_player_idx on public.player_talent_nodes(player_id);
create index if not exists player_talent_nodes_node_idx on public.player_talent_nodes(node_key);

create index if not exists player_active_talents_player_idx on public.player_active_talents(player_id);

create index if not exists role_mastery_player_idx on public.role_mastery(player_id);
create index if not exists role_mastery_role_level_idx on public.role_mastery(role_key, mastery_level desc);

create index if not exists season_tasks_player_period_idx on public.season_tasks(player_id, season_id, period_key);
create index if not exists season_tasks_type_status_idx on public.season_tasks(task_type, is_completed, is_claimed);

create index if not exists season_rewards_player_idx on public.season_rewards(player_id, season_id);
create index if not exists season_rewards_claim_idx on public.season_rewards(is_unlocked, is_claimed);

create index if not exists match_growth_results_match_idx on public.match_growth_results(match_id);
create index if not exists match_growth_results_player_created_idx on public.match_growth_results(player_id, created_at desc);

-- ============================================
-- RLS：启用行级安全
-- ============================================
alter table public.player_growth_profiles enable row level security;
alter table public.player_talent_nodes enable row level security;
alter table public.player_active_talents enable row level security;
alter table public.role_mastery enable row level security;
alter table public.season_tasks enable row level security;
alter table public.season_rewards enable row level security;
alter table public.match_growth_results enable row level security;

-- ============================================
-- 开放策略：原型阶段允许所有客户端读写
-- ============================================
drop policy if exists "growth profiles all" on public.player_growth_profiles;
drop policy if exists "talent nodes all" on public.player_talent_nodes;
drop policy if exists "active talents all" on public.player_active_talents;
drop policy if exists "role mastery all" on public.role_mastery;
drop policy if exists "season tasks all" on public.season_tasks;
drop policy if exists "season rewards all" on public.season_rewards;
drop policy if exists "match growth results all" on public.match_growth_results;

create policy "growth profiles all" on public.player_growth_profiles for all using (true) with check (true);
create policy "talent nodes all" on public.player_talent_nodes for all using (true) with check (true);
create policy "active talents all" on public.player_active_talents for all using (true) with check (true);
create policy "role mastery all" on public.role_mastery for all using (true) with check (true);
create policy "season tasks all" on public.season_tasks for all using (true) with check (true);
create policy "season rewards all" on public.season_rewards for all using (true) with check (true);
create policy "match growth results all" on public.match_growth_results for all using (true) with check (true);

-- ============================================
-- 执行后检查：确认 7 张成长系统表均已创建
-- ============================================
select
  count(*) as growth_table_count
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'player_growth_profiles',
    'player_talent_nodes',
    'player_active_talents',
    'role_mastery',
    'season_tasks',
    'season_rewards',
    'match_growth_results'
  );
