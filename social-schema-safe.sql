-- ============================================
-- 筑梦决斗社交与互动系统数据库 Schema（稳定版）
-- Supabase SQL Editor 可重复执行
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.social_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT NOT NULL UNIQUE,
  nickname TEXT,
  politeness_score INTEGER DEFAULT 100,
  do_not_disturb BOOLEAN DEFAULT false,
  block_stranger_friend BOOLEAN DEFAULT false,
  block_marks BOOLEAN DEFAULT false,
  block_bounties BOOLEAN DEFAULT false,
  best_partner_likes INTEGER DEFAULT 0,
  redemption_clean_games INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.friend_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_a TEXT NOT NULL,
  player_b TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','blocked')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(player_a, player_b)
);

CREATE TABLE IF NOT EXISTS public.bond_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bond_key TEXT NOT NULL UNIQUE,
  player_ids TEXT[] NOT NULL,
  games_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  beds_destroyed INTEGER DEFAULT 0,
  rescue_count INTEGER DEFAULT 0,
  bond_level INTEGER DEFAULT 1,
  banner_color TEXT DEFAULT '#8be9fd',
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bounty_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reason TEXT,
  reward INTEGER DEFAULT 50,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','completed','expired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days')
);

CREATE TABLE IF NOT EXISTS public.avoid_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT NOT NULL,
  avoided_id TEXT NOT NULL,
  reason TEXT,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '3 days'),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(player_id, avoided_id)
);

CREATE TABLE IF NOT EXISTS public.match_social_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT,
  event_type TEXT NOT NULL,
  actor_id TEXT,
  target_id TEXT,
  details JSONB DEFAULT '{}',
  tick INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.post_match_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT,
  voter_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('best_partner','funny_blame','report')),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, voter_id, target_id, vote_type)
);

CREATE INDEX IF NOT EXISTS idx_social_profiles_player ON public.social_profiles(player_id);
CREATE INDEX IF NOT EXISTS idx_friend_links_a ON public.friend_links(player_a);
CREATE INDEX IF NOT EXISTS idx_friend_links_b ON public.friend_links(player_b);
CREATE INDEX IF NOT EXISTS idx_bond_records_key ON public.bond_records(bond_key);
CREATE INDEX IF NOT EXISTS idx_bounty_target ON public.bounty_orders(target_id, status);
CREATE INDEX IF NOT EXISTS idx_avoid_pair ON public.avoid_players(player_id, avoided_id);
CREATE INDEX IF NOT EXISTS idx_match_social_room ON public.match_social_events(room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_post_votes_room ON public.post_match_votes(room_id);

ALTER TABLE public.social_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bond_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bounty_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avoid_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_social_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_match_votes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='social_profiles' AND policyname='social_profiles_open_policy') THEN
    CREATE POLICY social_profiles_open_policy ON public.social_profiles FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='friend_links' AND policyname='friend_links_open_policy') THEN
    CREATE POLICY friend_links_open_policy ON public.friend_links FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bond_records' AND policyname='bond_records_open_policy') THEN
    CREATE POLICY bond_records_open_policy ON public.bond_records FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bounty_orders' AND policyname='bounty_orders_open_policy') THEN
    CREATE POLICY bounty_orders_open_policy ON public.bounty_orders FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='avoid_players' AND policyname='avoid_players_open_policy') THEN
    CREATE POLICY avoid_players_open_policy ON public.avoid_players FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='match_social_events' AND policyname='match_social_events_open_policy') THEN
    CREATE POLICY match_social_events_open_policy ON public.match_social_events FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='post_match_votes' AND policyname='post_match_votes_open_policy') THEN
    CREATE POLICY post_match_votes_open_policy ON public.post_match_votes FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

SELECT 'social_tables_ready' AS check_name, COUNT(*) AS social_table_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('social_profiles','friend_links','bond_records','bounty_orders','avoid_players','match_social_events','post_match_votes');
