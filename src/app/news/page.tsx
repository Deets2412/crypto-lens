'use client';

import { useState, useMemo } from 'react';
import { useAppData } from '@/components/AppShell';
import { scoreSentiment } from '@/lib/scoring';
import { timeAgo } from '@/lib/api';
import { Newspaper, TrendingUp, TrendingDown, Minus, Search } from 'lucide-react';
import { Sentiment } from '@/lib/types';

export default function NewsPage() {
    const { news, loading } = useAppData();
    const [sentimentFilter, setSentimentFilter] = useState<Sentiment | 'All'>('All');
    const [searchQuery, setSearchQuery] = useState('');

    const scoredNews = useMemo(() => news.map(scoreSentiment), [news]);

    const filteredNews = useMemo(() => {
        return scoredNews.filter((article) => {
            if (sentimentFilter !== 'All' && article.sentiment !== sentimentFilter) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                return (
                    article.title.toLowerCase().includes(q) ||
                    article.body.toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [scoredNews, sentimentFilter, searchQuery]);

    const bullishCount = scoredNews.filter((n) => n.sentiment === 'Bullish').length;
    const bearishCount = scoredNews.filter((n) => n.sentiment === 'Bearish').length;
    const neutralCount = scoredNews.filter((n) => n.sentiment === 'Neutral').length;

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <p className="loading-text">Loading news...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header animate-fade-in-up">
                <h1 className="page-title">News &amp; Signals</h1>
                <p className="page-subtitle">
                    Overnight crypto news aggregated and scored for investment signals.
                    Each article is analyzed for bullish and bearish keywords.
                </p>
            </div>

            {/* Signal Summary */}
            <div className="signal-summary stagger">
                <div className="signal-item animate-fade-in-up">
                    <TrendingUp size={24} style={{ color: 'var(--green)' }} />
                    <div>
                        <div className="signal-count positive">{bullishCount}</div>
                        <div className="signal-label">Bullish Signals</div>
                    </div>
                </div>
                <div className="signal-item animate-fade-in-up">
                    <TrendingDown size={24} style={{ color: 'var(--red)' }} />
                    <div>
                        <div className="signal-count negative">{bearishCount}</div>
                        <div className="signal-label">Bearish Signals</div>
                    </div>
                </div>
                <div className="signal-item animate-fade-in-up">
                    <Minus size={24} style={{ color: 'var(--text-muted)' }} />
                    <div>
                        <div className="signal-count" style={{ color: 'var(--text-secondary)' }}>
                            {neutralCount}
                        </div>
                        <div className="signal-label">Neutral</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="filter-bar">
                <div style={{ position: 'relative' }}>
                    <Search
                        size={16}
                        style={{
                            position: 'absolute',
                            left: 12,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-muted)',
                        }}
                    />
                    <input
                        type="text"
                        className="filter-input"
                        placeholder="Search headlines..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ paddingLeft: 36, minWidth: 250 }}
                    />
                </div>
                <select
                    className="filter-select"
                    value={sentimentFilter}
                    onChange={(e) => setSentimentFilter(e.target.value as Sentiment | 'All')}
                >
                    <option value="All">All Sentiment</option>
                    <option value="Bullish">Bullish Only</option>
                    <option value="Bearish">Bearish Only</option>
                    <option value="Neutral">Neutral Only</option>
                </select>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {filteredNews.length} articles
                </span>
            </div>

            {/* News Grid */}
            <div className="news-grid">
                {filteredNews.map((article, index) => (
                    <a
                        key={article.id}
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="news-card animate-fade-in-up"
                        style={{ animationDelay: `${Math.min(index * 50, 500)}ms`, textDecoration: 'none' }}
                    >
                        {article.imageurl && (
                            <img
                                src={article.imageurl}
                                alt=""
                                className="news-card-image"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        )}
                        <div className="news-card-body">
                            <div className="news-card-meta">
                                <span>{article.source}</span>
                                <span>{timeAgo(article.published_on)}</span>
                            </div>
                            <h3 className="news-card-title">{article.title}</h3>
                            <p className="news-card-excerpt">
                                {article.body.slice(0, 160)}...
                            </p>
                            <div className="news-card-footer">
                                <span
                                    className={`badge badge-${article.sentiment.toLowerCase()}`}
                                >
                                    {article.sentiment === 'Bullish' && <TrendingUp size={12} />}
                                    {article.sentiment === 'Bearish' && <TrendingDown size={12} />}
                                    {article.sentiment}
                                    {article.sentimentScore !== 0 &&
                                        ` (${article.sentimentScore > 0 ? '+' : ''}${article.sentimentScore})`}
                                </span>
                                {article.mentionedCoins.length > 0 && (
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        {article.mentionedCoins.slice(0, 3).map((coin) => (
                                            <span
                                                key={coin}
                                                style={{
                                                    fontSize: 10,
                                                    padding: '2px 6px',
                                                    borderRadius: 4,
                                                    background: 'var(--bg-elevated)',
                                                    color: 'var(--text-muted)',
                                                    textTransform: 'uppercase',
                                                }}
                                            >
                                                {coin}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </a>
                ))}
            </div>

            {filteredNews.length === 0 && (
                <div
                    style={{
                        textAlign: 'center',
                        padding: 60,
                        color: 'var(--text-muted)',
                    }}
                >
                    <Newspaper size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                    <p>No articles match your filters.</p>
                </div>
            )}
        </div>
    );
}
