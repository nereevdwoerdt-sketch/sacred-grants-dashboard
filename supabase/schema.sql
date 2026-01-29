-- Sacred Grants Dashboard Schema
-- Run this in your Supabase SQL Editor

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  organization TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant progress tracking
CREATE TABLE IF NOT EXISTS grant_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  grant_id TEXT NOT NULL,
  status TEXT DEFAULT 'not-started' CHECK (status IN ('not-started', 'researching', 'drafting', 'submitted', 'awaiting', 'successful', 'unsuccessful')),
  notes TEXT,
  reminder_date DATE,
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, grant_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deadline', 'reminder', 'update', 'new_grant')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  grant_id TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant updates (for tracking changes from scraper)
CREATE TABLE IF NOT EXISTS grant_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  grant_id TEXT NOT NULL,
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scraped grant cache (stores last known state)
CREATE TABLE IF NOT EXISTS grant_cache (
  grant_id TEXT PRIMARY KEY,
  source_url TEXT NOT NULL,
  page_hash TEXT,
  last_checked TIMESTAMPTZ DEFAULT NOW(),
  last_changed TIMESTAMPTZ,
  extracted_data JSONB,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'error'))
);

-- User favorites
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  grant_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, grant_id)
);

-- Teams
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team members
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own progress" ON grant_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON grant_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON grant_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own progress" ON grant_progress FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert notifications" ON notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view grant updates" ON grant_updates FOR SELECT USING (true);
CREATE POLICY "Service role can insert grant updates" ON grant_updates FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view grant cache" ON grant_cache FOR SELECT USING (true);
CREATE POLICY "Service role can manage grant cache" ON grant_cache FOR ALL USING (true);

CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON favorites FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Team members can view team" ON teams FOR SELECT USING (
  id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
);
CREATE POLICY "Users can create teams" ON teams FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team members can view members" ON team_members FOR SELECT USING (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
);

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Discovered grants (from grant discovery engine)
CREATE TABLE IF NOT EXISTS discovered_grants (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  source_id TEXT NOT NULL,
  source_name TEXT NOT NULL,
  region TEXT,
  relevance_score INTEGER DEFAULT 0,
  keyword_matches JSONB,
  description TEXT,
  deadline TEXT,
  amount TEXT,
  eligibility TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'added', 'rejected', 'expired')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  last_scraped TIMESTAMPTZ DEFAULT NOW()
);

-- Discovery run logs
CREATE TABLE IF NOT EXISTS discovery_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sources_scraped INTEGER DEFAULT 0,
  grants_found INTEGER DEFAULT 0,
  relevant_grants INTEGER DEFAULT 0,
  errors JSONB,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- RLS for discovered grants
ALTER TABLE discovered_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view discovered grants" ON discovered_grants FOR SELECT USING (true);
CREATE POLICY "Service role can manage discovered grants" ON discovered_grants FOR ALL USING (true);
CREATE POLICY "Anyone can view discovery runs" ON discovery_runs FOR SELECT USING (true);
CREATE POLICY "Service role can manage discovery runs" ON discovery_runs FOR ALL USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_grant_progress_user ON grant_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_grant_progress_grant ON grant_progress(grant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_grant_cache_last_checked ON grant_cache(last_checked);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_discovered_grants_score ON discovered_grants(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_discovered_grants_status ON discovered_grants(status);
CREATE INDEX IF NOT EXISTS idx_discovered_grants_discovered ON discovered_grants(discovered_at DESC);
