'use client';

import { useState, useMemo } from 'react';
import { useAppData } from '@/components/AppShell';
import { scoreScreenerRow } from '@/lib/scoring';
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/api';
import SparklineChart from '@/components/SparklineChart';
import { Filter, ChevronUp, ChevronDown, Search } from 'lucide-react';
import { ScreenerRow } from '@/lib/types';
import { BlurOverlay } from '@/components/TierBadge';

type SortField =
    | 'rank'
    | 'name'
    | 'price'
    | 'change24h'
    | 'change7d'
    | 'marketCap'
    | 'volume'
    | 'volumeToMcap'
    | 'athDistance'
    | 'supplyRatio'
    | 'fundamental'
    | 'technical'
    | 'composite';

type SortDirection = 'asc' | 'desc';

export default function ScreenerPage() {
    const { coins, loading } = useAppData();
    const [sortField, setSortField] = useState<SortField>('composite');
    const [sortDir, setSortDir] = useState<SortDirection>('desc');
    const [searchQuery, setSearchQuery] = useState('');
    const [minMarketCap, setMinMarketCap] = useState('');
    const [minVolume, setMinVolume] = useState('');
    const [minChange, setMinChange] = useState('');

    const screenerData = useMemo(() => coins.map(scoreScreenerRow), [coins]);

    const filteredData = useMemo(() => {
        let data = [...screenerData];

        // Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            data = data.filter(
                (r) =>
                    r.coin.name.toLowerCase().includes(q) ||
                    r.coin.symbol.toLowerCase().includes(q)
            );
        }

        // Market cap filter
        if (minMarketCap) {
            const mc = parseFloat(minMarketCap) * 1e9; // input is in billions
            data = data.filter((r) => r.coin.market_cap >= mc);
        }

        // Volume filter
        if (minVolume) {
            const vol = parseFloat(minVolume) * 1e6; // input is in millions
            data = data.filter((r) => r.coin.total_volume >= vol);
        }

        // 24h change filter
        if (minChange) {
            const mc = parseFloat(minChange);
            data = data.filter(
                (r) => (r.coin.price_change_percentage_24h || 0) >= mc
            );
        }

        // Sort
        data.sort((a, b) => {
            let aVal: number, bVal: number;
            switch (sortField) {
                case 'rank':
                    aVal = a.coin.market_cap_rank; bVal = b.coin.market_cap_rank; break;
                case 'name':
                    return sortDir === 'asc'
                        ? a.coin.name.localeCompare(b.coin.name)
                        : b.coin.name.localeCompare(a.coin.name);
                case 'price':
                    aVal = a.coin.current_price; bVal = b.coin.current_price; break;
                case 'change24h':
                    aVal = a.coin.price_change_percentage_24h || 0;
                    bVal = b.coin.price_change_percentage_24h || 0; break;
                case 'change7d':
                    aVal = a.coin.price_change_percentage_7d_in_currency || 0;
                    bVal = b.coin.price_change_percentage_7d_in_currency || 0; break;
                case 'marketCap':
                    aVal = a.coin.market_cap; bVal = b.coin.market_cap; break;
                case 'volume':
                    aVal = a.coin.total_volume; bVal = b.coin.total_volume; break;
                case 'volumeToMcap':
                    aVal = a.volumeToMcap; bVal = b.volumeToMcap; break;
                case 'athDistance':
                    aVal = a.athDistance; bVal = b.athDistance; break;
                case 'supplyRatio':
                    aVal = a.supplyRatio; bVal = b.supplyRatio; break;
                case 'fundamental':
                    aVal = a.fundamentalScore; bVal = b.fundamentalScore; break;
                case 'technical':
                    aVal = a.technicalScore; bVal = b.technicalScore; break;
                case 'composite':
                    aVal = a.compositeScore; bVal = b.compositeScore; break;
                default:
                    aVal = 0; bVal = 0;
            }
            return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
        });

        return data;
    }, [screenerData, searchQuery, minMarketCap, minVolume, minChange, sortField, sortDir]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('desc');
        }
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return null;
        return sortDir === 'asc' ? (
            <ChevronUp size={14} style={{ marginLeft: 4 }} />
        ) : (
            <ChevronDown size={14} style={{ marginLeft: 4 }} />
        );
    };

    const getScoreColor = (score: number) => {
        if (score >= 75) return 'var(--green)';
        if (score >= 50) return 'var(--accent-blue)';
        if (score >= 25) return 'var(--yellow)';
        return 'var(--red)';
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <p className="loading-text">Loading screener...</p>
            </div>
        );
    }

    return (
        <BlurOverlay requiredTier="night_owl" featureName="Investment Screener">
            <div>
                <div className="page-header animate-fade-in-up">
                    <h1 className="page-title">Investment Screener</h1>
                    <p className="page-subtitle">
                        Screen and filter the top 100 cryptocurrencies using fundamental and
                        technical metrics — the same way fund managers analyze traditional equities.
                    </p>
                </div>

                {/* Filters */}
                <div className="filter-bar animate-fade-in-up">
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
                            placeholder="Search coins..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: 36, minWidth: 200 }}
                        />
                    </div>
                    <input
                        type="number"
                        className="filter-input"
                        placeholder="Min MCap ($B)"
                        value={minMarketCap}
                        onChange={(e) => setMinMarketCap(e.target.value)}
                        style={{ width: 140 }}
                    />
                    <input
                        type="number"
                        className="filter-input"
                        placeholder="Min Vol ($M)"
                        value={minVolume}
                        onChange={(e) => setMinVolume(e.target.value)}
                        style={{ width: 140 }}
                    />
                    <input
                        type="number"
                        className="filter-input"
                        placeholder="Min 24h Δ (%)"
                        value={minChange}
                        onChange={(e) => setMinChange(e.target.value)}
                        style={{ width: 140 }}
                    />
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        <Filter size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        {filteredData.length} coins
                    </span>
                </div>

                {/* Data Table */}
                <div className="data-table-wrapper animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('rank')} className={sortField === 'rank' ? 'sorted' : ''}>
                                    # <SortIcon field="rank" />
                                </th>
                                <th onClick={() => handleSort('name')} className={sortField === 'name' ? 'sorted' : ''}>
                                    Coin <SortIcon field="name" />
                                </th>
                                <th onClick={() => handleSort('price')} className={sortField === 'price' ? 'sorted' : ''}>
                                    Price <SortIcon field="price" />
                                </th>
                                <th onClick={() => handleSort('change24h')} className={sortField === 'change24h' ? 'sorted' : ''}>
                                    24h <SortIcon field="change24h" />
                                </th>
                                <th onClick={() => handleSort('change7d')} className={sortField === 'change7d' ? 'sorted' : ''}>
                                    7d <SortIcon field="change7d" />
                                </th>
                                <th onClick={() => handleSort('marketCap')} className={sortField === 'marketCap' ? 'sorted' : ''}>
                                    Market Cap <SortIcon field="marketCap" />
                                </th>
                                <th onClick={() => handleSort('volume')} className={sortField === 'volume' ? 'sorted' : ''}>
                                    24h Volume <SortIcon field="volume" />
                                </th>
                                <th onClick={() => handleSort('volumeToMcap')} className={sortField === 'volumeToMcap' ? 'sorted' : ''}>
                                    Vol/MCap <SortIcon field="volumeToMcap" />
                                </th>
                                <th onClick={() => handleSort('athDistance')} className={sortField === 'athDistance' ? 'sorted' : ''}>
                                    ATH Dist <SortIcon field="athDistance" />
                                </th>
                                <th onClick={() => handleSort('supplyRatio')} className={sortField === 'supplyRatio' ? 'sorted' : ''}>
                                    Supply <SortIcon field="supplyRatio" />
                                </th>
                                <th>7d Chart</th>
                                <th onClick={() => handleSort('fundamental')} className={sortField === 'fundamental' ? 'sorted' : ''}>
                                    Fund <SortIcon field="fundamental" />
                                </th>
                                <th onClick={() => handleSort('technical')} className={sortField === 'technical' ? 'sorted' : ''}>
                                    Tech <SortIcon field="technical" />
                                </th>
                                <th onClick={() => handleSort('composite')} className={sortField === 'composite' ? 'sorted' : ''}>
                                    Score <SortIcon field="composite" />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((row) => (
                                <tr key={row.coin.id}>
                                    <td style={{ color: 'var(--text-muted)' }}>
                                        {row.coin.market_cap_rank}
                                    </td>
                                    <td>
                                        <div className="coin-cell">
                                            <img
                                                src={row.coin.image}
                                                alt={row.coin.name}
                                                className="coin-icon"
                                            />
                                            <div>
                                                <div className="coin-name">{row.coin.name}</div>
                                                <div className="coin-symbol">{row.coin.symbol}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{formatCurrency(row.coin.current_price)}</td>
                                    <td
                                        className={
                                            (row.coin.price_change_percentage_24h || 0) >= 0
                                                ? 'positive'
                                                : 'negative'
                                        }
                                    >
                                        {formatPercentage(row.coin.price_change_percentage_24h)}
                                    </td>
                                    <td
                                        className={
                                            (row.coin.price_change_percentage_7d_in_currency || 0) >= 0
                                                ? 'positive'
                                                : 'negative'
                                        }
                                    >
                                        {formatPercentage(
                                            row.coin.price_change_percentage_7d_in_currency
                                        )}
                                    </td>
                                    <td>{formatCurrency(row.coin.market_cap)}</td>
                                    <td>{formatCurrency(row.coin.total_volume)}</td>
                                    <td>{(row.volumeToMcap * 100).toFixed(2)}%</td>
                                    <td className="negative">
                                        {row.athDistance.toFixed(1)}%
                                    </td>
                                    <td>{(row.supplyRatio * 100).toFixed(0)}%</td>
                                    <td>
                                        <SparklineChart
                                            data={row.coin.sparkline_in_7d?.price || []}
                                            height={32}
                                        />
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div
                                                className="score-bar"
                                                style={{ width: 50 }}
                                            >
                                                <div
                                                    className="score-bar-fill"
                                                    style={{
                                                        width: `${row.fundamentalScore}%`,
                                                        background: getScoreColor(row.fundamentalScore),
                                                    }}
                                                />
                                            </div>
                                            <span style={{ color: getScoreColor(row.fundamentalScore), fontWeight: 600 }}>
                                                {row.fundamentalScore}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div
                                                className="score-bar"
                                                style={{ width: 50 }}
                                            >
                                                <div
                                                    className="score-bar-fill"
                                                    style={{
                                                        width: `${row.technicalScore}%`,
                                                        background: getScoreColor(row.technicalScore),
                                                    }}
                                                />
                                            </div>
                                            <span style={{ color: getScoreColor(row.technicalScore), fontWeight: 600 }}>
                                                {row.technicalScore}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <span
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: 36,
                                                height: 36,
                                                borderRadius: '50%',
                                                background: `${getScoreColor(row.compositeScore)}15`,
                                                color: getScoreColor(row.compositeScore),
                                                fontWeight: 800,
                                                fontSize: 13,
                                                border: `1px solid ${getScoreColor(row.compositeScore)}40`,
                                            }}
                                        >
                                            {row.compositeScore}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="methodology" style={{ marginTop: 24 }}>
                    <h3>📊 Scoring Methodology</h3>
                    <p>Each coin receives two scores blended into a composite:</p>
                    <ul>
                        <li><strong>Fundamental Score (40%)</strong> — Market cap rank, volume-to-market-cap ratio, supply scarcity</li>
                        <li><strong>Technical Score (60%)</strong> — 24h & 7d price momentum, distance from all-time high</li>
                    </ul>
                    <p style={{ marginTop: 8 }}>
                        Scores range from 0-100. Higher scores indicate stronger combined fundamental and
                        technical profiles.
                    </p>
                </div>
            </div>
        </BlurOverlay>
    );
}
