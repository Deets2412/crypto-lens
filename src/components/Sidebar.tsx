'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Newspaper,
    Filter,
    Shield,
    Flame,
    CreditCard,
    TrendingUp,
    LogOut,
    Crown,
    Clock,
    Crosshair,
    Settings,
    ShieldCheck,
    Brain,
} from 'lucide-react';
import { TierBadge } from './TierBadge';
import { useAuth } from '@/lib/auth';

const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/news', label: 'News & Signals', icon: Newspaper },
    { href: '/recommendations', label: 'Blue Chips', icon: Shield },
    { href: '/casino', label: 'The Casino', icon: Flame, requiredTier: 'night_owl' as const },
    { href: '/screener', label: 'Screener', icon: Filter, requiredTier: 'night_owl' as const },
    { href: '/portfolio', label: 'Portfolio X-Ray', icon: Crosshair, requiredTier: 'coin_sense' as const },
    { href: '/ai', label: 'AI Intelligence', icon: Brain },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/pricing', label: 'Pricing', icon: CreditCard },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isAdmin, isTrialActive, trialDaysRemaining, logout, hasAccess } = useAuth();

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    const tierLabel = user?.isAdmin
        ? 'Admin'
        : user?.tier === 'coin_sense'
            ? 'Coin Sense'
            : user?.tier === 'night_owl'
                ? 'Night Owl'
                : 'Normie';

    const tierGradient = user?.isAdmin
        ? 'linear-gradient(135deg, #ef4444, #f97316)'
        : user?.tier === 'coin_sense'
            ? 'linear-gradient(135deg, #8b5cf6, #6366f1)'
            : user?.tier === 'night_owl'
                ? 'linear-gradient(135deg, #f59e0b, #f97316)'
                : 'linear-gradient(135deg, #3b82f6, #06b6d4)';

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
                    <h1>CoinDebrief</h1>
                </div>

                {/* User info section */}
                {user && (
                    <div className="sidebar-user">
                        <div className="sidebar-user-avatar" style={{ background: tierGradient }}>
                            {user.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="sidebar-user-info">
                            <span className="sidebar-user-email">{user.email}</span>
                            <span className="sidebar-user-tier" style={{ background: tierGradient }}>
                                {user.isAdmin && <Crown size={10} />}
                                {tierLabel}
                            </span>
                        </div>
                    </div>
                )}

                {/* Trial countdown */}
                {isTrialActive && (
                    <div className="sidebar-trial-badge">
                        <Clock size={14} />
                        <span>{trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} left on trial</span>
                    </div>
                )}

                <nav className="sidebar-nav">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive =
                            item.href === '/'
                                ? pathname === '/'
                                : pathname.startsWith(item.href);
                        const isLocked = item.requiredTier && !hasAccess(item.requiredTier);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`sidebar-nav-item ${isActive ? 'active' : ''} ${item.href === '/casino' ? 'sidebar-nav-item--casino' : ''
                                    } ${isLocked ? 'sidebar-nav-item--locked' : ''}`}
                                onClick={onClose}
                            >
                                <Icon className="nav-icon" size={20} />
                                <span style={{ flex: 1 }}>{item.label}</span>
                                {isLocked && <TierBadge tier="pro" />}
                            </Link>
                        );
                    })}
                </nav>

                {/* Admin link — only visible to admins */}
                {isAdmin && (
                    <nav style={{ marginTop: 8, padding: '0 12px' }}>
                        <Link
                            href="/admin"
                            className={`sidebar-nav-item ${pathname === '/admin' ? 'active' : ''}`}
                            onClick={onClose}
                            style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}
                        >
                            <ShieldCheck className="nav-icon" size={20} />
                            <span style={{ flex: 1 }}>Admin</span>
                        </Link>
                    </nav>
                )}

                <div className="sidebar-footer">
                    <button className="sidebar-logout-btn" onClick={handleLogout}>
                        <LogOut size={16} />
                        Sign Out
                    </button>
                    <p style={{ marginTop: 8 }}>CoinDebrief v2.0</p>
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
