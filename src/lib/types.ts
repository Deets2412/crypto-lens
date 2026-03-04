// ============================================================
// CoinDebrief V2 — Type Definitions
// ============================================================

export interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  price_change_percentage_30d_in_currency?: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
  sparkline_in_7d?: { price: number[] };
}

export interface NewsArticle {
  id: string;
  title: string;
  body: string;
  url: string;
  imageurl: string;
  source: string;
  published_on: number;
  categories: string;
  tags: string;
}

export type Sentiment = 'Bullish' | 'Bearish' | 'Neutral';

export interface ScoredNewsArticle extends NewsArticle {
  sentiment: Sentiment;
  sentimentScore: number; // -100 to +100
  mentionedCoins: string[];
}

// V2 — Coin categorization
export type CoinCategory = 'blue-chip' | 'casino';

// V2 — BS Meter
export interface BSMeterData {
  score: number;       // 0-100
  label: string;       // e.g. "Smells Clean", "Run."
  variant: 'fluff' | 'wipeout'; // Blue Chip vs Casino
  factors: string[];   // explanations
}

// V2 — Real Talk
export interface RealTalkData {
  officialDescription: string;
  realTalk: string;
}

// V2 — Subscription
export type SubscriptionTier = 'free' | 'pro' | 'institutional';

export interface ScreenerRow {
  coin: Coin;
  fundamentalScore: number; // 0-100
  technicalScore: number;   // 0-100
  compositeScore: number;   // 0-100
  supplyRatio: number;      // circulating / max
  volumeToMcap: number;     // 24h vol / market cap
  athDistance: number;       // % below ATH
  category: CoinCategory;   // V2
  bsMeterScore: number;     // V2 — 0-100
}

export type RiskRating = 'Low' | 'Medium' | 'High';

export interface Recommendation {
  coin: Coin;
  confidenceScore: number; // 0-100
  riskRating: RiskRating;
  reasoning: string[];
  newsSignals: number;     // count of bullish articles
  compositeScore: number;
  category: CoinCategory;  // V2
}

export interface MarketOverview {
  totalMarketCap: number;
  totalVolume: number;
  btcDominance: number;
  activeCryptos: number;
}

// ============================================================
// Phase 2 — Portfolio X-Ray Types
// ============================================================

export interface PortfolioHolding {
  id: string;
  userId: string;
  coinId: string;           // CoinGecko ID (e.g. 'bitcoin')
  symbol: string;
  name: string;
  amount: number;           // how many coins
  buyPrice: number;         // average buy price in USD
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioPosition extends PortfolioHolding {
  currentPrice: number;
  currentValue: number;     // amount * currentPrice
  costBasis: number;        // amount * buyPrice
  pnl: number;              // currentValue - costBasis
  pnlPercent: number;       // (pnl / costBasis) * 100
  allocation: number;       // % of total portfolio
  category: CoinCategory;
  compositeScore: number;
  bsMeterScore: number;
  riskRating: RiskRating;
}

export interface PortfolioAnalysis {
  positions: PortfolioPosition[];
  totalValue: number;
  totalCostBasis: number;
  totalPnl: number;
  totalPnlPercent: number;
  portfolioBSScore: number;         // weighted average BS score
  portfolioCompositeScore: number;  // weighted average composite
  riskConcentration: RiskConcentration;
  diversificationGrade: string;     // A, B, C, D, F
  rebalancingSuggestions: RebalancingSuggestion[];
  topRisk: string;                  // sardonic one-liner about biggest risk
  overallVerdict: string;           // sardonic overall assessment
}

export interface RiskConcentration {
  topHoldingPercent: number;        // % in largest position
  top3HoldingPercent: number;       // % in top 3 positions
  casinoPercent: number;            // % in casino-category coins
  blueChipPercent: number;          // % in blue-chip coins
  singlePointOfFailure: boolean;    // any position > 40%?
}

export interface RebalancingSuggestion {
  type: 'reduce' | 'increase' | 'exit' | 'diversify';
  coinName: string;
  reason: string;    // sardonic reason
}

// ============================================================
// Phase 2 — Daily Email Briefing Types
// ============================================================

export interface BriefingData {
  date: string;
  marketOverview: {
    totalMarketCap: number;
    btcDominance: number;
    totalVolume: number;
    marketMood: string;       // sardonic one-liner
  };
  topMovers: BriefingMover[];
  topLosers: BriefingMover[];
  portfolioSummary?: {
    totalValue: number;
    dayChange: number;
    dayChangePercent: number;
    worstPerformer: string;
    bestPerformer: string;
    verdict: string;          // sardonic summary
  };
  newsHighlights: BriefingNewsItem[];
  signOff: string;            // sardonic sign-off
  aiMarketSummary?: string;   // AI-generated market summary (Sonar)
  aiPortfolioInsight?: string; // AI-generated portfolio insight (Sonar)
}

export interface BriefingMover {
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  quip: string;               // sardonic one-liner about the move
}

export interface BriefingNewsItem {
  title: string;
  source: string;
  sentiment: Sentiment;
  url: string;
  quip: string;               // sardonic take
}

export interface EmailPreferences {
  userId: string;
  dailyBriefing: boolean;
  briefingTime: string;       // e.g. '06:00' UTC
  includePortfolio: boolean;
}

// ============================================================
// Phase 4 — AI Intelligence Types
// ============================================================

export interface AIQueryRequest {
  message: string;
  queryType?: string;
  context?: {
    portfolio?: string;
  };
}

export interface AIQueryResponse {
  response: string;
  citations: string[];
  queryType: string;
  model: string;
  usage: {
    queriesUsed: number;
    queriesLimit: number;
    queriesRemaining: number;
    tokensUsed: number;
  };
  meta?: {
    hint?: string;
  };
}

export interface AIUsageResponse {
  tier: string;
  model: string;
  features: string[];
  usage: {
    queriesUsed: number;
    queriesLimit: number;
    queriesRemaining: number;
    totalTokensToday: number;
  };
  statusMessage: string;
  recentQueries: {
    id: string;
    query_type: string;
    user_message: string;
    created_at: string;
  }[];
}
