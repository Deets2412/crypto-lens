// ============================================================
// CoinDebrief V2 — Scoring & Recommendation Engine
// ============================================================

import { Coin, NewsArticle, ScoredNewsArticle, ScreenerRow, Recommendation, Sentiment, RiskRating, CoinCategory } from './types';
import { calculateBSMeter } from './commentary';

// ==================== SENTIMENT SCORING ====================

const BULLISH_WORDS = [
    'surge', 'surges', 'surging', 'soar', 'soars', 'soaring', 'rally', 'rallies',
    'bullish', 'breakout', 'breakthrough', 'moon', 'mooning', 'pump', 'pumping',
    'partnership', 'adoption', 'launch', 'launches', 'upgrade', 'approval',
    'institutional', 'milestone', 'record', 'high', 'gain', 'gains', 'growth',
    'optimistic', 'positive', 'upward', 'recovery', 'boom', 'integration',
    'strategic', 'expansion', 'innovation', 'revolutionary', 'listing',
    'accumulate', 'accumulation', 'whale', 'buy', 'buying', 'bought',
    'etf', 'fund', 'investment', 'inflow', 'bullrun', 'all-time',
];

const BEARISH_WORDS = [
    'crash', 'crashes', 'crashing', 'plunge', 'plunges', 'plunging',
    'bearish', 'dump', 'dumping', 'sell', 'selling', 'selloff', 'sell-off',
    'hack', 'hacked', 'exploit', 'vulnerability', 'scam', 'fraud', 'rug',
    'rugpull', 'collapse', 'ban', 'banned', 'regulation', 'crackdown',
    'lawsuit', 'sec', 'investigation', 'fud', 'fear', 'panic', 'loss',
    'decline', 'drop', 'drops', 'dropping', 'plummet', 'tank', 'tanks',
    'warning', 'risk', 'bubble', 'overvalued', 'downturn', 'recession',
    'outflow', 'liquidation', 'liquidated', 'bankrupt', 'bankruptcy',
];

const COIN_KEYWORDS: Record<string, string[]> = {
    bitcoin: ['bitcoin', 'btc'],
    ethereum: ['ethereum', 'eth', 'ether'],
    solana: ['solana', 'sol'],
    cardano: ['cardano', 'ada'],
    ripple: ['ripple', 'xrp'],
    dogecoin: ['dogecoin', 'doge'],
    polkadot: ['polkadot', 'dot'],
    avalanche: ['avalanche', 'avax'],
    chainlink: ['chainlink', 'link'],
    'matic-network': ['polygon', 'matic'],
};

export function scoreSentiment(article: NewsArticle): ScoredNewsArticle {
    const text = `${article.title} ${article.body}`.toLowerCase();
    const words = text.split(/\W+/);

    let score = 0;
    for (const w of words) {
        if (BULLISH_WORDS.includes(w)) score += 5;
        if (BEARISH_WORDS.includes(w)) score -= 5;
    }

    // Title words count double
    const titleWords = article.title.toLowerCase().split(/\W+/);
    for (const w of titleWords) {
        if (BULLISH_WORDS.includes(w)) score += 5;
        if (BEARISH_WORDS.includes(w)) score -= 5;
    }

    // Clamp
    score = Math.max(-100, Math.min(100, score));

    let sentiment: Sentiment = 'Neutral';
    if (score >= 10) sentiment = 'Bullish';
    else if (score <= -10) sentiment = 'Bearish';

    // Find mentioned coins
    const mentionedCoins: string[] = [];
    for (const [coinId, keywords] of Object.entries(COIN_KEYWORDS)) {
        for (const kw of keywords) {
            if (text.includes(kw)) {
                mentionedCoins.push(coinId);
                break;
            }
        }
    }

    return {
        ...article,
        sentiment,
        sentimentScore: score,
        mentionedCoins,
    };
}

// ==================== COIN CATEGORIZATION ====================

