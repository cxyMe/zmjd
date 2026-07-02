-- ============================================
-- 筑梦决斗后台管理系统数据库 Schema
-- 在 Supabase SQL Editor 中执行
-- ============================================

-- 管理员权限表
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE,
  phone TEXT,
  nickname TEXT,
  level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 4),
  level_name TEXT GENERATED ALWAYS AS (
    CASE level
      WHEN 1 THEN '观察员'
      WHEN 2 THEN '裁判员'
      WHEN 3 THEN '数值策划'
      WHEN 4 THEN '超级管理员'
    END
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  is_active BOOLEAN DEFAULT true
);

-- 在线对局实时快照表
CREATE TABLE IF NOT EXISTS active_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id TEXT NOT NULL,
  match_code TEXT NOT NULL,
  status TEXT DEFAULT 'playing',
  host_id TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  tick INTEGER DEFAULT 0,
  team_red_alive INTEGER DEFAULT 3,
  team_blue_alive INTEGER DEFAULT 3,
  team_green_alive INTEGER DEFAULT 3,
  team_yellow_alive INTEGER DEFAULT 3,
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

-- 全服经济产出日志（每小时聚合）
CREATE TABLE IF NOT EXISTS economy_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hour_key TEXT NOT NULL UNIQUE,
  copper_total INTEGER DEFAULT 0,
  silver_total INTEGER DEFAULT 0,
  gold_total INTEGER DEFAULT 0,
  jade_total INTEGER DEFAULT 0,
  match_count INTEGER DEFAULT 0,
  player_count INTEGER DEFAULT 0,
  anomaly_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 玩家资源流水
CREATE TABLE IF NOT EXISTS player_economy_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- 玩家惩戒记录
CREATE TABLE IF NOT EXISTS player_penalties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id TEXT NOT NULL,
  admin_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mute','kick','freeze','ban')),
  reason TEXT,
  duration_minutes INTEGER,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 游戏实时配置表（热更新）
CREATE TABLE IF NOT EXISTS game_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- 反作弊异常检测记录
CREATE TABLE IF NOT EXISTS cheat_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- 击杀回放事件链
CREATE TABLE IF NOT EXISTS kill_replay_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id TEXT NOT NULL,
  match_tick INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  actor_id TEXT,
  target_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 管理员操作审计日志
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_active_matches_status ON active_matches(status);
CREATE INDEX IF NOT EXISTS idx_player_economy_player ON player_economy_logs(player_id);
CREATE INDEX IF NOT EXISTS idx_player_economy_room ON player_economy_logs(room_id);
CREATE INDEX IF NOT EXISTS idx_cheat_alerts_player ON cheat_alerts(player_id);
CREATE INDEX IF NOT EXISTS idx_cheat_alerts_unresolved ON cheat_alerts(is_resolved) WHERE is_resolved = false;
CREATE INDEX IF NOT EXISTS idx_kill_replay_room ON kill_replay_events(room_id, match_tick);
CREATE INDEX IF NOT EXISTS idx_penalties_active ON player_penalties(player_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_admin_audit ON admin_audit_logs(admin_id, created_at);

-- RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE economy_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_economy_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE cheat_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE kill_replay_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all" ON admin_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "admin_all" ON active_matches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "admin_all" ON economy_stats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "admin_all" ON player_economy_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "admin_all" ON player_penalties FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "admin_all" ON game_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "admin_all" ON cheat_alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "admin_all" ON kill_replay_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "admin_all" ON admin_audit_logs FOR ALL USING (true) WITH CHECK (true);

-- 默认游戏配置插入
INSERT INTO game_config (config_key, config_value) VALUES
  ('shop_prices', '{"wood_plank":{"copper":16},"stone_plate":{"silver":8},"iron_plate":{"gold":4},"titanium":{"jade":2},"wood_sword":{"silver":4},"stone_sword":{"silver":8},"iron_sword":{"gold":4},"diamond_sword":{"jade":2},"bow":{"silver":12},"arrow":{"silver":2},"std_armor":{"gold":8},"fine_armor":{"gold":16},"rd_armor":{"jade":4},"tnt":{"gold":8},"portal":{"jade":2},"potion":{"gold":4}}')
  ON CONFLICT (config_key) DO NOTHING;

INSERT INTO game_config (config_key, config_value) VALUES
  ('gen_spawn_rates', '{"copper":4,"silver":12,"gold":30,"jade":90}')
  ON CONFLICT (config_key) DO NOTHING;

INSERT INTO game_config (config_key, config_value) VALUES
  ('role_skills', '{"WARRIOR":{"enabled":true,"hp":120,"dmg_mult":1.0},"BUILDER":{"enabled":true,"hp":90,"block_discount":0.5},"ASSASSIN":{"enabled":true,"hp":80,"speed_mult":1.2},"ARCHER":{"enabled":true,"hp":100,"bow_dmg_mult":1.3}}')
  ON CONFLICT (config_key) DO NOTHING;

INSERT INTO game_config (config_key, config_value) VALUES
  ('block_durability', '{"wood_plank":20,"stone_plate":60,"iron_plate":120,"titanium":300}')
  ON CONFLICT (config_key) DO NOTHING;

INSERT INTO game_config (config_key, config_value) VALUES
  ('banned_items', '[]')
  ON CONFLICT (config_key) DO NOTHING;

INSERT INTO game_config (config_key, config_value) VALUES
  ('match_settings', '{"shrink_start_min":30,"shrink_end_min":35,"max_players":12,"teams":4,"players_per_team":3}')
  ON CONFLICT (config_key) DO NOTHING;

-- 启用 Realtime
BEGIN;
  ALTER PUBLICATION supabase_realtime ADD TABLE admin_users;
  ALTER PUBLICATION supabase_realtime ADD TABLE active_matches;
  ALTER PUBLICATION supabase_realtime ADD TABLE economy_stats;
  ALTER PUBLICATION supabase_realtime ADD TABLE cheat_alerts;
  ALTER PUBLICATION supabase_realtime ADD TABLE game_config;
COMMIT;
