// ============================================================
// CoinDebrief V2 — AI Usage Stats API
// GET /api/ai/usage — returns current usage for the day
// ============================================================

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { AI_TIER_LIMITS, getTodayKey, getQueryLimitMessage } from '@/lib/ai';
import type { UserTier } from '@/lib/auth';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .single();

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const tier: UserTier = (subscription?.tier || profile?.tier || 'normie') as UserTier;
    const tierConfig = AI_TIER_LIMITS[tier];

    // Get today's usage
    const todayKey = getTodayKey();
    const { data: usageRecord } = await supabase
      .from('ai_usage')
      .select('query_count, total_tokens')
      .eq('user_id', user.id)
      .eq('usage_date', todayKey)
      .single();

    const used = usageRecord?.query_count || 0;
    const totalTokens = usageRecord?.total_tokens || 0;

    // Get recent conversation history (last 10)
    const { data: recentQueries } = await supabase
      .from('ai_conversations')
      .select('id, query_type, user_message, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      tier,
      model: tierConfig.model,
      features: tierConfig.features,
      usage: {
        queriesUsed: used,
        queriesLimit: tierConfig.dailyQueries,
        queriesRemaining: Math.max(0, tierConfig.dailyQueries - used),
        totalTokensToday: totalTokens,
      },
      statusMessage: getQueryLimitMessage(tier, used),
      recentQueries: recentQueries || [],
    });
  } catch (err) {
    console.error('AI usage error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
