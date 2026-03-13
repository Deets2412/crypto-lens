-- ============================================================
-- CoinDebrief — Phase 4: AI Intelligence Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- ==================== AI USAGE TABLE ====================
-- Tracks daily query usage per user for rate limiting

CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  usage_date DATE NOT NULL,
  query_count INTEGER DEFAULT 0 NOT NULL,
  total_tokens INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT ai_usage_user_date_unique UNIQUE (user_id, usage_date)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date
  ON ai_usage (user_id, usage_date);

-- RLS
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI usage"
  ON ai_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI usage"
  ON ai_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI usage"
  ON ai_usage FOR UPDATE
  USING (auth.uid() = user_id);

-- ==================== AI CONVERSATIONS TABLE ====================
-- Stores conversation history for users

CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  query_type TEXT NOT NULL,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  model_used TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  citations TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id
  ON ai_conversations (user_id, created_at DESC);

-- RLS
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON ai_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON ai_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can insert (for server-side writes)
CREATE POLICY "Service role can manage all conversations"
  ON ai_conversations FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage all usage"
  ON ai_usage FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ==================== HELPER FUNCTION ====================
-- Auto-update updated_at timestamp

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_usage_updated_at
  BEFORE UPDATE ON ai_usage
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- ==================== VERIFICATION ====================
-- Run these to verify the tables were created correctly:
-- SELECT * FROM ai_usage LIMIT 5;
-- SELECT * FROM ai_conversations LIMIT 5;
