-- =============================================
-- NicheHeat MVP — Supabase Schema
-- =============================================

-- 1. NICHES — основная таблица ниш
CREATE TABLE niches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  format TEXT NOT NULL DEFAULT 'long' CHECK (format IN ('long', 'shorts')),
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_niches_slug ON niches(slug);
CREATE INDEX idx_niches_language ON niches(language);
CREATE INDEX idx_niches_format ON niches(format);

-- 2. NICHE_SNAPSHOTS — еженедельные метрики
CREATE TABLE niche_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche_id UUID NOT NULL REFERENCES niches(id) ON DELETE CASCADE,
  week TEXT NOT NULL, -- '2026-W23'
  heat_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  rpm_low NUMERIC(7,2),
  rpm_high NUMERIC(7,2),
  views_7d BIGINT DEFAULT 0,
  views_30d BIGINT DEFAULT 0,
  channels_count INT DEFAULT 0,
  avg_channel_age_days INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(niche_id, week)
);

CREATE INDEX idx_snapshots_niche ON niche_snapshots(niche_id);
CREATE INDEX idx_snapshots_week ON niche_snapshots(week);

-- 3. OUTLIER_VIDEOS — топ-видео по нишам
CREATE TABLE outlier_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche_id UUID NOT NULL REFERENCES niches(id) ON DELETE CASCADE,
  yt_video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  views BIGINT DEFAULT 0,
  vph NUMERIC(10,2) DEFAULT 0, -- views per hour
  channel_id TEXT,
  channel_name TEXT,
  published_at TIMESTAMPTZ,
  snapshot_week TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_outliers_niche ON outlier_videos(niche_id);
CREATE INDEX idx_outliers_week ON outlier_videos(snapshot_week);

-- 4. USER PROFILES — расширение auth.users
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  generations_used INT NOT NULL DEFAULT 0,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. SUBSCRIPTIONS — подписки Lemon Squeezy
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ls_subscription_id TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  status TEXT NOT NULL DEFAULT 'active',
  renews_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);

-- 6. GENERATIONS — AI-генерации (breakdown + skeleton)
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  niche_id UUID NOT NULL REFERENCES niches(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('breakdown', 'skeleton')),
  payload_json JSONB NOT NULL DEFAULT '{}',
  provider TEXT,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_generations_user ON generations(user_id);
CREATE INDEX idx_generations_niche ON generations(niche_id);

-- =============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE niches ENABLE ROW LEVEL SECURITY;
ALTER TABLE niche_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlier_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- Niches: everyone can read, service_role writes
CREATE POLICY "Niches are viewable by everyone"
  ON niches FOR SELECT USING (true);

-- Snapshots: everyone can read
CREATE POLICY "Snapshots are viewable by everyone"
  ON niche_snapshots FOR SELECT USING (true);

-- Outliers: everyone can read
CREATE POLICY "Outliers are viewable by everyone"
  ON outlier_videos FOR SELECT USING (true);

-- User profiles: users can read/update own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Subscriptions: users can read own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Generations: users can read/create own generations
CREATE POLICY "Users can view own generations"
  ON generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own generations"
  ON generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- MIGRATION: Add ratio + heat to outlier_videos
-- =============================================
ALTER TABLE outlier_videos ADD COLUMN IF NOT EXISTS ratio NUMERIC(10,4) DEFAULT 0;
ALTER TABLE outlier_videos ADD COLUMN IF NOT EXISTS heat NUMERIC(6,4) DEFAULT 0;
