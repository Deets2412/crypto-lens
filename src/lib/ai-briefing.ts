// ============================================================
// CoinDebrief V2 — AI-Enhanced Briefing (Perplexity Sonar)
// "The daily email just got a brain upgrade."
// ============================================================

import { BriefingData } from './types';

// ==================== AI MARKET SUMMARY ====================

/**
 * Calls Perplexity Sonar to generate a real-time AI market summary
 * for the daily email briefing. Falls back gracefully if the API
 * key isn't configured or the call fails.
 */
export async function generateAIMarketSummary(
  briefingData: BriefingData
): Promise<string | null> {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    console.log('PERPLEXITY_API_KEY not set, skipping AI summary');
    return null;
  }

  try {
    // Build context from the briefing data
    const topMoversContext = briefingData.topMovers
      .map((m) => `${m.name} (${m.symbol}): ${m.change24h > 0 ? '+' : ''}${m.change24h.toFixed(1)}%`)
      .join(', ');

    const topLosersContext = briefingData.topLosers
      .map((m) => `${m.name} (${m.symbol}): ${m.change24h.toFixed(1)}%`)
      .join(', ');

    const newsContext = briefingData.newsHighlights
      .map((n) => `"${n.title}" (${n.sentiment})`)
      .join('; ');

    const prompt = `You are the CoinDebrief AI — sardonic, cynical, but genuinely helpful. Write a 3-4 sentence morning market summary for a daily email briefing.

Context from our data:
- Market mood: ${briefingData.marketOverview.marketMood}
- Total market cap: $${(briefingData.marketOverview.totalMarketCap / 1e12).toFixed(2)}T
- BTC dominance: ${briefingData.marketOverview.btcDominance}%
- Top gainers: ${topMoversContext}
- Top losers: ${topLosersContext}
- Key headlines: ${newsContext || 'Nothing notable'}

Search for any breaking overnight crypto news and combine with the data above. Be punchy, sardonic, and specific. No generic fluff. End with one actionable observation.`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a sardonic crypto analyst writing a morning briefing email. Keep it under 4 sentences. No markdown formatting — plain text only. Be specific with data.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('Sonar API error in briefing:', response.status);
      return null;
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content;

    if (!summary) return null;

    // Clean up any markdown that might sneak in
    return summary
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,3}\s/g, '')
      .trim();
  } catch (err) {
    console.error('Failed to generate AI summary for briefing:', err);
    return null;
  }
}

// ==================== AI PORTFOLIO INSIGHT ====================

/**
 * Generates a personalized AI insight about the user's portfolio
 * for the daily email. Only called for coin_sense tier users.
 */
export async function generateAIPortfolioInsight(
  portfolioSummary: NonNullable<BriefingData['portfolioSummary']>
): Promise<string | null> {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) return null;

  try {
    const prompt = `You are the CoinDebrief AI. Give a 2-sentence sardonic but helpful observation about this user's portfolio day:
- Total value: $${portfolioSummary.totalValue.toFixed(0)}
- Day change: ${portfolioSummary.dayChangePercent > 0 ? '+' : ''}${portfolioSummary.dayChangePercent.toFixed(1)}%
- Best performer: ${portfolioSummary.bestPerformer}
- Worst performer: ${portfolioSummary.worstPerformer}

Search for any relevant news about their best and worst performers. Be specific and actionable. Plain text only, no markdown.`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a sardonic crypto portfolio analyst. 2 sentences max. Plain text only. Be specific with data.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const insight = data.choices?.[0]?.message?.content;

    if (!insight) return null;

    return insight.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,3}\s/g, '').trim();
  } catch (err) {
    console.error('Failed to generate AI portfolio insight:', err);
    return null;
  }
}
