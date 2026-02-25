-- ============================================================
-- WWH Dashboard - Supabase Schema
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================

-- 1. TABLES
-- ============================================================

-- Business profiles (replaces localStorage "wwh-business-profiles")
CREATE TABLE profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#3b82f6',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- Encrypted API credentials per profile per service
CREATE TABLE profile_credentials (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service         TEXT NOT NULL CHECK (service IN ('shopify', 'meta', 'clarity')),
  encrypted_data  TEXT NOT NULL,
  iv              TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, service)
);

CREATE INDEX idx_profile_credentials_profile_id ON profile_credentials(profile_id);

-- User preferences (active profile, aggregate mode)
CREATE TABLE user_preferences (
  user_id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  active_profile_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  aggregate_mode      BOOLEAN NOT NULL DEFAULT false,
  selected_profile_ids UUID[] NOT NULL DEFAULT '{}',
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cached Clarity API responses (versioned history - each fetch creates a new row)
CREATE TABLE clarity_cache (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  num_of_days SMALLINT NOT NULL CHECK (num_of_days IN (1, 2, 3)),
  data        JSONB NOT NULL,
  fetched_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clarity_cache_profile_id ON clarity_cache(profile_id);
CREATE INDEX idx_clarity_cache_versions ON clarity_cache(profile_id, num_of_days, fetched_at DESC);

-- Migration for existing databases:
-- ALTER TABLE clarity_cache DROP CONSTRAINT clarity_cache_profile_id_num_of_days_key;
-- CREATE INDEX idx_clarity_cache_versions ON clarity_cache(profile_id, num_of_days, fetched_at DESC);

-- Server-side Clarity quota tracking
CREATE TABLE clarity_quota (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date             DATE NOT NULL DEFAULT CURRENT_DATE,
  call_count       INT NOT NULL DEFAULT 0,
  exhausted_by_api BOOLEAN NOT NULL DEFAULT false,
  last_fetch_at    TIMESTAMPTZ,
  UNIQUE(profile_id, date)
);

CREATE INDEX idx_clarity_quota_profile_date ON clarity_quota(profile_id, date);

-- 2. AUTO-UPDATE updated_at TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON profile_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profiles"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profiles"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profiles"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profiles"
  ON profiles FOR DELETE
  USING (auth.uid() = user_id);

-- profile_credentials (access through profile ownership)
ALTER TABLE profile_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credentials"
  ON profile_credentials FOR SELECT
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own credentials"
  ON profile_credentials FOR INSERT
  WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own credentials"
  ON profile_credentials FOR UPDATE
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own credentials"
  ON profile_credentials FOR DELETE
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- clarity_cache (access through profile ownership)
ALTER TABLE clarity_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clarity cache"
  ON clarity_cache FOR SELECT
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own clarity cache"
  ON clarity_cache FOR INSERT
  WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own clarity cache"
  ON clarity_cache FOR UPDATE
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own clarity cache"
  ON clarity_cache FOR DELETE
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- clarity_quota (access through profile ownership)
ALTER TABLE clarity_quota ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clarity quota"
  ON clarity_quota FOR SELECT
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own clarity quota"
  ON clarity_quota FOR INSERT
  WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own clarity quota"
  ON clarity_quota FOR UPDATE
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- ============================================================
-- MIGRATION: Remove env-based profile, make active_profile_id NOT NULL
-- ============================================================

-- 1. Para usuarios con NULL, establecer su primer perfil como activo
UPDATE user_preferences
SET active_profile_id = (
  SELECT p.id FROM profiles p
  WHERE p.user_id = user_preferences.user_id
  ORDER BY p.created_at ASC LIMIT 1
)
WHERE active_profile_id IS NULL
  AND EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = user_preferences.user_id);

-- 2. Hacer active_profile_id NOT NULL
ALTER TABLE user_preferences
  ALTER COLUMN active_profile_id SET NOT NULL;

-- 3. Cambiar ON DELETE SET NULL a ON DELETE RESTRICT
ALTER TABLE user_preferences
  DROP CONSTRAINT user_preferences_active_profile_id_fkey,
  ADD CONSTRAINT user_preferences_active_profile_id_fkey
    FOREIGN KEY (active_profile_id)
    REFERENCES profiles(id) ON DELETE RESTRICT;

-- 4. Trigger: auto-establecer primer perfil como activo
CREATE OR REPLACE FUNCTION auto_set_active_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id, active_profile_id, aggregate_mode)
  VALUES (NEW.user_id, NEW.id, false)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_first_profile_active
AFTER INSERT ON profiles
FOR EACH ROW EXECUTE FUNCTION auto_set_active_profile();

-- 5. Trigger: prevenir borrar último perfil o auto-cambiar si es activo
CREATE OR REPLACE FUNCTION prevent_delete_active_profile()
RETURNS TRIGGER AS $$
DECLARE
  profile_count INT;
  is_active BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM user_preferences
    WHERE user_id = OLD.user_id AND active_profile_id = OLD.id
  ) INTO is_active;

  IF is_active THEN
    SELECT COUNT(*) INTO profile_count
    FROM profiles WHERE user_id = OLD.user_id AND id != OLD.id;

    IF profile_count = 0 THEN
      RAISE EXCEPTION 'No puedes eliminar tu único perfil';
    END IF;

    -- Auto-cambiar a otro perfil
    UPDATE user_preferences
    SET active_profile_id = (
      SELECT id FROM profiles
      WHERE user_id = OLD.user_id AND id != OLD.id
      ORDER BY created_at ASC LIMIT 1
    )
    WHERE user_id = OLD.user_id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_delete_last_profile
BEFORE DELETE ON profiles
FOR EACH ROW EXECUTE FUNCTION prevent_delete_active_profile();
