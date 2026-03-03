// ============================================================
// CoinDebrief V2 — Daily Email Briefing Generator
// "Your morning coffee's best friend. And worst enemy."
// ============================================================

import {
  Coin,
  NewsArticle,
  BriefingData,
  BriefingMover,
  BriefingNewsItem,
  PortfolioHolding,
} from './types';
import { scoreSentiment } from './scoring';
import { formatCurrency, formatPercentage } from './api';

// ==================== MARKET MOOD ====================

const MARKET_MOODS: [number, string[]][] = [
  [-5, [
    'The market is performing a graceful swan dive into oblivion.',
    'Everything is fine. By which I mean everything is on fire.',
    'Today\'s market mood: "I should have invested in mattress stuffing."',
  ]],
  [-2, [
    'Market\'s having a mild existential crisis. Should recover. Probably.',
    'Slight turbulence. The "this is fine" dog would be mildly nervous.',
    'Market dip in progress. Perfect time to pretend you\'re "dollar cost averaging" on purpose.',
  ]],
  [2, [
    'Market\'s doing that boring sideways thing. Like watching paint dry, but the paint costs money.',
    'Flat market. Your portfolio didn\'t move, which in crypto counts as a win.',
    'Nothing happened. This is actually the healthiest possible crypto day.',
  ]],
  [5, [
    'Green candles. Your coworker who "just got into crypto" will not shut up today.',
    'Market\'s up. Quick, act like you knew this was going to happen.',
    'Modest gains across the board. Enough to feel smug, not enough to retire.',
  ]],
  [100, [
    'Market is absolutely ripping. This is either the start of a bull run or the peak. Flip a coin.',
    'Everything\'s pumping. Your Uber driver is about to ask you about altcoins.',
    'FOMO levels: Critical. Your therapist is about to get a lot of new crypto-related appointments.',
  ]],
];

function getMarketMood(avgChange: number): string {
  for (const [threshold, moods] of MARKET_MOODS) {
    if (avgChange < threshold) {
      return moods[Math.floor(Math.random() * moods.length)];
    }
  }
  return MARKET_MOODS[MARKET_MOODS.length - 1][1][0];
}

// ==================== MOVER QUIPS ====================

function getMoverQuip(name: string, change: number, isTop: boolean): string {
  const abs = Math.abs(change);

  if (isTop) {
    // Gainers
    if (abs > 20) return `${name} went full rocket ship. If you held this, screenshot immediately.`;
    if (abs > 10) return `Double-digit gains. ${name} is having a very good day. Unlike your FOMO.`;
    if (abs > 5) return `Solid pump. ${name} is the popular kid at school today.`;
    return `${name} is up modestly. The crypto equivalent of "fine, I guess."`;
  } else {
    // Losers
    if (abs > 20) return `${name} is speed-running the "stages of grief" chart pattern.`;
    if (abs > 10) return `Rough day for ${name} holders. The Telegram chat has gone suspiciously quiet.`;
    if (abs > 5) return `${name} is bleeding. Not life-threatening, but you\'ll want to apply pressure.`;
    return `${name} is down slightly. Death by a thousand red candles.`;
  }
}

// ==================== NEWS QUIPS ====================

function getNewsQuip(title: string, sentiment: string): string {
  const titleLower = title.toLowerCase();

  if (titleLower.includes('partnership') || titleLower.includes('integration')) {
    return 'Another "strategic partnership" announcement. Drink.';
  }
  if (titleLower.includes('etf')) {
    return 'ETF news — where Wall Street pretends they didn\'t call crypto a scam 2 years ago.';
  }
  if (titleLower.includes('hack') || titleLower.includes('exploit')) {
    return 'Security incident. Code is law, and apparently law enforcement.';
  }
  if (titleLower.includes('regulation') || titleLower.includes('sec')) {
    return 'Regulatory news. Politicians are confused about crypto, and they\'d like YOU to be confused too.';
  }
  if (sentiment === 'Bullish') {
    return 'Bullish vibes. Real or manufactured? That\'s tomorrow\'s problem.';
  }
  if (sentiment === 'Bearish') {
    return 'Bearish signal. Remember: FUD is just information you don\'t want to hear.';
  }
  return 'Make of this what you will. We certainly can\'t.';
}

// ==================== SIGN-OFFS ====================

const SIGN_OFFS = [
  'That\'s your debrief. Go forth and make questionable financial decisions. — CoinDebrief',
  'Remember: past performance is not indicative of future results. But it IS indicative of future regrets. — CoinDebrief',
  'This is not financial advice. This is barely coherent commentary. — CoinDebrief',
  'DYOR. Or don\'t. We\'re an email, not your financial advisor. — CoinDebrief',
  'Stay cynical, stay informed, and maybe consider an index fund. Just saying. — CoinDebrief',
  'That\'s all for today. Your portfolio will still be there tomorrow. For better or worse. — CoinDebrief',
  'End of briefing. If this email made you feel something, that\'s called "emotion" — don\'t trade on it. — CoinDebrief',
];

