'use client';

import { useState, useMemo } from 'react';
import { useAppData } from '@/components/AppShell';
import ConfidenceGauge from '@/components/ConfidenceGauge';
import SparklineChart from '@/components/SparklineChart';
import ToggleGroup from '@/components/ToggleGroup';
import CoinDetailModal from '@/components/CoinDetailModal';
import { LeadCaptureBanner } from '@/components/LeadCaptureModal';
import { formatCurrency, formatPercentage, timeAgo } from '@/lib/api';
import { generateRecommendations, scoreSentiment, categorizeCoin } from '@/lib/scoring';
import { Coin } from '@/lib/types';
import {
  TrendingUp,
  TrendingDown,
  Newspaper,
  Shield,
  Activity,
  Flame,
  Eye,
} from 'lucide-react';

export default function DashboardPage() {
  const { coins, news, loading } = useAppData();
  const [topCount, setTopCount] = useState(10);
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);

  const blueChipRecs = useMemo(
    () => generateRecommendations(coins, news, 'blue-chip').slice(0, topCount),
    [coins, news, topCount]
  );

  const casinoHighlights = useMemo(
    () => generateRecommendations(coins, news, 'casino').slice(0, 5),
    [coins, news]
  );

  const scoredNews = useMemo(
    () => news.slice(0, 5).map(scoreSentiment),
    [news]
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p className="loading-text">Loading market intelligence...</p>
      </div>
    );
  }

  const totalMarketCap = coins.reduce((sum, c) => sum + (c.market_cap || 0), 0);
  const totalVolume = coins.reduce((sum, c) => sum + (c.total_volume || 0), 0);
  const btc = coins.find((c) => c.symbol === 'btc');
  const btcDominance = btc ? ((btc.market_cap / totalMarketCap) * 100).toFixed(1) : 'N/A';

  const topGainers = [...coins]
    .sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0))
    .slice(0, 5);

  return (
    <div>
      <div className="page-header animate-fade-in-up">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Your overnight crypto intelligence briefing. We did the doomscrolling
          so you didn&apos;t have to. You&apos;re welcome. Now stop checking your portfolio
          and actually read this.
        </p>
      </div>

      {/* Market Stats */}
      <div className="stats-grid stagger">
        <div className="stat-card animate-fade-in-up">
          <div className="stat-label">Total Market Cap</div>
          <div className="stat-value">{formatCurrency(totalMarketCap)}</div>
        </div>
        <div className="stat-card animate-fade-in-up">
          <div className="stat-label">24h Volume</div>
          <div className="stat-value">{formatCurrency(totalVolume)}</div>
        </div>
        <div className="stat-card animate-fade-in-up">
          <div className="stat-label">BTC Dominance</div>
          <div className="stat-value">{btcDominance}%</div>
        </div>
        <div className="stat-card animate-fade-in-up">
          <div className="stat-label">Active Coins</div>
          <div className="stat-value">{coins.length}</div>
        </div>
      </div>

      {/* Blue Chips Section */}
      <div className="section-header-row">
        <h2 className="section-title">
          <Shield size={20} className="icon" />
          Blue Chips
        </h2>
        <ToggleGroup
          options={[10, 20, 30, 50]}
          value={topCount}
          onChange={setTopCount}
        />
      </div>
      <div className="rec-cards stagger">
        {blueChipRecs.slice(0, Math.min(topCount, 6)).map((rec, index) => (
          <div
            key={rec.coin.id}
            className="rec-card animate-fade-in-up"
            onClick={() => setSelectedCoin(rec.coin)}
            style={{ cursor: 'pointer' }}
          >
            <div className="rank-badge">#{index + 1}</div>
            <div className="rec-card-header">
              <div className="rec-coin">
                <img src={rec.coin.image} alt={rec.coin.name} />
                <div>
                  <div className="rec-coin-name">{rec.coin.name}</div>
                  <div className="rec-coin-symbol">{rec.coin.symbol}</div>
                  <div className="rec-coin-price">
                    {formatCurrency(rec.coin.current_price)}
                  </div>
                </div>
              </div>
              <ConfidenceGauge value={rec.confidenceScore} size={80} />
            </div>
            <div className="rec-reasoning">
              <h4>Key Signals</h4>
              {rec.reasoning.slice(0, 3).map((reason, i) => (
                <div key={i} className="rec-reason-item">
                  <span className="rec-reason-bullet">→</span>
                  <span>{reason}</span>
                </div>
              ))}
            </div>
            <div className="rec-footer">
              <span className={`badge badge-${rec.riskRating.toLowerCase()}`}>
                {rec.riskRating} Risk
              </span>
              <span
                className={`ticker-change ${rec.coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'
                  }`}
              >
                {formatPercentage(rec.coin.price_change_percentage_24h)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* If more than 6, show rest as compact list */}
      {blueChipRecs.length > 6 && (
        <div className="compact-recs" style={{ marginBottom: 32 }}>
          {blueChipRecs.slice(6).map((rec, index) => (
            <div
              key={rec.coin.id}
              className="mini-chart-card"
              onClick={() => setSelectedCoin(rec.coin)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 24, fontWeight: 700 }}>
                  #{index + 7}
                </span>
                <img src={rec.coin.image} alt={rec.coin.name} className="coin-icon" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                    {rec.coin.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {rec.coin.symbol}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600 }}>
                  {formatCurrency(rec.coin.current_price)}
                </span>
                <span
                  className={`ticker-change ${rec.coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'
                    }`}
                  style={{ fontSize: 12 }}
                >
                  {formatPercentage(rec.coin.price_change_percentage_24h)}
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    fontWeight: 700,
                    color: rec.confidenceScore >= 60 ? 'var(--green)' : 'var(--text-muted)',
                  }}
                >
                  {rec.confidenceScore}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Two Column: Gainers + News */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <h2 className="section-title">
            <TrendingUp size={20} className="icon" />
            Top Gainers (24h)
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {topGainers.map((coin) => (
              <div
                key={coin.id}
                className="mini-chart-card"
                onClick={() => setSelectedCoin(coin)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={coin.image} alt={coin.name} className="coin-icon" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                      {coin.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {coin.symbol}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600 }}>
                    {formatCurrency(coin.current_price)}
                  </div>
                  <div
                    className={`ticker-change ${(coin.price_change_percentage_24h || 0) >= 0 ? 'positive' : 'negative'
                      }`}
                    style={{ fontSize: 12 }}
                  >
                    {formatPercentage(coin.price_change_percentage_24h)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="section-title">
            <Newspaper size={20} className="icon" />
            Latest Headlines
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {scoredNews.map((article) => (
              <a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card"
                style={{
                  padding: 16,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                      lineHeight: 1.4,
                      color: 'var(--text-primary)',
                      marginBottom: 6,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {article.title}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 11,
                      color: 'var(--text-muted)',
                    }}
                  >
                    <span>{article.source}</span>
                    <span>•</span>
                    <span>{timeAgo(article.published_on)}</span>
                  </div>
                </div>
                <span className={`badge badge-${article.sentiment.toLowerCase()}`}>
                  {article.sentiment}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Casino Preview */}
      <div style={{ marginTop: 32 }}>
        <h2 className="section-title">
          <Flame size={20} style={{ color: 'var(--neon-magenta, #f43f5e)' }} />
          Casino Hot Picks
        </h2>
        <div className="casino-preview-grid">
          {casinoHighlights.slice(0, 3).map((rec) => (
            <div
              key={rec.coin.id}
              className="casino-card-mini"
              onClick={() => setSelectedCoin(rec.coin)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src={rec.coin.image} alt={rec.coin.name} className="coin-icon" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{rec.coin.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {rec.coin.symbol}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                  {formatCurrency(rec.coin.current_price)}
                </span>
                <span
                  className={`ticker-change ${rec.coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'
                    }`}
                >
                  {formatPercentage(rec.coin.price_change_percentage_24h)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7-Day Trends */}
      <h2 className="section-title" style={{ marginTop: 32 }}>
        <Activity size={20} className="icon" />
        7-Day Trends
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
        }}
      >
        {coins.slice(0, 8).map((coin) => (
          <div
            key={coin.id}
            className="mini-chart-card"
            onClick={() => setSelectedCoin(coin)}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src={coin.image} alt={coin.name} className="coin-icon" />
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{coin.symbol.toUpperCase()}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {formatCurrency(coin.current_price)}
                </div>
              </div>
            </div>
            <SparklineChart data={coin.sparkline_in_7d?.price || []} height={36} />
          </div>
        ))}
      </div>

      {/* Lead Capture */}
      <div style={{ marginTop: 32 }}>
        <LeadCaptureBanner />
      </div>

      <div className="disclaimer" style={{ marginTop: 32 }}>
        ⚠️ This is not financial advice. CryptoLens provides data-driven signals
        for educational purposes only. Always do your own research before
        investing.
      </div>

      {/* Coin Detail Modal */}
      <CoinDetailModal coin={selectedCoin} onClose={() => setSelectedCoin(null)} />
    </div>
  );
}
