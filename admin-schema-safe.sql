-- ============================================
-- 筑梦决斗后台管理系统数据库 Schema（稳定完整版）
-- 使用位置：Supabase Dashboard -> SQL Editor -> New query
-- 说明：本版本不包含 ALTER PUBLICATION，避免 Realtime 重复添加时报错中断。
-- ============================================

-- 开启 UUID 支持
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- 1. 管理员权限表
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  phone TEXT,
  nickname TEXT,
  level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 4),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  is_active BOOLEAN DEFAULT true
);

-- ============================================
-- 2. 在线对局实时快照表
-- ============================================
CREATE TABLE IF NOT EXISTS public.active_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL UNIQUE,
  match_code TEXT NOT NULL,
  status TEXT DEFAULT 'playing',
  host_id TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  tick INTEGER DEFAULT 0,
  team_red_alive INTEGER DEFAULT 0,
  team_blue_alive INTEGER DEFAULT 0,
  team_green_alive INTEGER DEFAULT 0,
  team_yellow_alive INTEGER DEFAULT 0,
  red_bed_alive BOOLEAN DEFAULT true,
  blue_bed_alive BOOLEAN DEFAULT true,
  green_bed_alive BOOLEAN DEFAULT true,
  yellow_bed_alive BOOLEAN DEFAULT true,
  total_copper_spawned INTEGER DEFAULT 0,
  total_silver_spawned INTEGER DEFAULT 0,
  total_gold_spawned INTEGER DEFAULT 0,
  total_jade_spawned INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 3. 全服经济产出统计表
-- ============================================
CREATE TABLE IF NOT EXISTS public.economy_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hour_key TEXT NOT NULL UNIQUE,
  copper_total INTEGER DEFAULT 0,
  silver_total INTEGER DEFAULT 0,
  gold_total INTEGER DEFAULT 0,
  jade_total INTEGER DEFAULT 0,
  match_count INTEGER DEFAULT 0,
  player_count INTEGER DEFAULT 0,
  anomaly_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 4. 玩家资源流水
-- ============================================
CREATE TABLE IF NOT EXISTS public.player_economy_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT NOT NULL,
  room_id TEXT,
  event_type TEXT NOT NULL,
  currency TEXT,
  amount INTEGER,
  item_key TEXT,
  tick INTEGER,
  pos_x REAL,
  pos_y REAL,
  pos_z REAL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 5. 玩家惩戒记录
-- ============================================
CREATE TABLE IF NOT EXISTS public.player_penalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT NOT NULL,
  admin_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mute', 'kick', 'freeze', 'ban')),
  reason TEXT,
  duration_minutes INTEGER,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 6. 游戏热更新配置表
-- ============================================
CREATE TABLE IF NOT EXISTS public.game_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- ============================================
-- 7. 反作弊异常检测记录
-- ============================================
CREATE TABLE IF NOT EXISTS public.cheat_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT NOT NULL,
  room_id TEXT,
  alert_type TEXT NOT NULL,
  severity INTEGER DEFAULT 1 CHECK (severity >= 1 AND severity <= 5),
  details JSONB DEFAULT '{}',
  tick INTEGER,
  pos_x REAL,
  pos_y REAL,
  pos_z REAL,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 8. 击杀回放事件链
