-- Migration: Add user_grant_status table for archiving/deleting grants
-- Run this in your Supabase SQL Editor

-- User grant status (archived/deleted)
CREATE TABLE IF NOT EXISTS user_grant_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  grant_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'archived', 'deleted')),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, grant_id)
);

-- RLS for user_grant_status
ALTER TABLE user_grant_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own grant status" ON user_grant_status FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own grant status" ON user_grant_status FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own grant status" ON user_grant_status FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own grant status" ON user_grant_status FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_grant_status_user ON user_grant_status(user_id);
CREATE INDEX IF NOT EXISTS idx_user_grant_status_grant ON user_grant_status(grant_id);
CREATE INDEX IF NOT EXISTS idx_user_grant_status_status ON user_grant_status(user_id, status);
