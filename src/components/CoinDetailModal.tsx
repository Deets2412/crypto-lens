'use client';

import { X, ExternalLink } from 'lucide-react';
import { Coin, CoinCategory } from '@/lib/types';
import { formatCurrency, formatPercentage } from '@/lib/api';
import { scoreScreenerRow } from '@/lib/scoring';
import { calculateBSMeter, generateRealTalk } from '@/lib/commentary';
import BSMeter from './BSMeter';
import RealTalkCard from './RealTalkCard';
import SparklineChart from './SparklineChart';

interface CoinDetailModalProps {
    coin: Coin | null;
    onClose: () => void;
}

export default function CoinDetailModal({ coin, onClose }: CoinDetailModalProps) {
    if (!coin) return null;

    const row = scoreScreenerRow(coin);
    const bsMeter = calculateBSMeter(
        coin, row.category, row.supplyRatio, row.volumeToMcap, row.athDistance
    );
    const realTalk = generateRealTalk(
        coin, row.category, row.supplyRatio, row.athDistance, row.volumeToMcap
    );

    const change24h = coin.price_change_percentage_24h || 0;
    const change7d = coin.price_change_percentage_7d_in_currency || 0;

    return (
        <div className="coin-modal-backdrop" onClick={onClose}>
            <div className="coin-modal" onClick={(e) => e.stopPropagation()}>
                <button className="coin-modal-close" onClick={onClose}>
                    <X size={24} />
                </button>

                {/* Header */}
                <div className="coin-modal-header">
                    <div className="coin-modal-identity">
                        <img src={coin.image} alt={coin.name} className="coin-modal-img" />
                        <div>
                            <h2 className="coin-modal-name">{coin.name}</h2>
                            <span className="coin-modal-symbol">{coin.symbol.toUpperCase()}</span>
                            <span className={`coin-modal-category coin-modal-category--${row.category}`}>
                                {row.category === 'blue-chip' ? '🏛️ Blue Chip' : '🎰 Casino'}
                            </span>
                        </div>
                    </div>
                    <div className="coin-modal-price-block">
                        <div className="coin-modal-price">
                            {formatCurrency(coin.current_price)}
                        </div>
                        <span className={change24h >= 0 ? 'positive' : 'negative'}>
                            {formatPercentage(change24h)}
                        </span>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="coin-modal-stats">
                    <div className="coin-modal-stat">
                        <span className="coin-modal-stat-label">Market Cap</span>
                        <span className="coin-modal-stat-value">{formatCurrency(coin.market_cap)}</span>
                    </div>
                    <div className="coin-modal-stat">
                        <span className="coin-modal-stat-label">24h Volume</span>
                        <span className="coin-modal-stat-value">{formatCurrency(coin.total_volume)}</span>
                    </div>
                    <div className="coin-modal-stat">
                        <span className="coin-modal-stat-label">Rank</span>
                        <span className="coin-modal-stat-value">#{coin.market_cap_rank}</span>
                    </div>
                    <div className="coin-modal-stat">
                        <span className="coin-modal-stat-label">7d Change</span>
                        <span className={`coin-modal-stat-value ${change7d >= 0 ? 'positive' : 'negative'}`}>
                            {formatPercentage(change7d)}
                        </span>
                    </div>
                    <div className="coin-modal-stat">
                        <span className="coin-modal-stat-label">ATH Distance</span>
                        <span className="coin-modal-stat-value negative">
                            {row.athDistance.toFixed(1)}%
                        </span>
                    </div>
                    <div className="coin-modal-stat">
                        <span className="coin-modal-stat-label">Composite</span>
                        <span className="coin-modal-stat-value">{row.compositeScore}/100</span>
                    </div>
                </div>

                {/* Sparkline */}
                {coin.sparkline_in_7d?.price && (
                    <div className="coin-modal-chart">
                        <h3 className="coin-modal-section-title">7-Day Price Action</h3>
                        <SparklineChart data={coin.sparkline_in_7d.price} height={80} />
                    </div>
                )}

                {/* BS Meter */}
                <div className="coin-modal-bs-section">
                    <h3 className="coin-modal-section-title">
                        {bsMeter.variant === 'fluff' ? '🏛️ The BS Meter' : '💀 The BS Meter'}
                    </h3>
                    <div className="coin-modal-bs-content">
                        <BSMeter
                            score={bsMeter.score}
                            label={bsMeter.label}
                            variant={bsMeter.variant}
                            size={160}
                        />
                        <div className="coin-modal-bs-factors">
                            {bsMeter.factors.map((f, i) => (
                                <div key={i} className="coin-modal-bs-factor">
                                    <span className="rec-reason-bullet">→</span>
                                    <span>{f}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Real Talk */}
                <div className="coin-modal-realtalk-section">
                    <h3 className="coin-modal-section-title">The De-Coder</h3>
                    <RealTalkCard data={realTalk} category={row.category} coinName={coin.name} />
                </div>
            </div>
        </div>
    );
}
