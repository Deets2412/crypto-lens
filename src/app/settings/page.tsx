'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { Settings, Mail, Briefcase, Bell, ExternalLink } from 'lucide-react';

interface EmailPrefs {
  daily_briefing: boolean;
  briefing_time: string;
  include_portfolio: boolean;
}

export default function SettingsPage() {
  const { user, hasAccess } = useAuth();
  const [prefs, setPrefs] = useState<EmailPrefs>({
    daily_briefing: true,
    briefing_time: '06:00',
    include_portfolio: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchPrefs = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.preferences) {
          setPrefs(data.preferences);
        }
      }
    } catch (err) {
      console.error('Failed to fetch preferences:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrefs();
  }, [fetchPrefs]);

  const updatePref = async (key: keyof EmailPrefs, value: boolean | string) => {
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    setSaving(true);
    setSaved(false);

    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrefs),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p className="loading-text">Loading settings...</p>
      </div>
    );
  }

  const isNightOwlPlus = hasAccess('night_owl');
  const isCoinSense = hasAccess('coin_sense');

  return (
    <div>
      <div className="page-header animate-fade-in-up">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Settings size={28} />
          Settings
        </h1>
        <p className="page-subtitle">
          Manage your email preferences and account settings.
        </p>
      </div>

      {/* Email Preferences */}
      <div className="settings-section animate-fade-in-up">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Mail size={18} /> Email Preferences
        </h3>

        <div className="settings-row">
          <div className="settings-label">
            <span>Daily Email Briefing</span>
            <span>
              {isNightOwlPlus
                ? 'Get a sardonic market summary in your inbox every morning at 6:00 AM UTC'
                : 'Available on Night Owl plan and above'}
            </span>
          </div>
          <button
            className={`toggle-switch ${prefs.daily_briefing && isNightOwlPlus ? 'active' : ''}`}
            onClick={() => isNightOwlPlus && updatePref('daily_briefing', !prefs.daily_briefing)}
            disabled={!isNightOwlPlus}
            style={{ opacity: isNightOwlPlus ? 1 : 0.4 }}
          />
        </div>

        <div className="settings-row">
          <div className="settings-label">
            <span>Include Portfolio Summary</span>
            <span>
              {isCoinSense
                ? 'Add your portfolio P&L to the daily briefing'
                : 'Available on Coin Sense plan'}
            </span>
          </div>
          <button
            className={`toggle-switch ${prefs.include_portfolio && isCoinSense ? 'active' : ''}`}
            onClick={() => isCoinSense && updatePref('include_portfolio', !prefs.include_portfolio)}
            disabled={!isCoinSense}
            style={{ opacity: isCoinSense ? 1 : 0.4 }}
          />
        </div>
      </div>

      {/* Account Info */}
      <div className="settings-section animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Briefcase size={18} /> Account
        </h3>

        <div className="settings-row">
          <div className="settings-label">
            <span>Email</span>
            <span>{user?.email}</span>
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-label">
            <span>Current Plan</span>
            <span style={{ textTransform: 'capitalize' }}>
              {user?.tier === 'coin_sense' ? 'Coin Sense' : user?.tier === 'night_owl' ? 'Night Owl' : 'Normie'}
              {user?.isAdmin && ' (Admin)'}
            </span>
          </div>
        </div>

        {user?.stripeCustomerId && (
          <div className="settings-row">
            <div className="settings-label">
              <span>Manage Subscription</span>
              <span>Update payment method, cancel, or change plan via Stripe</span>
            </div>
            <a
              href="/api/stripe/portal"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: 6,
                color: 'var(--accent-blue)', fontSize: 13, fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              <ExternalLink size={14} /> Billing Portal
            </a>
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="settings-section animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={18} /> Notifications
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Push notifications, price alerts, and whale tracking are coming soon. We&apos;ll let you configure them here
          when they arrive. Try not to refresh this page every 5 minutes waiting.
        </p>
      </div>

      {/* Save indicator */}
      {saved && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, padding: '12px 20px',
          background: 'var(--green)', color: 'white', borderRadius: 8,
          fontSize: 14, fontWeight: 600, boxShadow: 'var(--shadow-lg)',
          animation: 'modalSlideUp 0.2s ease',
        }}>
          Settings saved
        </div>
      )}
    </div>
  );
}