-- ============================================
CREATE TABLE IF NOT EXISTS public.kill_replay_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL,
  match_tick INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  actor_id TEXT,
  target_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 9. 管理员操作审计日志
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 10. 索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_phone ON public.admin_users(phone);
CREATE INDEX IF NOT EXISTS idx_active_matches_status ON public.active_matches(status);
CREATE INDEX IF NOT EXISTS idx_player_economy_player ON public.player_economy_logs(player_id);
CREATE INDEX IF NOT EXISTS idx_player_economy_room ON public.player_economy_logs(room_id);
CREATE INDEX IF NOT EXISTS idx_cheat_alerts_player ON public.cheat_alerts(player_id);
CREATE INDEX IF NOT EXISTS idx_cheat_alerts_unresolved ON public.cheat_alerts(is_resolved) WHERE is_resolved = false;
CREATE INDEX IF NOT EXISTS idx_kill_replay_room ON public.kill_replay_events(room_id, match_tick);
CREATE INDEX IF NOT EXISTS idx_penalties_active ON public.player_penalties(player_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_admin_audit ON public.admin_audit_logs(admin_id, created_at);

-- ============================================
-- 11. RLS 与访问策略
-- 注意：当前项目使用 anon key 直连，因此先开放读写，保证后台能运行。
-- 后续正式运营时建议改成 Edge Function + Service Role 保护。
-- ============================================
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.economy_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_economy_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cheat_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kill_replay_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_users' AND policyname = 'admin_users_open_policy') THEN
    CREATE POLICY admin_users_open_policy ON public.admin_users FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'active_matches' AND policyname = 'active_matches_open_policy') THEN
    CREATE POLICY active_matches_open_policy ON public.active_matches FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'economy_stats' AND policyname = 'economy_stats_open_policy') THEN
    CREATE POLICY economy_stats_open_policy ON public.economy_stats FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'player_economy_logs' AND policyname = 'player_economy_logs_open_policy') THEN
    CREATE POLICY player_economy_logs_open_policy ON public.player_economy_logs FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'player_penalties' AND policyname = 'player_penalties_open_policy') THEN
    CREATE POLICY player_penalties_open_policy ON public.player_penalties FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'game_config' AND policyname = 'game_config_open_policy') THEN
    CREATE POLICY game_config_open_policy ON public.game_config FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cheat_alerts' AND policyname = 'cheat_alerts_open_policy') THEN
    CREATE POLICY cheat_alerts_open_policy ON public.cheat_alerts FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'kill_replay_events' AND policyname = 'kill_replay_events_open_policy') THEN
    CREATE POLICY kill_replay_events_open_policy ON public.kill_replay_events FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_audit_logs' AND policyname = 'admin_audit_logs_open_policy') THEN
    CREATE POLICY admin_audit_logs_open_policy ON public.admin_audit_logs FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================
-- 12. 默认游戏配置
-- ============================================
INSERT INTO public.game_config (config_key, config_value) VALUES
  ('shop_prices', '{
    "wood_plank":{"copper":16},
    "stone_plate":{"silver":8},
    "iron_plate":{"gold":4},
    "titanium":{"jade":2},
    "wood_sword":{"silver":4},
    "stone_sword":{"silver":8},
    "iron_sword":{"gold":4},
    "diamond_sword":{"jade":2},
    "bow":{"silver":12},
    "arrow":{"silver":2},
    "std_armor":{"gold":8},
    "fine_armor":{"gold":16},
    "rd_armor":{"jade":4},
    "tnt":{"gold":8},
    "portal":{"jade":2},
    "potion":{"gold":4}
  }'::jsonb)
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  updated_at = now(),
  is_active = true;

INSERT INTO public.game_config (config_key, config_value) VALUES
  ('gen_spawn_rates', '{"copper":4,"silver":12,"gold":30,"jade":90}'::jsonb)
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  updated_at = now(),
  is_active = true;

INSERT INTO public.game_config (config_key, config_value) VALUES
  ('role_skills', '{
    "FOX":{"enabled":true,"hp":90,"camouflage_cd":16},
    "PORK_DOCTOR":{"enabled":true,"hp":110,"fat_cd":22},
    "HURRICANE":{"enabled":true,"hp":95,"dash_cd":16},
    "DRIFTWOOD":{"enabled":true,"hp":100,"missile_cd":30}
  }'::jsonb)
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  updated_at = now(),
  is_active = true;

INSERT INTO public.game_config (config_key, config_value) VALUES
  ('block_durability', '{"wood_plank":20,"stone_plate":60,"iron_plate":120,"titanium":300}'::jsonb)
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  updated_at = now(),
  is_active = true;

INSERT INTO public.game_config (config_key, config_value) VALUES
  ('banned_items', '[]'::jsonb)
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  updated_at = now(),
  is_active = true;

INSERT INTO public.game_config (config_key, config_value) VALUES
  ('match_settings', '{"shrink_start_min":30,"shrink_end_min":35,"max_players":12,"teams":4,"players_per_team":3}'::jsonb)
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  updated_at = now(),
  is_active = true;

-- ============================================
-- 13. 默认超级管理员预授权
-- 手机号：12345678900
-- 首次用该手机号登录后台后，前端会自动将 phone:12345678900 绑定为真实易圈 user_id。
-- ============================================
INSERT INTO public.admin_users (user_id, phone, nickname, level, created_by, is_active) VALUES
  ('phone:12345678900', '12345678900', '默认超级管理员', 4, 'system', true)
ON CONFLICT (user_id) DO UPDATE SET
  phone = EXCLUDED.phone,
  nickname = EXCLUDED.nickname,
  level = 4,
  is_active = true,
  updated_at = now();

-- ============================================
-- 14. 验证输出
-- 执行后如果能看到下面两条结果，说明成功。
-- ============================================
SELECT 'admin_users ready' AS check_name, COUNT(*) AS count FROM public.admin_users;
SELECT 'game_config ready' AS check_name, COUNT(*) AS count FROM public.game_config;