export function categorizeCoin(coin: Coin): CoinCategory {
    const volatility = Math.abs(coin.price_change_percentage_24h || 0);
    // Blue chips: top 30 by market cap AND relatively low volatility
    if (coin.market_cap_rank <= 30 && volatility < 12) {
        return 'blue-chip';
    }
    // Stablecoins are always blue-chip
    const stableSymbols = ['usdt', 'usdc', 'dai', 'busd', 'tusd', 'usdp'];
    if (stableSymbols.includes(coin.symbol.toLowerCase())) {
        return 'blue-chip';
    }
    // Everything else is casino
    if (coin.market_cap_rank > 30) {
        return 'casino';
    }
    // Top 30 but highly volatile = casino
    if (volatility >= 12) {
        return 'casino';
    }
    return 'blue-chip';
}

// ==================== SCREENER SCORING ====================

export function scoreScreenerRow(coin: Coin): ScreenerRow {
    const supplyRatio = coin.max_supply
        ? coin.circulating_supply / coin.max_supply
        : coin.total_supply
            ? coin.circulating_supply / coin.total_supply
            : 1;

    const volumeToMcap = coin.market_cap > 0
        ? coin.total_volume / coin.market_cap
        : 0;

    const athDistance = coin.ath_change_percentage; // already negative %

    // --- Fundamental Score (0-100) ---
    let fundamentalScore = 50; // baseline

    // Market cap rank bonus (top 10 = +20, top 50 = +10)
    if (coin.market_cap_rank <= 10) fundamentalScore += 20;
    else if (coin.market_cap_rank <= 30) fundamentalScore += 15;
    else if (coin.market_cap_rank <= 50) fundamentalScore += 10;

    // Volume-to-mcap ratio: higher = more active
    if (volumeToMcap > 0.15) fundamentalScore += 15;
    else if (volumeToMcap > 0.08) fundamentalScore += 10;
    else if (volumeToMcap > 0.04) fundamentalScore += 5;

    // Supply scarcity: lower ratio = more scarce
    if (supplyRatio < 0.5) fundamentalScore += 10;
    else if (supplyRatio < 0.75) fundamentalScore += 5;

    fundamentalScore = Math.min(100, Math.max(0, fundamentalScore));

    // --- Technical Score (0-100) ---
    let technicalScore = 50;

    // 24h momentum
    const change24h = coin.price_change_percentage_24h || 0;
    if (change24h > 10) technicalScore += 20;
    else if (change24h > 5) technicalScore += 15;
    else if (change24h > 2) technicalScore += 10;
    else if (change24h > 0) technicalScore += 5;
    else if (change24h < -10) technicalScore -= 15;
    else if (change24h < -5) technicalScore -= 10;
    else if (change24h < -2) technicalScore -= 5;

    // 7d momentum
    const change7d = coin.price_change_percentage_7d_in_currency || 0;
    if (change7d > 15) technicalScore += 15;
    else if (change7d > 5) technicalScore += 10;
    else if (change7d > 0) technicalScore += 5;
    else if (change7d < -15) technicalScore -= 10;
    else if (change7d < -5) technicalScore -= 5;

    // ATH distance: if close to ATH, strong; if far, potential recovery play
    if (athDistance > -10) technicalScore += 5; // near ATH = strong
    else if (athDistance < -70) technicalScore += 10; // very far = value play

    technicalScore = Math.min(100, Math.max(0, technicalScore));

    const compositeScore = Math.round(fundamentalScore * 0.4 + technicalScore * 0.6);

    // V2: Category and BS Meter
    const category = categorizeCoin(coin);
    const bsMeter = calculateBSMeter(coin, category, supplyRatio, volumeToMcap, athDistance);

    return {
        coin,
        fundamentalScore: Math.round(fundamentalScore),
        technicalScore: Math.round(technicalScore),
        compositeScore,
        supplyRatio: Math.round(supplyRatio * 100) / 100,
        volumeToMcap: Math.round(volumeToMcap * 10000) / 10000,
        athDistance: Math.round(athDistance * 100) / 100,
        category,
        bsMeterScore: bsMeter.score,
    };
}

