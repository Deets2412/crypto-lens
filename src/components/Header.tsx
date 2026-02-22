'use client';

import { Menu } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/api';
import { Coin } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

interface HeaderProps {
    topCoins: Coin[];
    onMenuToggle: () => void;
}

export default function Header({ topCoins, onMenuToggle }: HeaderProps) {
    const { user, isAdmin } = useAuth();

    const btc = topCoins.find((c) => c.symbol === 'btc');
    const eth = topCoins.find((c) => c.symbol === 'eth');
    const sol = topCoins.find((c) => c.symbol === 'sol');

    const tickers = [btc, eth, sol].filter(Boolean) as Coin[];

    const tierLabel = isAdmin
        ? 'Admin'
        : user?.tier === 'coin_sense'
            ? 'Coin Sense'
            : user?.tier === 'night_owl'
                ? 'Night Owl'
                : 'Normie';

    return (
        <header className="header">
            <div className="header-left">
                <button className="menu-button" onClick={onMenuToggle}>
                    <Menu size={24} />
                </button>
                <div className="header-ticker">
                    {tickers.map((coin) => (
                        <div key={coin.id} className="ticker-item">
                            <span className="ticker-symbol">{coin.symbol.toUpperCase()}</span>
                            <span className="ticker-price">
                                {formatCurrency(coin.current_price)}
                            </span>
                            <span
                                className={`ticker-change ${coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'
                                    }`}
                            >
                                {formatPercentage(coin.price_change_percentage_24h)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="header-right">
                <Link href="/pricing" className="header-tier-badge">
                    {tierLabel}
                </Link>
            </div>
        </header>
    );
}
