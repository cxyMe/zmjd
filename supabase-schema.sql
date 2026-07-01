-- 3D 起床战争 Supabase 数据表
-- 在 Supabase SQL Editor 中执行。本原型使用易圈登录返回的 user.id 作为玩家 ID。

create extension if not exists pgcrypto;

create table if not exists public.bw_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'ended')),
  main_host_user_id text not null,
  host_order jsonb not null default '[]'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bw_room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.bw_rooms(id) on delete cascade,
  user_id text not null,
  nickname text not null default '玩家',
  avatar_url text default '',
  role text not null default 'player' check (role in ('host', 'player', 'spectator')),
  team text,
  character_role text,
  connection_state text not null default 'online' check (connection_state in ('online', 'offline')),
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique(room_id, user_id)
);

create table if not exists public.bw_room_events (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.bw_rooms(id) on delete cascade,
  user_id text not null,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.bw_room_snapshots (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.bw_rooms(id) on delete cascade,
  host_user_id text not null,
  tick bigint not null,
  state jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists bw_rooms_code_idx on public.bw_rooms(code);
create index if not exists bw_room_members_room_idx on public.bw_room_members(room_id);
create index if not exists bw_room_members_last_seen_idx on public.bw_room_members(room_id, last_seen_at);
create index if not exists bw_room_events_room_created_idx on public.bw_room_events(room_id, created_at desc);
create index if not exists bw_room_snapshots_room_created_idx on public.bw_room_snapshots(room_id, created_at desc);

alter table public.bw_rooms replica identity full;
alter table public.bw_room_members replica identity full;
alter table public.bw_room_events replica identity full;
alter table public.bw_room_snapshots replica identity full;

-- 原型阶段允许匿名 key 读写房间数据。正式上线时建议改为基于 JWT 的 RLS 策略。
alter table public.bw_rooms enable row level security;
alter table public.bw_room_members enable row level security;
alter table public.bw_room_events enable row level security;
alter table public.bw_room_snapshots enable row level security;

drop policy if exists "bedwars rooms all" on public.bw_rooms;
drop policy if exists "bedwars members all" on public.bw_room_members;
drop policy if exists "bedwars events all" on public.bw_room_events;
drop policy if exists "bedwars snapshots all" on public.bw_room_snapshots;

create policy "bedwars rooms all" on public.bw_rooms for all using (true) with check (true);
create policy "bedwars members all" on public.bw_room_members for all using (true) with check (true);
create policy "bedwars events all" on public.bw_room_events for all using (true) with check (true);
create policy "bedwars snapshots all" on public.bw_room_snapshots for all using (true) with check (true);

-- 请在 Supabase Dashboard 的 Realtime 页面中打开这四张表的复制：
-- bw_rooms, bw_room_members, bw_room_events, bw_room_snapshots
