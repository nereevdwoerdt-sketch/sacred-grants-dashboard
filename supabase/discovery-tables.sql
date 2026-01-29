-- Grant Discovery Tables for Sacred Foundation
-- Run this in your Supabase SQL Editor to add the discovery functionality

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

-- Enable Row Level Security
ALTER TABLE discovered_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow public read, service role write
CREATE POLICY "Anyone can view discovered grants" ON discovered_grants FOR SELECT USING (true);
CREATE POLICY "Service role can insert discovered grants" ON discovered_grants FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update discovered grants" ON discovered_grants FOR UPDATE USING (true);
CREATE POLICY "Service role can delete discovered grants" ON discovered_grants FOR DELETE USING (true);

CREATE POLICY "Anyone can view discovery runs" ON discovery_runs FOR SELECT USING (true);
CREATE POLICY "Service role can insert discovery runs" ON discovery_runs FOR INSERT WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_discovered_grants_score ON discovered_grants(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_discovered_grants_status ON discovered_grants(status);
CREATE INDEX IF NOT EXISTS idx_discovered_grants_discovered ON discovered_grants(discovered_at DESC);
CREATE INDEX IF NOT EXISTS idx_discovered_grants_source ON discovered_grants(source_id);
CREATE INDEX IF NOT EXISTS idx_discovery_runs_completed ON discovery_runs(completed_at DESC);

-- Add 'new_grant' to notifications type if not exists
-- (Run this only if you get a check constraint error)
-- ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
-- ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
--   CHECK (type IN ('deadline', 'reminder', 'update', 'new_grant'));
