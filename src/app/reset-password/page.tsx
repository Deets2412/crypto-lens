'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { TrendingUp, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

// ============================================================
// CoinDebrief — Password Reset Page
// Users land here after clicking the reset link in their email.
// Supabase handles the token exchange via the auth callback,
// then redirects here with an active session.
// ============================================================

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Check that we have a valid session (user clicked the email link)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setSessionReady(true);
      } else {
        // No session — the user navigated here directly without a reset link
        setError('No active reset session. Please request a new password reset from the login page.');
      }
    };
    checkSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Please fill in both fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters. Even crypto degenerates deserve basic security.');
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match. Try again — slowly this time.");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      // Redirect to dashboard after a moment
      setTimeout(() => {
        router.push('/');
      }, 3000);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card animate-fade-in-up">
          <div className="auth-brand">
            <div className="auth-brand-icon" style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2))' }}>
              <CheckCircle size={28} style={{ color: '#22c55e' }} />
            </div>
            <h1>Password Updated</h1>
            <p style={{ marginTop: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Your password has been reset successfully. Try not to forget it this time.
            </p>
            <p style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Redirecting to dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in-up">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <TrendingUp size={28} />
          </div>
          <h1>CoinDebrief</h1>
          <p>Reset Your Password</p>
        </div>

        <form onSubmit={handleReset} className="auth-form">
          <h2>New Password</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
            Enter your new password below. Make it something you&apos;ll remember —
            we&apos;d hate to see you back here again so soon.
          </p>

          {error && (
            <div className="auth-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="password">New Password</label>
            <div className="auth-password-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={!sessionReady}
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="auth-password-wrapper">
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={!sessionReady}
              />
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading || !sessionReady}
          >
            <Lock size={18} />
            {loading ? 'Updating...' : 'Set New Password'}
          </button>

          <div className="auth-footer">
            <p>
              Remember your password?{' '}
              <a href="/login" style={{ color: 'var(--accent-blue)' }}>Back to login</a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
