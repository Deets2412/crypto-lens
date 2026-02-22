'use client';

import { useState, useMemo } from 'react';
import { useAppData } from '@/components/AppShell';
import ConfidenceGauge from '@/components/ConfidenceGauge';
import BSMeter from '@/components/BSMeter';
import SparklineChart from '@/components/SparklineChart';
import CoinDetailModal from '@/components/CoinDetailModal';
import { BlurOverlay } from '@/components/TierBadge';
import { formatCurrency, formatPercentage } from '@/lib/api';
import { generateRecommendations, scoreScreenerRow } from '@/lib/scoring';
import { calculateBSMeter } from '@/lib/commentary';
import { Coin } from '@/lib/types';
import {
    Flame,
    TrendingUp,
    TrendingDown,
    Skull,
    Eye,
    AlertTriangle,
} from 'lucide-react';

export default function CasinoPage() {
    const { coins, news, loading } = useAppData();
    const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);

    const casinoRecs = useMemo(
        () => generateRecommendations(coins, news, 'casino'),
        [coins, news]
    );

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <p className="loading-text">Warming up the slot machines...</p>
            </div>
        );
    }

    return (
        <BlurOverlay requiredTier="night_owl" featureName="The Casino">
            <div className="casino-page">
                <div className="page-header animate-fade-in-up">
                    <h1 className="page-title casino-title">
                        <Flame size={28} className="casino-flame" />
                        The Casino
                    </h1>
                    <p className="page-subtitle">
                        You know what this is. You know why you&apos;re here. These are the coins
                        that could 10x by Tuesday or go to zero by Wednesday. Your rational brain
                        is screaming &quot;no&quot; but your degen brain already has the buy button open
                        in another tab. We&apos;re just here to give you slightly better odds than
                        a literal slot machine. Slightly. 🎲
                    </p>
                </div>

                {/* Risk Warning */}
                <div className="casino-warning animate-fade-in-up">
                    <AlertTriangle size={20} />
                    <span>
                        <strong>High-Risk Zone.</strong> The coins below are scored the same way
                        as Blue Chips, but their rank, volatility, and market profile put them firmly
                        in &quot;speculation territory.&quot; The BS Meter here measures Wipeout Risk, not
                        corporate fluff.
                    </span>
                </div>

                {/* Casino Cards Grid */}
                <div className="casino-grid">
                    {casinoRecs.map((rec, index) => {
                        const row = scoreScreenerRow(rec.coin);
                        const bsMeter = calculateBSMeter(
                            rec.coin, 'casino', row.supplyRatio, row.volumeToMcap, row.athDistance
                        );
                        const change24h = rec.coin.price_change_percentage_24h || 0;

                        return (
                            <div
                                key={rec.coin.id}
                                className="casino-card animate-fade-in-up"
                                style={{ animationDelay: `${Math.min(index * 80, 600)}ms`, cursor: 'pointer' }}
                                onClick={() => setSelectedCoin(rec.coin)}
                            >
                                {/* Glow Top Bar */}
                                <div className="casino-card-glow" />

                                <div className="casino-card-header">
                                    <div className="rec-coin">
                                        <img src={rec.coin.image} alt={rec.coin.name} />
                                        <div>
                                            <div className="rec-coin-name">{rec.coin.name}</div>
                                            <div className="rec-coin-symbol">{rec.coin.symbol}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{
                                            fontFamily: "'JetBrains Mono', monospace",
                                            fontSize: 16,
                                            fontWeight: 700,
                                        }}>
                                            {formatCurrency(rec.coin.current_price)}
                                        </div>
                                        <div className={change24h >= 0 ? 'positive' : 'negative'}
                                            style={{ fontSize: 13, fontWeight: 600 }}>
                                            {change24h >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                            {' '}{formatPercentage(change24h)}
                                        </div>
                                    </div>
                                </div>

                                {/* Sparkline */}
                                <div style={{ margin: '12px 0' }}>
                                    <SparklineChart
                                        data={rec.coin.sparkline_in_7d?.price || []}
                                        height={48}
                                    />
                                </div>

                                {/* Mini Stats */}
                                <div className="casino-card-stats">
                                    <div>
                                        <span className="casino-stat-label">Rank</span>
                                        <span className="casino-stat-value">#{rec.coin.market_cap_rank}</span>
                                    </div>
                                    <div>
                                        <span className="casino-stat-label">Score</span>
                                        <span className="casino-stat-value" style={{
                                            color: rec.confidenceScore >= 60 ? 'var(--green)' :
                                                rec.confidenceScore >= 40 ? 'var(--yellow)' : 'var(--red)'
                                        }}>
                                            {rec.confidenceScore}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="casino-stat-label">Risk</span>
                                        <span className={`casino-stat-value ${rec.riskRating === 'High' ? 'negative' : ''}`}>
                                            {rec.riskRating}
                                        </span>
                                    </div>
                                </div>

                                {/* BS Meter - Wipeout Risk */}
                                <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                                    <BSMeter
                                        score={bsMeter.score}
                                        label={bsMeter.label}
                                        variant="wipeout"
                                        size={120}
                                    />
                                </div>

                                {/* Key Signal */}
                                {rec.reasoning[0] && (
                                    <div className="casino-card-signal">
                                        <span className="rec-reason-bullet">→</span>
                                        <span>{rec.reasoning[0]}</span>
                                    </div>
                                )}

                                <div className="casino-card-footer">
                                    <span className="detail-link">
                                        <Eye size={14} /> Deep Dive
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {casinoRecs.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                        <Skull size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                        <p>No casino-grade coins found. The market must be unusually stable.</p>
                    </div>
                )}

                {/* Methodology */}
                <div className="methodology" style={{ marginTop: 32 }}>
                    <h3>🎰 What Lands in The Casino?</h3>
                    <p>
                        Any coin ranked below #30 by market cap, or any top-30 coin swinging
                        more than 12% in a day. These are the assets where technical analysis
                        meets prayer.
                    </p>
                    <ul>
                        <li><strong>Same scoring engine</strong> as Blue Chips — no special treatment here</li>
                        <li><strong>Wipeout Risk</strong> replaces Corporate Fluff on the BS Meter — measures volatility, liquidity risk, and supply unlock danger</li>
                        <li><strong>Higher risk ≠ bad.</strong> Some of the best returns come from here. So do the worst losses.</li>
                    </ul>
                </div>

                <div className="disclaimer">
                    ⚠️ <strong>Seriously though:</strong> This is not financial advice. These are
                    speculative assets with real risk of significant loss. Never invest more than
                    you can afford to lose. The house always wins — except when it doesn&apos;t.
                </div>

                <CoinDetailModal coin={selectedCoin} onClose={() => setSelectedCoin(null)} />
            </div>
        </BlurOverlay>
    );
}
