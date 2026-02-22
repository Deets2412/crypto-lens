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