// ==================== PORTFOLIO SUMMARY ====================

function generatePortfolioSummary(
  holdings: PortfolioHolding[],
  coins: Coin[]
): BriefingData['portfolioSummary'] | undefined {
  if (holdings.length === 0) return undefined;

  const coinMap = new Map(coins.map((c) => [c.id.toLowerCase(), c]));

  let totalValue = 0;
  let bestChange = -Infinity;
  let worstChange = Infinity;
  let bestName = '';
  let worstName = '';

  for (const h of holdings) {
    const coin = coinMap.get(h.coinId.toLowerCase());
    if (!coin) continue;

    const value = h.amount * coin.current_price;
    totalValue += value;

    const change = coin.price_change_percentage_24h || 0;
    if (change > bestChange) {
      bestChange = change;
      bestName = coin.name;
    }
    if (change < worstChange) {
      worstChange = change;
      worstName = coin.name;
    }
  }

  // Calculate approximate day change based on 24h price changes
  let dayChange = 0;
  for (const h of holdings) {
    const coin = coinMap.get(h.coinId.toLowerCase());
    if (!coin) continue;
    const value = h.amount * coin.current_price;
    const change24h = coin.price_change_percentage_24h || 0;
    dayChange += value * (change24h / 100);
  }

  const dayChangePercent = totalValue > 0 ? (dayChange / (totalValue - dayChange)) * 100 : 0;

  let verdict: string;
  if (dayChangePercent > 5) {
    verdict = `Your portfolio is up ${dayChangePercent.toFixed(1)}% today. Don't get used to it.`;
  } else if (dayChangePercent > 0) {
    verdict = `Green day — up ${dayChangePercent.toFixed(1)}%. Small wins are still wins. Tell yourself that.`;
  } else if (dayChangePercent > -3) {
    verdict = `Down ${Math.abs(dayChangePercent).toFixed(1)}% today. Not great, not terrible. The Chernobyl of portfolio days.`;
  } else {
    verdict = `Down ${Math.abs(dayChangePercent).toFixed(1)}% today. Consider closing the app and going outside. The sun is free.`;
  }

  return {
    totalValue,
    dayChange,
    dayChangePercent,
    worstPerformer: worstName,
    bestPerformer: bestName,
    verdict,
  };
}

// ==================== MAIN GENERATOR ====================

export function generateBriefing(
  coins: Coin[],
  news: NewsArticle[],
  holdings?: PortfolioHolding[]
): BriefingData {
  // Market overview
  const top50 = coins.slice(0, 50);
  const avgChange = top50.reduce((sum, c) => sum + (c.price_change_percentage_24h || 0), 0) / top50.length;
  const totalMarketCap = coins.reduce((sum, c) => sum + c.market_cap, 0);
  const btcDominance = coins.find((c) => c.id === 'bitcoin')
    ? (coins.find((c) => c.id === 'bitcoin')!.market_cap / totalMarketCap) * 100
    : 0;
  const totalVolume = coins.reduce((sum, c) => sum + c.total_volume, 0);

  // Top movers (gainers)
  const sortedByGain = [...coins]
    .filter((c) => c.price_change_percentage_24h !== null)
    .sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0));

  const topMovers: BriefingMover[] = sortedByGain.slice(0, 3).map((c) => ({
    name: c.name,
    symbol: c.symbol.toUpperCase(),
    price: c.current_price,
    change24h: c.price_change_percentage_24h || 0,
    quip: getMoverQuip(c.name, c.price_change_percentage_24h || 0, true),
  }));

  // Top losers
  const topLosers: BriefingMover[] = sortedByGain.slice(-3).reverse().map((c) => ({
    name: c.name,
    symbol: c.symbol.toUpperCase(),
    price: c.current_price,
    change24h: c.price_change_percentage_24h || 0,
    quip: getMoverQuip(c.name, Math.abs(c.price_change_percentage_24h || 0), false),
  }));

  // News highlights
  const scoredNews = news.slice(0, 20).map(scoreSentiment);
  const significantNews = scoredNews
    .filter((n) => n.sentiment !== 'Neutral')
    .sort((a, b) => Math.abs(b.sentimentScore) - Math.abs(a.sentimentScore))
    .slice(0, 4);

  const newsHighlights: BriefingNewsItem[] = significantNews.map((n) => ({
    title: n.title,
    source: n.source,
    sentiment: n.sentiment,
    url: n.url,
    quip: getNewsQuip(n.title, n.sentiment),
  }));

  // Portfolio summary (if user has holdings)
  const portfolioSummary = holdings ? generatePortfolioSummary(holdings, coins) : undefined;

  return {
    date: new Date().toISOString().split('T')[0],
    marketOverview: {
      totalMarketCap,
      btcDominance: Math.round(btcDominance * 10) / 10,
      totalVolume,
      marketMood: getMarketMood(avgChange),
    },
    topMovers,
    topLosers,
    portfolioSummary,
    newsHighlights,
    signOff: SIGN_OFFS[Math.floor(Math.random() * SIGN_OFFS.length)],
  };
}