// ==================== RECOMMENDATION ENGINE ====================

export function generateRecommendations(
    coins: Coin[],
    newsArticles: NewsArticle[],
    filterCategory?: CoinCategory
): Recommendation[] {
    // Score all news
    const scoredNews = newsArticles.map(scoreSentiment);

    // Score all coins
    const screenerRows = coins.map(scoreScreenerRow);

    // Optionally filter by category
    const filteredRows = filterCategory
        ? screenerRows.filter(r => r.category === filterCategory)
        : screenerRows;

    // For each coin, compute a final recommendation score
    const recommendations = filteredRows.map((row) => {
        const coinId = row.coin.id.toLowerCase();
        const coinSymbol = row.coin.symbol.toLowerCase();

        // Count bullish news
        const relevantNews = scoredNews.filter(
            (n) =>
                n.mentionedCoins.includes(coinId) ||
                n.title.toLowerCase().includes(coinSymbol) ||
                n.body.toLowerCase().includes(coinId)
        );
        const bullishCount = relevantNews.filter((n) => n.sentiment === 'Bullish').length;
        const bearishCount = relevantNews.filter((n) => n.sentiment === 'Bearish').length;
        const newsBoost = (bullishCount - bearishCount) * 5;

        // Final confidence
        let confidenceScore = row.compositeScore + newsBoost;
        confidenceScore = Math.min(95, Math.max(5, confidenceScore));

        // Generate reasoning
        const reasoning: string[] = [];
        const change24h = row.coin.price_change_percentage_24h || 0;
        const change7d = row.coin.price_change_percentage_7d_in_currency || 0;

        if (change24h > 5) reasoning.push(`Price surged ${change24h.toFixed(1)}% in 24h`);
        else if (change24h > 0) reasoning.push(`Price up ${change24h.toFixed(1)}% in 24h`);
        else if (change24h < -5) reasoning.push(`Price dropped ${Math.abs(change24h).toFixed(1)}% in 24h — potential buy-the-dip`);

        if (change7d > 10) reasoning.push(`Strong 7-day momentum: +${change7d.toFixed(1)}%`);
        else if (change7d < -10) reasoning.push(`Weak 7-day trend: ${change7d.toFixed(1)}% — recovery potential`);

        if (row.volumeToMcap > 0.1) reasoning.push(`High trading activity (Vol/MCap: ${(row.volumeToMcap * 100).toFixed(1)}%)`);
        if (row.athDistance < -60) reasoning.push(`Trading ${Math.abs(row.athDistance).toFixed(0)}% below ATH — undervalued potential`);
        if (row.athDistance > -10) reasoning.push(`Near all-time high — strong momentum`);
        if (bullishCount > 0) reasoning.push(`${bullishCount} bullish news signal${bullishCount > 1 ? 's' : ''} detected`);
        if (row.supplyRatio < 0.5) reasoning.push(`Scarce supply: only ${(row.supplyRatio * 100).toFixed(0)}% in circulation`);
        if (row.coin.market_cap_rank <= 10) reasoning.push(`Top ${row.coin.market_cap_rank} by market cap — established asset`);

        if (reasoning.length === 0) reasoning.push('Balanced fundamentals and technicals');

        // Risk rating
        let riskRating: RiskRating = 'Medium';
        if (row.coin.market_cap_rank <= 10 && Math.abs(change24h) < 5) riskRating = 'Low';
        else if (row.coin.market_cap_rank > 50 || Math.abs(change24h) > 15) riskRating = 'High';

        return {
            coin: row.coin,
            confidenceScore: Math.round(confidenceScore),
            riskRating,
            reasoning,
            newsSignals: bullishCount,
            compositeScore: row.compositeScore,
            category: row.category,
        };
    });

    // Sort by confidence, return top results
    recommendations.sort((a, b) => b.confidenceScore - a.confidenceScore);
    return recommendations;
}
