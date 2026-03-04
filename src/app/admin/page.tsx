'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Users,
  CreditCard,
  Mail,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  tierBreakdown: { normie: number; night_owl: number; coin_sense: number };
  activeSubscriptions: number;
  totalLeads: number;
  recentUsers: Array<{
    id: string;
    email: string;
    tier: string;
    role: string;
    created_at: string;
    stripe_customer_id: string | null;
  }>;
}

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else if (res.status === 403) {
        router.push('/');
      }
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/');
      return;
    }
    if (!authLoading && isAdmin) {
      fetchStats();
    }
  }, [authLoading, isAdmin, fetchStats, router]);

  if (authLoading || loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p className="loading-text">Loading admin dashboard...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div>
      <div className="page-header animate-fade-in-up">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldCheck size={28} />
              Admin Dashboard
            </h1>
            <p className="page-subtitle">
              User management, subscription stats, and lead tracking.
            </p>
          </div>
          <button
            onClick={fetchStats}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
              background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: 6, color: 'var(--accent-blue)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {stats && (
        <>
          {/* Stats Grid */}
          <div className="admin-stats-grid animate-fade-in-up">
            <div className="admin-stat-card">
              <Users size={20} style={{ color: 'var(--accent-blue)' }} />
              <div className="admin-stat-value">{stats.totalUsers}</div>
              <div className="admin-stat-label">Total Users</div>
            </div>

            <div className="admin-stat-card">
              <CreditCard size={20} style={{ color: 'var(--green)' }} />
              <div className="admin-stat-value">{stats.activeSubscriptions}</div>
              <div className="admin-stat-label">Active Subscriptions</div>
            </div>

            <div className="admin-stat-card">
              <Mail size={20} style={{ color: 'var(--accent-purple)' }} />
              <div className="admin-stat-value">{stats.totalLeads}</div>
              <div className="admin-stat-label">Email Leads</div>
            </div>

            <div className="admin-stat-card">
              <TrendingUp size={20} style={{ color: 'var(--yellow)' }} />
              <div className="admin-stat-value">
                {stats.totalUsers > 0
                  ? ((stats.activeSubscriptions / stats.totalUsers) * 100).toFixed(0)
                  : 0}%
              </div>
              <div className="admin-stat-label">Conversion Rate</div>
            </div>
          </div>

          {/* Tier Breakdown */}
          <div className="admin-stat-card animate-fade-in-up" style={{ marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, color: 'var(--text-primary)' }}>Tier Distribution</h3>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <span className="admin-tier-pill admin-tier-pill--normie">Normie</span>
                <span style={{ marginLeft: 8, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {stats.tierBreakdown.normie}
                </span>
              </div>
              <div>
                <span className="admin-tier-pill admin-tier-pill--night_owl">Night Owl</span>
                <span style={{ marginLeft: 8, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {stats.tierBreakdown.night_owl}
                </span>
              </div>
              <div>
                <span className="admin-tier-pill admin-tier-pill--coin_sense">Coin Sense</span>
                <span style={{ marginLeft: 8, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {stats.tierBreakdown.coin_sense}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Users Table */}
          <div className="data-table-wrapper animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ margin: 0, fontSize: 15, color: 'var(--text-primary)' }}>
                Recent Users ({stats.recentUsers.length})
              </h3>
            </div>
            <table className="admin-user-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Tier</th>
                  <th>Role</th>
                  <th>Stripe</th>
                  <th>Signed Up</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentUsers.map((u) => (
                  <tr key={u.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{u.email}</td>
                    <td>
                      <span className={`admin-tier-pill admin-tier-pill--${u.tier}`}>
                        {u.tier === 'coin_sense' ? 'Coin Sense' : u.tier === 'night_owl' ? 'Night Owl' : 'Normie'}
                      </span>
                    </td>
                    <td>
                      {u.role === 'admin' ? (
                        <span style={{ color: 'var(--red)', fontWeight: 600, fontSize: 12 }}>ADMIN</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>user</span>
                      )}
                    </td>
                    <td>
                      <span className={`admin-status-dot ${u.stripe_customer_id ? 'admin-status-dot--active' : 'admin-status-dot--inactive'}`} />
                      {u.stripe_customer_id ? 'Connected' : 'None'}
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {new Date(u.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
