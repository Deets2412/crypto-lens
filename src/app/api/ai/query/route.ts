// ============================================================
// CoinDebrief V2 — AI Query API Route
// POST /api/ai/query — tier-gated Perplexity Sonar integration
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import {
  AI_TIER_LIMITS,
  SYSTEM_PROMPTS,
  detectQueryType,
  queryPerplexity,
  getTodayKey,
  getQueryLimitMessage,
  type AIMessage,
  type QueryType,
} from '@/lib/ai';
import type { UserTier } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get user profile + tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .single();

    // Check subscription for active tier
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

    // 3. Parse request
    const body = await request.json();
    const { message, queryType: requestedType, context } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (message.length > 2000) {
      return NextResponse.json({ error: 'Message too long (max 2000 characters)' }, { status: 400 });
    }

    // 4. Check daily usage limit
    const todayKey = getTodayKey();
    const { data: usageRecord } = await supabase
      .from('ai_usage')
      .select('query_count')
      .eq('user_id', user.id)
      .eq('usage_date', todayKey)
      .single();

    const currentCount = usageRecord?.query_count || 0;

    if (currentCount >= tierConfig.dailyQueries) {
      return NextResponse.json({
        error: 'Daily query limit reached',
        message: getQueryLimitMessage(tier, currentCount),
        limit: tierConfig.dailyQueries,
        used: currentCount,
        tier,
      }, { status: 429 });
    }

    // 5. Detect query type and check feature access
    const queryType: QueryType = requestedType || detectQueryType(message);

    if (!tierConfig.features.includes(queryType) && queryType !== 'general') {
      const featureName = queryType.replace(/_/g, ' ');
      return NextResponse.json({
        error: 'Feature not available on your tier',
        message: `${featureName} is locked for your tier. Upgrade to unlock it — or just ask a regular question. I don't judge. (Much.)`,
        tier,
        requiredFeature: queryType,
      }, { status: 403 });
    }

    // 6. Build messages for Perplexity
    const systemPrompt = SYSTEM_PROMPTS[queryType] || SYSTEM_PROMPTS.general;

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add portfolio context if available and query is portfolio-related
    if (context?.portfolio && queryType === 'portfolio_ai') {
      messages.push({
        role: 'user',
        content: `[PORTFOLIO CONTEXT]\nMy current holdings:\n${context.portfolio}\n\n[QUESTION]\n${message}`,
      });
    } else {
      messages.push({ role: 'user', content: message });
    }

    // 7. Call Perplexity Sonar API
    const aiResponse = await queryPerplexity(
      messages,
      tierConfig.model,
      tierConfig.maxTokens,
    );

    // 8. Track usage
    const { error: usageError } = await supabase
      .from('ai_usage')
      .upsert(
        {
          user_id: user.id,
          usage_date: todayKey,
          query_count: currentCount + 1,
          total_tokens: (usageRecord as Record<string, number> | null)?.total_tokens
            ? (usageRecord as Record<string, number>).total_tokens + aiResponse.usage.total_tokens
            : aiResponse.usage.total_tokens,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,usage_date' }
      );

    if (usageError) {
      console.error('Failed to track AI usage:', usageError);
      // Don't fail the request, just log it
    }

    // 9. Save to conversation history
    await supabase
      .from('ai_conversations')
      .insert({
        user_id: user.id,
        query_type: queryType,
        user_message: message.substring(0, 2000),
        ai_response: aiResponse.content.substring(0, 10000),
        model_used: aiResponse.model,
        tokens_used: aiResponse.usage.total_tokens,
        citations: aiResponse.citations,
      });

    // 10. Return response
    const remaining = tierConfig.dailyQueries - (currentCount + 1);

    return NextResponse.json({
      response: aiResponse.content,
      citations: aiResponse.citations,
      queryType,
      model: aiResponse.model,
      usage: {
        queriesUsed: currentCount + 1,
        queriesLimit: tierConfig.dailyQueries,
        queriesRemaining: remaining,
        tokensUsed: aiResponse.usage.total_tokens,
      },
      meta: {
        hint: remaining <= 3 && remaining > 0
          ? `${remaining} queries left. Choose wisely.`
          : remaining === 0
            ? "That was your last one for today. Make it count. (Too late.)"
            : undefined,
      },
    });
  } catch (err) {
    console.error('AI query error:', err);

    const errorMessage = err instanceof Error ? err.message : 'Unknown error';

    if (errorMessage.includes('PERPLEXITY_API_KEY')) {
      return NextResponse.json({
        error: 'AI service not configured',
        message: "The AI brain hasn't been plugged in yet. Someone forgot the API key. Classic.",
      }, { status: 503 });
    }

    return NextResponse.json({
      error: 'AI query failed',
      message: "Something broke. Even AI has bad days. Try again in a moment.",
    }, { status: 500 });
  }
}
