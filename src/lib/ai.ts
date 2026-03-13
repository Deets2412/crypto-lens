// ============================================================
// CoinDebrief V2 — AI Intelligence Engine (Perplexity Sonar)
// "Because reading crypto news manually is for normies."
// ============================================================

import type { UserTier } from './auth';

// ==================== TIER LIMITS ====================

export interface AITierConfig {
  dailyQueries: number;
  model: string;
  maxTokens: number;
  features: string[];
}

export const AI_TIER_LIMITS: Record<UserTier, AITierConfig> = {
  normie: {
    dailyQueries: 5,
    model: 'sonar',
    maxTokens: 1024,
    features: ['market_brief', 'coin_lookup'],
  },
  night_owl: {
    dailyQueries: 25,
    model: 'sonar',
    maxTokens: 2048,
    features: ['market_brief', 'coin_lookup', 'news_analysis', 'trend_scan'],
  },
  coin_sense: {
    dailyQueries: 100, // effectively unlimited for normal use
    model: 'sonar-pro',
    maxTokens: 4096,
    features: ['market_brief', 'coin_lookup', 'news_analysis', 'trend_scan', 'deep_research', 'portfolio_ai'],
  },
};

// ==================== SYSTEM PROMPTS ====================

const COINDEBRIEF_PERSONA = `You are the CoinDebrief AI — a sardonic, battle-hardened crypto analyst who's seen every rug pull, pump-and-dump, and "revolutionary" whitepaper since 2017.

Your personality:
- Cynical but genuinely helpful. You roast bad ideas but give real analysis.
- You never use phrases like "exciting opportunity" or "game-changing technology" without irony.
- You reference crypto culture naturally: diamond hands, rug pulls, "number go up", etc.
- You're allergic to hype. If something sounds too good to be true, you say so.
- Short, punchy sentences. No corporate waffle.
- You cite real data when available and say "I don't know" when you don't.
- You never give financial advice, but you'll happily tell someone their portfolio choices are... questionable.

Format: Use markdown. Keep responses concise but thorough. Use bullet points for lists. Bold key figures.`;

export const SYSTEM_PROMPTS = {
  market_brief: `${COINDEBRIEF_PERSONA}

You're generating a real-time market briefing. Search for the latest crypto market data and news. Include:
- Overall market mood (with your sardonic take)
- Top movers and losers with context on WHY they moved
- Any breaking news or events driving the market
- A one-liner summary a busy person can skim in 10 seconds

Keep it under 400 words. No fluff.`,

  coin_lookup: `${COINDEBRIEF_PERSONA}

The user is asking about a specific cryptocurrency. Search for the latest data and give them:
- Current price, 24h change, and market cap
- What's driving recent price action
- Any recent news, partnerships, or red flags
- Your honest (sardonic) take on the project
- BS Meter rating: rate the hype-to-substance ratio 1-10

Keep it factual but entertaining. Under 300 words.`,

  news_analysis: `${COINDEBRIEF_PERSONA}

Analyze the latest crypto news. Search for current headlines and:
- Separate signal from noise — what actually matters vs clickbait
- Identify which coins are affected and how
- Rate each story's likely market impact (Low / Medium / High)
- Give your sardonic take on each headline

Format as a numbered list of stories. Keep to the top 5 most relevant.`,

  trend_scan: `${COINDEBRIEF_PERSONA}

Scan for emerging crypto trends and narratives. Search broadly and identify:
- What sectors/narratives are gaining momentum (DeFi, AI, L2s, memecoins, etc.)
- Any rotation patterns — money flowing from where to where
- Social media buzz vs actual on-chain activity
- Your sardonic prediction on which trends will survive the week

Be specific with examples and data points.`,

  deep_research: `${COINDEBRIEF_PERSONA}

The user wants a deep dive. This is your time to shine. Search extensively and provide:
- Comprehensive analysis with multiple sources
- Pros AND cons — no cheerleading
- Comparison to competitors where relevant
- Technical fundamentals where applicable
- Your honest verdict — would you put your own money here?

This is the premium experience. Be thorough but keep the CoinDebrief voice. Under 600 words.`,

  portfolio_ai: `${COINDEBRIEF_PERSONA}

The user is asking about their portfolio. Analyze their holdings in context of current market conditions:
- Search for latest news on their specific coins
- Identify any risk events or catalysts coming up
- Suggest whether their allocation makes sense given current conditions
- Be brutally honest about any positions that look questionable

Remember: you're the friend who tells them the truth, not the one who agrees to be nice.`,

  general: `${COINDEBRIEF_PERSONA}

Answer the user's crypto-related question. Search for current information and provide a helpful, sardonic response. Stay in character.`,
};

// ==================== QUERY TYPES ====================

export type QueryType = keyof typeof SYSTEM_PROMPTS;

export function detectQueryType(message: string): QueryType {
  const lower = message.toLowerCase();

  if (/market\s*(brief|update|overview|summary|mood|today|happening)/i.test(lower)) {
    return 'market_brief';
  }
  if (/news|headline|breaking|latest/i.test(lower)) {
    return 'news_analysis';
  }
  if (/trend|narrative|sector|momentum|rotation/i.test(lower)) {
    return 'trend_scan';
  }
  if (/portfolio|my\s*(holdings?|bag|positions?)/i.test(lower)) {
    return 'portfolio_ai';
  }
  if (/deep\s*dive|research|analysis|comprehensive|tell\s*me\s*everything/i.test(lower)) {
    return 'deep_research';
  }
  // Check for coin-specific queries (mentions of tickers or coin names)
  if (/\b(btc|eth|sol|ada|xrp|doge|bnb|avax|dot|link|matic|bitcoin|ethereum|solana|cardano|ripple|dogecoin)\b/i.test(lower)) {
    return 'coin_lookup';
  }

  return 'general';
}

// ==================== PERPLEXITY API CLIENT ====================

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  citations: string[];
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function queryPerplexity(
  messages: AIMessage[],
  model: string = 'sonar',
  maxTokens: number = 2048,
): Promise<AIResponse> {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY is not configured');
  }

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
      return_citations: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Perplexity API error:', response.status, error);
    throw new Error(`Perplexity API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    content: data.choices?.[0]?.message?.content || 'No response generated.',
    citations: data.citations || [],
    model: data.model || model,
    usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  };
}

// ==================== USAGE HELPERS ====================

export function getTodayKey(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

export function getQueryLimitMessage(tier: UserTier, used: number): string {
  const limit = AI_TIER_LIMITS[tier].dailyQueries;
  const remaining = Math.max(0, limit - used);

  if (remaining === 0) {
    return tier === 'coin_sense'
      ? "Look, even the AI needs a coffee break. You've hit your daily limit. Come back tomorrow, champ."
      : `You've burned through all ${limit} queries today. ${tier === 'normie' ? 'Upgrade to Night Owl for 25/day — your curiosity deserves it.' : 'Upgrade to Coin Sense for 100/day — you clearly have questions.'}`;
  }

  return `${remaining} queries left today. Use them wisely. Or don't. I'm not your financial advisor.`;
}
