// ============================================================
// CoinDebrief V2 — Daily Briefing Cron Job
// Triggered by Vercel Cron at 6:00 AM UTC daily
// Sends personalized email briefings to subscribed users
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { fetchTopCoins, fetchNews } from '@/lib/api';
import { generateBriefing } from '@/lib/briefing';
import { renderBriefingEmail } from '@/lib/email-template';
import { generateAIMarketSummary, generateAIPortfolioInsight } from '@/lib/ai-briefing';
import { PortfolioHolding } from '@/lib/types';

// Use service role client for cron (bypasses RLS)
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this header for cron jobs)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const resend = new Resend(process.env.RESEND_API_KEY);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://crypto-lens-kappa.vercel.app';

    // 1. Get all users who want daily briefings
    const { data: emailPrefs, error: prefsError } = await supabase
      .from('email_preferences')
      .select('user_id, include_portfolio')
      .eq('daily_briefing', true);

    if (prefsError) {
      console.error('Failed to fetch email preferences:', prefsError);
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }

    if (!emailPrefs || emailPrefs.length === 0) {
      return NextResponse.json({ message: 'No subscribers', sent: 0 });
    }

    // 2. Get user profiles + subscription info for these users
    const userIds = emailPrefs.map((p) => p.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, tier')
      .in('id', userIds);

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ message: 'No profiles found', sent: 0 });
    }

    // Filter: only night_owl and coin_sense tiers get daily briefings
    const eligibleProfiles = profiles.filter(
      (p) => p.tier === 'night_owl' || p.tier === 'coin_sense'
    );

    if (eligibleProfiles.length === 0) {
      return NextResponse.json({ message: 'No eligible subscribers', sent: 0 });
    }

    // 3. Fetch market data once for all emails
    const [coins, news] = await Promise.all([
      fetchTopCoins(100),
      fetchNews(50),
    ]);

    if (coins.length === 0) {
      return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
    }

    // 3b. Generate AI market summary once for all emails (shared)
    const baseBriefing = generateBriefing(coins, news);
    const aiMarketSummary = await generateAIMarketSummary(baseBriefing);

    // 4. Send emails
    let sentCount = 0;
    let errorCount = 0;

    for (const profile of eligibleProfiles) {
      try {
        // Check if this user wants portfolio included
        const pref = emailPrefs.find((p) => p.user_id === profile.id);
        let holdings: PortfolioHolding[] | undefined;

        // Only include portfolio for coin_sense users who opted in
        if (profile.tier === 'coin_sense' && pref?.include_portfolio) {
          const { data: holdingsData } = await supabase
            .from('portfolio_holdings')
            .select('*')
            .eq('user_id', profile.id);

          if (holdingsData && holdingsData.length > 0) {
            holdings = holdingsData.map((h) => ({
              id: h.id,
              userId: h.user_id,
              coinId: h.coin_id,
              symbol: h.symbol,
              name: h.name,
              amount: parseFloat(h.amount),
              buyPrice: parseFloat(h.buy_price),
              createdAt: h.created_at,
              updatedAt: h.updated_at,
            }));
          }
        }

        // Generate personalized briefing
        const briefing = generateBriefing(coins, news, holdings);

        // Inject AI market summary if available
        if (aiMarketSummary) {
          briefing.aiMarketSummary = aiMarketSummary;
        }

        // Generate AI portfolio insight for coin_sense users
        if (profile.tier === 'coin_sense' && briefing.portfolioSummary) {
          const aiPortfolioInsight = await generateAIPortfolioInsight(briefing.portfolioSummary);
          if (aiPortfolioInsight) {
            briefing.aiPortfolioInsight = aiPortfolioInsight;
          }
        }

        const html = renderBriefingEmail(briefing, appUrl);

        // Send via Resend
        await resend.emails.send({
          from: 'CoinDebrief <briefing@coindebrief.com>',
          to: profile.email,
          subject: `📈 CoinDebrief Daily — ${briefing.date}`,
          html,
        });

        sentCount++;
      } catch (emailErr) {
        console.error(`Failed to send to ${profile.email}:`, emailErr);
        errorCount++;
      }
    }

    return NextResponse.json({
      message: 'Daily briefing complete',
      sent: sentCount,
      errors: errorCount,
      total: eligibleProfiles.length,
    });
  } catch (err) {
    console.error('Cron job failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
