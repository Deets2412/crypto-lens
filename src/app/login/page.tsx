'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { TrendingUp, LogIn, Eye, EyeOff, AlertCircle, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  if (isAuthenticated) {
    router.push('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    const result = await login(email, password);
    if (result.success) {
      router.push('/');
    } else {
      setError(result.error || 'Login failed.');
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setError('Enter your email first.');
      return;
    }
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMagicLinkSent(true);
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Enter your email first, then click Forgot Password.');
      return;
    }
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.toLowerCase().trim(),
      { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` }
    );

    if (error) {
      setError(error.message);
    } else {
      setMagicLinkSent(true);
      setResetMode(true);
    }
    setLoading(false);
  };

  if (magicLinkSent) {
    return (
      <div className="auth-page">
        <div className="auth-card animate-fade-in-up">
          <div className="auth-brand">
            <div className="auth-brand-icon">
              <Mail size={28} />
            </div>
            <h1>Check Your Email</h1>
            <p style={{ marginTop: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              We sent a link to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.
              {resetMode
                ? ' Click it to reset your password.'
                : ' Click it to sign in. No password needed.'
              }
            </p>
            <button
              className="auth-submit"
              style={{ marginTop: 24 }}
              onClick={() => setMagicLinkSent(false)}
            >
              Back to Sign In
            </button>
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
          <p>Crypto Intelligence, Zero BS</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2>Welcome Back</h2>

          {error && (
            <div className="auth-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <div className="auth-password-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
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

          <button type="submit" className="auth-submit" disabled={loading}>
            <LogIn size={18} />
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <button
            type="button"
            className="auth-submit"
            style={{
              background: 'transparent',
              border: '1px solid var(--border-primary)',
              color: 'var(--text-secondary)',
              marginTop: 8,
            }}
            onClick={handleMagicLink}
            disabled={loading}
          >
            <Mail size={18} />
            Sign in with Magic Link
          </button>

          <div className="auth-footer">
            <p>
              <button
                type="button"
                onClick={handleForgotPassword}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-blue)',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: 'inherit',
                }}
              >
                Forgot password?
              </button>
            </p>
            <p>
              Don&apos;t have an account?{' '}
              <Link href="/signup">Start your free trial</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
