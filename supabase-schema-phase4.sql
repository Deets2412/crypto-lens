-- ============================================================
-- CoinDebrief — Phase 4: AI Intelligence Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. AI usage tracking (rate limiting per day per user)
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  query_count INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, usage_date)
);

-- 2. AI conversation history
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  query_type TEXT NOT NULL DEFAULT 'general',
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  model_used TEXT,
  tokens_used INTEGER DEFAULT 0,
  citations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for ai_usage
CREATE POLICY "Users can view own AI usage"
  ON public.ai_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI usage"
  ON public.ai_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI usage"
  ON public.ai_usage FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. RLS Policies for ai_conversations
CREATE POLICY "Users can view own AI conversations"
  ON public.ai_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI conversations"
  ON public.ai_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 6. Admin policies (admins can view all for the admin dashboard)
CREATE POLICY "Admins can view all AI usage"
  ON public.ai_usage FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view all AI conversations"
  ON public.ai_conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON public.ai_usage(user_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_ai_usage_date ON public.ai_usage(usage_date);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created ON public.ai_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_query_type ON public.ai_conversations(query_type);

-- 8. Updated_at trigger for ai_usage
CREATE TRIGGER ai_usage_updated_at
  BEFORE UPDATE ON public.ai_usage
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 9. Cleanup: auto-delete conversation history older than 30 days (optional)
-- You can run this periodically or set up a Supabase Edge Function
-- DELETE FROM public.ai_conversations WHERE created_at < NOW() - INTERVAL '30 days';
