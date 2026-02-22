'use client';

import { useState, useMemo } from 'react';
import { useAppData } from '@/components/AppShell';
import ConfidenceGauge from '@/components/ConfidenceGauge';
import BSMeter from '@/components/BSMeter';
import CoinDetailModal from '@/components/CoinDetailModal';
import { formatCurrency, formatPercentage } from '@/lib/api';
import { generateRecommendations, scoreScreenerRow } from '@/lib/scoring';
import { calculateBSMeter } from '@/lib/commentary';
import { Coin } from '@/lib/types';
import {
    Shield,
    TrendingUp,
    Zap,
    AlertTriangle,
    BarChart3,
    Eye,
} from 'lucide-react';

export default function BlueChipsPage() {
    const { coins, news, loading } = useAppData();
    const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);

    const recommendations = useMemo(
        () => generateRecommendations(coins, news, 'blue-chip'),
        [coins, news]
    );

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <p className="loading-text">Analyzing blue chip fundamentals...</p>
            </div>
        );
    }

    const getRiskIcon = (risk: string) => {
        switch (risk) {
            case 'Low': return <Shield size={16} />;
            case 'Medium': return <Zap size={16} />;
            case 'High': return <AlertTriangle size={16} />;
            default: return null;
        }
    };

    const getRankGradient = (index: number) => {
        switch (index) {
            case 0: return 'linear-gradient(135deg, #ffd700, #ffaa00)';
            case 1: return 'linear-gradient(135deg, #c0c0c0, #a0a0a0)';
            case 2: return 'linear-gradient(135deg, #cd7f32, #b87333)';
            default: return 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))';
        }
    };

    return (
        <div>
            <div className="page-header animate-fade-in-up">
                <h1 className="page-title">Blue Chips</h1>
                <p className="page-subtitle">
                    The &quot;responsible&quot; picks. The ones you tell people about at dinner parties.
                    These are the crypto assets that won&apos;t make your accountant weep into their
                    spreadsheets. Probably. We make no promises. But statistically speaking,
                    these are the least likely to become a cautionary tale on a podcast. 📊
                </p>
            </div>

            {/* Recommendation Cards */}
            <div className="rec-cards stagger">
                {recommendations.map((rec, index) => {
                    const row = scoreScreenerRow(rec.coin);
                    const bsMeter = calculateBSMeter(
                        rec.coin, 'blue-chip', row.supplyRatio, row.volumeToMcap, row.athDistance
                    );

                    return (
                        <div
                            key={rec.coin.id}
                            className="rec-card animate-fade-in-up"
                            style={{ animationDelay: `${index * 100}ms`, cursor: 'pointer' }}
                            onClick={() => setSelectedCoin(rec.coin)}
                        >
                            <div
                                className="rank-badge"
                                style={{
                                    background: getRankGradient(index),
                                    width: 40,
                                    height: 40,
                                    fontSize: 16,
                                }}
                            >
                                #{index + 1}
                            </div>

                            <div className="rec-card-header">
                                <div className="rec-coin">
                                    <img src={rec.coin.image} alt={rec.coin.name} />
                                    <div>
                                        <div className="rec-coin-name">{rec.coin.name}</div>
                                        <div className="rec-coin-symbol">{rec.coin.symbol}</div>
                                        <div className="rec-coin-price">
                                            {formatCurrency(rec.coin.current_price)}
                                            <span
                                                className={
                                                    (rec.coin.price_change_percentage_24h || 0) >= 0
                                                        ? 'positive' : 'negative'
                                                }
                                                style={{ marginLeft: 8, fontSize: 12 }}
                                            >
                                                {formatPercentage(rec.coin.price_change_percentage_24h)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <ConfidenceGauge value={rec.confidenceScore} size={100} />
                            </div>

                            {/* Mini BS Meter */}
                            <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                                <BSMeter
                                    score={bsMeter.score}
                                    label={bsMeter.label}
                                    variant="fluff"
                                    size={110}
                                />
                            </div>

                            {/* Stats */}
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: 8,
                                    margin: '12px 0',
                                }}
                            >
                                <div className="coin-modal-stat">
                                    <span className="coin-modal-stat-label">Market Cap</span>
                                    <span className="coin-modal-stat-value" style={{ fontSize: 12 }}>
                                        {formatCurrency(rec.coin.market_cap)}
                                    </span>
                                </div>
                                <div className="coin-modal-stat">
                                    <span className="coin-modal-stat-label">24h Vol</span>
                                    <span className="coin-modal-stat-value" style={{ fontSize: 12 }}>
                                        {formatCurrency(rec.coin.total_volume)}
                                    </span>
                                </div>
                                <div className="coin-modal-stat">
                                    <span className="coin-modal-stat-label">Rank</span>
                                    <span className="coin-modal-stat-value" style={{ fontSize: 12 }}>
                                        #{rec.coin.market_cap_rank}
                                    </span>
                                </div>
                            </div>

                            {/* Reasoning */}
                            <div className="rec-reasoning">
                                <h4>
                                    <BarChart3 size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                                    Analysis
                                </h4>
                                {rec.reasoning.slice(0, 3).map((reason, i) => (
                                    <div key={i} className="rec-reason-item">
                                        <span className="rec-reason-bullet">→</span>
                                        <span>{reason}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="rec-footer">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span
                                        className={`badge badge-${rec.riskRating.toLowerCase()}`}
                                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                                    >
                                        {getRiskIcon(rec.riskRating)}
                                        {rec.riskRating} Risk
                                    </span>
                                    {rec.newsSignals > 0 && (
                                        <span className="badge badge-bullish">
                                            <TrendingUp size={12} />
                                            {rec.newsSignals} signal{rec.newsSignals > 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                                <span className="detail-link">
                                    <Eye size={14} /> Details
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {recommendations.length === 0 && (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                    <Shield size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                    <p>No blue chip coins found matching the criteria.</p>
                </div>
            )}

            {/* Methodology */}
            <div className="methodology">
                <h3>🏛️ What Makes a &quot;Blue Chip&quot;?</h3>
                <p>
                    We classify a coin as a Blue Chip if it ranks in the top 30 by market cap
                    and has relatively low daily volatility (&lt;12% 24h swing). These are the
                    assets that probably won&apos;t make you a millionaire overnight — but they
                    also probably won&apos;t disappear while you sleep.
                </p>
                <ul>
                    <li><strong>Fundamental Score (40%)</strong> — Market cap rank, volume-to-market-cap ratio, supply scarcity</li>
                    <li><strong>Technical Score (60%)</strong> — 24h &amp; 7d price momentum, distance from all-time high</li>
                    <li><strong>News Sentiment Boost</strong> — ±5 per bullish/bearish signal detected</li>
                </ul>
                <p style={{ marginTop: 12 }}>
                    The BS Meter measures &quot;Corporate Fluff&quot; — how much marketing nonsense
                    surrounds this coin relative to its actual trading behavior.
                </p>
            </div>

            <div className="disclaimer">
                ⚠️ <strong>Disclaimer:</strong> These are algorithmically generated classifications,
                not investment advice. &quot;Blue Chip&quot; means relatively less risky in the crypto space,
                which still means &quot;might drop 30% on a Tuesday.&quot; DYOR.
            </div>

            <CoinDetailModal coin={selectedCoin} onClose={() => setSelectedCoin(null)} />
        </div>
    );
}
