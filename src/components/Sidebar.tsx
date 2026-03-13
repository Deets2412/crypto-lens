'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  Bell,
  Settings,
  LogOut,
  Zap,
  Brain,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/markets', icon: TrendingUp, label: 'Markets' },
  { href: '/portfolio', icon: Wallet, label: 'Portfolio' },
  { href: '/ai', icon: Brain, label: 'AI Intelligence' },
  { href: '/alerts', icon: Bell, label: 'Alerts' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <Zap size={24} />
        <span>CoinDebrief</span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`sidebar-nav-item ${
              pathname === href || pathname.startsWith(href + '/') ? 'active' : ''
            }`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="sidebar-bottom">
        {/* Tier badge */}
        {user && (
          <div className={`tier-badge tier-badge--${user.tier}`}>
            <Zap size={14} />
            <span>
              {user.tier === 'normie'
                ? 'Normie'
                : user.tier === 'night_owl'
                ? 'Night Owl'
                : 'Coin Sense'}
            </span>
          </div>
        )}

        <Link
          href="/settings"
          className={`sidebar-nav-item ${
            pathname === '/settings' ? 'active' : ''
          }`}
        >
          <Settings size={20} />
          <span>Settings</span>
        </Link>

        <button className="sidebar-nav-item sidebar-signout" onClick={handleSignOut}>
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
