// ============================================================
// CryptoLens — API Layer (Free APIs, no keys required)
// ============================================================

import { Coin, NewsArticle } from './types';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const CRYPTOCOMPARE_BASE = 'https://min-api.cryptocompare.com/data';

// ---------- CoinGecko ----------

export async function fetchTopCoins(count: number = 100): Promise<Coin[]> {
    try {
        const res = await fetch(
            `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${count}&page=1&sparkline=true&price_change_percentage=7d,30d`,
            { next: { revalidate: 300 } } // cache for 5 min
        );
        if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);
        return res.json();
    } catch (err) {
        console.error('fetchTopCoins failed:', err);
        return [];
    }
}

export async function fetchGlobalData(): Promise<{
    total_market_cap: { usd: number };
    total_volume: { usd: number };
    market_cap_percentage: { btc: number };
    active_cryptocurrencies: number;
} | null> {
    try {
        const res = await fetch(`${COINGECKO_BASE}/global`, {
            next: { revalidate: 300 },
        });
        if (!res.ok) throw new Error(`CoinGecko global error: ${res.status}`);
        const data = await res.json();
        return data.data;
    } catch (err) {
        console.error('fetchGlobalData failed:', err);
        return null;
    }
}

// ---------- CryptoCompare News ----------

export async function fetchNews(limit: number = 50): Promise<NewsArticle[]> {
    try {
        const res = await fetch(
            `${CRYPTOCOMPARE_BASE}/v2/news/?lang=EN&sortOrder=latest`,
            { next: { revalidate: 600 } } // cache 10 min
        );
        if (!res.ok) throw new Error(`CryptoCompare error: ${res.status}`);
        const data = await res.json();
        const articles: NewsArticle[] = (data.Data || []).slice(0, limit).map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (item: any) => ({
                id: String(item.id),
                title: item.title || '',
                body: item.body || '',
                url: item.url || '',
                imageurl: item.imageurl || '',
                source: item.source_info?.name || item.source || 'Unknown',
                published_on: item.published_on || 0,
                categories: item.categories || '',
                tags: item.tags || '',
            })
        );
        return articles;
    } catch (err) {
        console.error('fetchNews failed:', err);
        return [];
    }
}

// ---------- Formatting helpers ----------

export function formatCurrency(value: number): string {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    if (value >= 1) return `$${value.toFixed(2)}`;
    return `$${value.toFixed(6)}`;
}

export function formatPercentage(value: number | undefined | null): string {
    if (value === undefined || value === null) return 'N/A';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
}

export function formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(Math.round(value));
}

export function timeAgo(timestamp: number): string {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}
