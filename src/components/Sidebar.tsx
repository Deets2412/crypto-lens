'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Newspaper,
    Filter,
    Shield,
    Flame,
    CreditCard,
    TrendingUp,
} from 'lucide-react';
import { TierBadge } from './TierBadge';

const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/news', label: 'News & Signals', icon: Newspaper },
    { href: '/recommendations', label: 'Blue Chips', icon: Shield },
    { href: '/casino', label: 'The Casino', icon: Flame, badge: 'pro' as const },
    { href: '/screener', label: 'Screener', icon: Filter, badge: 'pro' as const },
    { href: '/pricing', label: 'Pricing', icon: CreditCard },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();

    return (
        <>
            {isOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 99,
                        display: 'none',
                    }}
                />
            )}
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <div className="sidebar-brand-icon">
                        <TrendingUp size={22} />
                    </div>
                    <h1>CryptoLens</h1>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive =
                            item.href === '/'
                                ? pathname === '/'
                                : pathname.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`sidebar-nav-item ${isActive ? 'active' : ''} ${item.href === '/casino' ? 'sidebar-nav-item--casino' : ''
                                    }`}
                                onClick={onClose}
                            >
                                <Icon className="nav-icon" size={20} />
                                <span style={{ flex: 1 }}>{item.label}</span>
                                {item.badge && <TierBadge tier={item.badge} />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    <p>CryptoLens v2.0</p>
                    <p style={{ marginTop: 4 }}>Data from CoinGecko & CryptoCompare</p>
                </div>
            </aside>

            <style jsx>{`
        @media (max-width: 768px) {
          .sidebar-overlay {
            display: block !important;
          }
        }
      `}</style>
        </>
    );
}
