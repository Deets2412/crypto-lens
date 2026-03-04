'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppData } from '@/components/AppShell';
import { useAuth } from '@/lib/auth';
import { BlurOverlay } from '@/components/TierBadge';
import { analyzePortfolio, getPortfolioBSLabel, getDiversificationEmoji } from '@/lib/portfolio';
import { formatCurrency, formatPercentage } from '@/lib/api';
import {
  Crosshair,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Shield,
  Flame,
  Search,
  X,
  ChevronDown,
} from 'lucide-react';
import type { PortfolioHolding, PortfolioPosition, Coin } from '@/lib/types';

// ==================== ADD HOLDING MODAL ====================

interface AddHoldingModalProps {
  coins: Coin[];
  onAdd: (holding: { coinId: string; symbol: string; name: string; amount: number; buyPrice: number }) => void;
  onClose: () => void;
}

function AddHoldingModal({ coins, onAdd, onClose }: AddHoldingModalProps) {
  const [search, setSearch] = useState('');
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [amount, setAmount] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredCoins = useMemo(() => {
    if (!search) return coins.slice(0, 20);
    const q = search.toLowerCase();
    return coins.filter(
      (c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [coins, search]);

  const handleSelectCoin = (coin: Coin) => {
    setSelectedCoin(coin);
    setSearch(coin.name);
    setBuyPrice(coin.current_price.toString());
    setShowDropdown(false);
  };

  const handleSubmit = () => {
    if (!selectedCoin || !amount || parseFloat(amount) <= 0) return;
    onAdd({
      coinId: selectedCoin.id,
      symbol: selectedCoin.symbol,
      name: selectedCoin.name,
      amount: parseFloat(amount),
      buyPrice: parseFloat(buyPrice) || selectedCoin.current_price,
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 20, color: 'var(--text-primary)' }}>Add Holding</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Coin Search */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>Coin</label>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="filter-input"
              placeholder="Search coins..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); setSelectedCoin(null); }}
              onFocus={() => setShowDropdown(true)}
              style={{ paddingLeft: 36, width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          {showDropdown && filteredCoins.length > 0 && (
            <div style={{
              position: 'absolute', zIndex: 50, width: '100%', maxHeight: 240, overflowY: 'auto',
              background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 8, marginTop: 4,
            }}>
              {filteredCoins.map((coin) => (
                <button
                  key={coin.id}
                  onClick={() => handleSelectCoin(coin)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px',
                    background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer', textAlign: 'left', color: 'var(--text-primary)',
                  }}
                >
                  <img src={coin.image} alt="" width={24} height={24} style={{ borderRadius: '50%' }} />
                  <span style={{ flex: 1 }}>
                    <span style={{ fontWeight: 500 }}>{coin.name}</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontSize: 12 }}>{coin.symbol.toUpperCase()}</span>
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{formatCurrency(coin.current_price)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Amount */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
            Amount {selectedCoin ? `(${selectedCoin.symbol.toUpperCase()})` : ''}
          </label>
          <input
            type="number"
            className="filter-input"
            placeholder="e.g. 0.5"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box' }}
            min="0"
            step="any"
          />
        </div>

        {/* Buy Price */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
            Average Buy Price (USD)
          </label>
          <input
            type="number"
            className="filter-input"
            placeholder={selectedCoin ? `Current: ${formatCurrency(selectedCoin.current_price)}` : 'e.g. 42000'}
            value={buyPrice}
            onChange={(e) => setBuyPrice(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box' }}
            min="0"
            step="any"
          />
          <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
            Leave blank to use current price
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!selectedCoin || !amount || parseFloat(amount) <= 0}
          style={{
            width: '100%', padding: '12px 0', border: 'none', borderRadius: 8,
            background: selectedCoin && amount ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'rgba(255,255,255,0.1)',
            color: '#fff', fontSize: 14, fontWeight: 600, cursor: selectedCoin && amount ? 'pointer' : 'not-allowed',
          }}
        >
          Add to Portfolio
        </button>
      </div>
    </div>
  );
}

// ==================== POSITION ROW ====================

function PositionRow({
  position,
  onDelete,
}: {
  position: PortfolioPosition;
  onDelete: (id: string) => void;
}) {
  const pnlColor = position.pnl >= 0 ? 'var(--green)' : 'var(--red)';
  const categoryIcon = position.category === 'blue-chip' ? <Shield size={14} /> : <Flame size={14} />;
  const categoryColor = position.category === 'blue-chip' ? 'var(--accent-blue)' : 'var(--orange)';

  return (
    <tr>
      <td>
        <div className="coin-cell">
          <div>
            <div className="coin-name">{position.name}</div>
            <div className="coin-symbol">{position.symbol.toUpperCase()}</div>
          </div>
        </div>
      </td>
      <td style={{ textAlign: 'right' }}>{position.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })}</td>
      <td style={{ textAlign: 'right' }}>{formatCurrency(position.currentPrice)}</td>
      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(position.currentValue)}</td>
      <td style={{ textAlign: 'right' }}>{position.allocation.toFixed(1)}%</td>
      <td style={{ textAlign: 'right' }}>{formatCurrency(position.buyPrice)}</td>
      <td style={{ textAlign: 'right', color: pnlColor, fontWeight: 600 }}>
        {position.pnl >= 0 ? '+' : ''}{formatCurrency(position.pnl)}
        <br />
        <span style={{ fontSize: 12 }}>{position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(1)}%</span>
      </td>
      <td style={{ textAlign: 'center' }}>
        <span style={{ color: categoryColor, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
          {categoryIcon} {position.category === 'blue-chip' ? 'Blue Chip' : 'Casino'}
        </span>
      </td>
      <td style={{ textAlign: 'center' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: '50%',
          background: position.compositeScore >= 60 ? 'rgba(34,197,94,0.1)' : position.compositeScore >= 40 ? 'rgba(96,165,250,0.1)' : 'rgba(239,68,68,0.1)',
          color: position.compositeScore >= 60 ? 'var(--green)' : position.compositeScore >= 40 ? 'var(--accent-blue)' : 'var(--red)',
          fontWeight: 700, fontSize: 12,
        }}>
          {position.compositeScore}
        </span>
      </td>
      <td style={{ textAlign: 'center' }}>
        <button
          onClick={() => onDelete(position.id)}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
          title="Remove holding"
        >
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  );
}

// ==================== MAIN PAGE ====================

export default function PortfolioPage() {
  const { coins, loading: dataLoading } = useAppData();
  const { user } = useAuth();
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch holdings from API
  const fetchHoldings = useCallback(async () => {
    try {
      const res = await fetch('/api/portfolio');
      if (res.ok) {
        const data = await res.json();
        setHoldings(
          (data.holdings || []).map((h: Record<string, unknown>) => ({
            id: h.id as string,
            userId: h.user_id as string,
            coinId: h.coin_id as string,
            symbol: h.symbol as string,
            name: h.name as string,
            amount: parseFloat(h.amount as string),
            buyPrice: parseFloat(h.buy_price as string),
            createdAt: h.created_at as string,
            updatedAt: h.updated_at as string,
          }))
        );
      }
    } catch (err) {
      console.error('Failed to fetch holdings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHoldings();
  }, [fetchHoldings]);

  const handleAdd = async (holding: { coinId: string; symbol: string; name: string; amount: number; buyPrice: number }) => {
    setSaving(true);
    try {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(holding),
      });
      if (res.ok) {
        setShowAddModal(false);
        await fetchHoldings();
      }
    } catch (err) {
      console.error('Failed to add holding:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/portfolio?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchHoldings();
      }
    } catch (err) {
      console.error('Failed to delete holding:', err);
    }
  };

  // Run the analysis
  const analysis = useMemo(() => {
    if (holdings.length === 0 || coins.length === 0) return null;
    return analyzePortfolio(holdings, coins);
  }, [holdings, coins]);

  if (dataLoading || loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p className="loading-text">Loading Portfolio X-Ray...</p>
      </div>
    );
  }

  return (
    <BlurOverlay requiredTier="coin_sense" featureName="Portfolio X-Ray">
      <div>
        <div className="page-header animate-fade-in-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Crosshair size={28} />
                Portfolio X-Ray
              </h1>
              <p className="page-subtitle">
                Your portfolio, analyzed with brutal honesty. Add your holdings and we&apos;ll tell you what
                your financial advisor won&apos;t.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', border: 'none',
                borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Plus size={18} />
              Add Holding
            </button>
          </div>
        </div>

        {holdings.length === 0 ? (
          <div className="animate-fade-in-up" style={{
            textAlign: 'center', padding: '80px 24px',
            background: 'var(--glass-bg)', borderRadius: 12, border: '1px solid var(--glass-border)',
          }}>
            <Crosshair size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
            <h2 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>No Holdings Yet</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto 24px' }}>
              Add your crypto holdings and we&apos;ll run a full X-Ray analysis. We promise to be
              &ldquo;constructively critical.&rdquo; Emphasis on the critical.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px',
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', border: 'none',
                borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Plus size={18} />
              Add Your First Holding
            </button>
          </div>
        ) : analysis ? (
          <>
            {/* Summary Cards */}
            <div className="stats-grid animate-fade-in-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              {/* Total Value */}
              <div className="stat-card">
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                  Total Value
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {formatCurrency(analysis.totalValue)}
                </div>
                <div style={{ fontSize: 14, color: analysis.totalPnl >= 0 ? 'var(--green)' : 'var(--red)', marginTop: 4 }}>
                  {analysis.totalPnl >= 0 ? <TrendingUp size={14} style={{ verticalAlign: 'middle' }} /> : <TrendingDown size={14} style={{ verticalAlign: 'middle' }} />}
                  {' '}{analysis.totalPnl >= 0 ? '+' : ''}{formatCurrency(analysis.totalPnl)} ({analysis.totalPnlPercent >= 0 ? '+' : ''}{analysis.totalPnlPercent.toFixed(1)}%)
                </div>
              </div>

              {/* Portfolio BS Score */}
              <div className="stat-card">
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                  Portfolio BS Score
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: analysis.portfolioBSScore > 60 ? 'var(--red)' : analysis.portfolioBSScore > 35 ? 'var(--yellow)' : 'var(--green)' }}>
                  {analysis.portfolioBSScore}/100
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {getPortfolioBSLabel(analysis.portfolioBSScore)}
                </div>
              </div>

              {/* Diversification Grade */}
              <div className="stat-card">
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                  Diversification
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {getDiversificationEmoji(analysis.diversificationGrade)} {analysis.diversificationGrade}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {analysis.positions.length} position{analysis.positions.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Composite Score */}
              <div className="stat-card">
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                  Weighted Score
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: analysis.portfolioCompositeScore >= 60 ? 'var(--green)' : analysis.portfolioCompositeScore >= 40 ? 'var(--accent-blue)' : 'var(--red)' }}>
                  {analysis.portfolioCompositeScore}/100
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Fund/Tech composite
                </div>
              </div>
            </div>

            {/* Overall Verdict */}
            <div className="animate-fade-in-up" style={{
              padding: '20px 24px', marginBottom: 24,
              background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(99,102,241,0.05))',
              borderRadius: 12, border: '1px solid rgba(139,92,246,0.2)',
            }}>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6 }}>
                {analysis.overallVerdict}
              </p>
            </div>

            {/* Risk Concentration */}
            <div className="animate-fade-in-up" style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24,
            }}>
              {/* Concentration */}
              <div className="stat-card">
                <h3 style={{ margin: '0 0 16px', fontSize: 15, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={16} /> Risk Concentration
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Largest Position</span>
                    <span style={{ color: analysis.riskConcentration.topHoldingPercent > 40 ? 'var(--red)' : 'var(--text-primary)', fontWeight: 600 }}>
                      {analysis.riskConcentration.topHoldingPercent.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Top 3 Positions</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      {analysis.riskConcentration.top3HoldingPercent.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Blue Chip Exposure</span>
                    <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>
                      {analysis.riskConcentration.blueChipPercent.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Casino Exposure</span>
                    <span style={{ color: 'var(--orange)', fontWeight: 600 }}>
                      {analysis.riskConcentration.casinoPercent.toFixed(1)}%
                    </span>
                  </div>
                  {analysis.riskConcentration.singlePointOfFailure && (
                    <div style={{
                      marginTop: 8, padding: '8px 12px', borderRadius: 8,
                      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                      fontSize: 12, color: 'var(--red)',
                    }}>
                      ⚠️ Single point of failure detected
                    </div>
                  )}
                </div>
                <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  {analysis.topRisk}
                </p>
              </div>

              {/* Rebalancing Suggestions */}
              <div className="stat-card">
                <h3 style={{ margin: '0 0 16px', fontSize: 15, color: 'var(--text-primary)' }}>
                  🔧 Rebalancing Suggestions
                </h3>
                {analysis.rebalancingSuggestions.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    No immediate rebalancing needed. Either your portfolio is well-balanced, or we&apos;re too scared to tell you the truth.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {analysis.rebalancingSuggestions.map((s, i) => {
                      const typeColors = { reduce: '#f59e0b', increase: '#22c55e', exit: '#ef4444', diversify: '#60a5fa' };
                      const typeLabels = { reduce: 'REDUCE', increase: 'INCREASE', exit: 'EXIT', diversify: 'DIVERSIFY' };
                      return (
                        <div key={i} style={{
                          padding: '10px 14px', borderRadius: 8,
                          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                              color: typeColors[s.type], background: `${typeColors[s.type]}15`,
                            }}>
                              {typeLabels[s.type]}
                            </span>
                            <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500 }}>{s.coinName}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>{s.reason}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Holdings Table */}
            <div className="data-table-wrapper animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 15, color: 'var(--text-primary)' }}>Your Holdings</h3>
                <button
                  onClick={() => setShowAddModal(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                    background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
                    borderRadius: 6, color: '#a78bfa', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  <Plus size={14} /> Add
                </button>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Coin</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ textAlign: 'right' }}>Price</th>
                    <th style={{ textAlign: 'right' }}>Value</th>
                    <th style={{ textAlign: 'right' }}>Alloc %</th>
                    <th style={{ textAlign: 'right' }}>Buy Price</th>
                    <th style={{ textAlign: 'right' }}>P&L</th>
                    <th style={{ textAlign: 'center' }}>Category</th>
                    <th style={{ textAlign: 'center' }}>Score</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.positions.map((pos) => (
                    <PositionRow key={pos.id} position={pos} onDelete={handleDelete} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Methodology */}
            <div className="methodology" style={{ marginTop: 24 }}>
              <h3>🔬 X-Ray Methodology</h3>
              <p>Your portfolio is analyzed across multiple dimensions:</p>
              <ul>
                <li><strong>Portfolio BS Score</strong> — Weighted average of each holding&apos;s BS Meter (higher = more hype, less substance)</li>
                <li><strong>Diversification Grade</strong> — Based on position count, concentration, and blue-chip vs casino balance</li>
                <li><strong>Risk Concentration</strong> — Single-point-of-failure detection, top-heavy analysis</li>
                <li><strong>Rebalancing Suggestions</strong> — Data-driven (and sarcastically delivered) recommendations</li>
              </ul>
              <p style={{ marginTop: 8 }}>
                This is not financial advice. It&apos;s a reality check with charts.
              </p>
            </div>
          </>
        ) : null}

        {/* Add Holding Modal */}
        {showAddModal && (
          <AddHoldingModal
            coins={coins}
            onAdd={handleAdd}
            onClose={() => setShowAddModal(false)}
          />
        )}
      </div>
    </BlurOverlay>
  );
}
