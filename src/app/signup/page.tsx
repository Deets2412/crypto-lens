'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth, UserTier } from '@/lib/auth';
import { TrendingUp, UserPlus, Eye, EyeOff, AlertCircle, Check, Sparkles } from 'lucide-react';

const tierOptions: { value: UserTier; label: string; desc: string; price: string }[] = [
    { value: 'normie', label: 'Normie', desc: '14-day free trial, then $5/mo', price: 'Free' },
    { value: 'night_owl', label: 'Night Owl', desc: 'Full access + daily briefing', price: '$15/mo' },
    { value: 'coin_sense', label: 'Coin Sense', desc: 'Everything + Portfolio X-Ray', price: '$29/mo' },
];

export default function SignupPage() {
    const searchParams = useSearchParams();
    const defaultTier = (searchParams.get('tier') as UserTier) || 'normie';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [selectedTier, setSelectedTier] = useState<UserTier>(defaultTier);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup, isAuthenticated } = useAuth();
    const router = useRouter();

    if (isAuthenticated) {
        router.push('/');
        return null;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!email || !password || !confirmPassword) {
            setError('Please fill in all fields.');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
        }

        const result = signup(email, password, selectedTier);
        if (result.success) {
            router.push('/');
        } else {
            setError(result.error || 'Signup failed.');
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card auth-card--signup animate-fade-in-up">
                <div className="auth-brand">
                    <div className="auth-brand-icon">
                        <TrendingUp size={28} />
                    </div>
                    <h1>CoinDebrief</h1>
                    <p>Start Making Smarter Moves</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <h2>Create Your Account</h2>

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
                                placeholder="At least 6 characters"
                                autoComplete="new-password"
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
                        <label htmlFor="confirm-password">Confirm Password</label>
                        <input
                            id="confirm-password"
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repeat password"
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="auth-field">
                        <label>Choose Your Plan</label>
                        <div className="auth-tier-selector">
                            {tierOptions.map((t) => (
                                <button
                                    key={t.value}
                                    type="button"
                                    className={`auth-tier-option ${selectedTier === t.value ? 'auth-tier-option--active' : ''}`}
                                    onClick={() => setSelectedTier(t.value)}
                                >
                                    <div className="auth-tier-option-header">
                                        <span className="auth-tier-option-name">
                                            {selectedTier === t.value ? <Check size={14} /> : <Sparkles size={14} />}
                                            {t.label}
                                        </span>
                                        <span className="auth-tier-option-price">{t.price}</span>
                                    </div>
                                    <span className="auth-tier-option-desc">{t.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="auth-submit" disabled={loading}>
                        <UserPlus size={18} />
                        {loading
                            ? 'Creating account...'
                            : selectedTier === 'normie'
                                ? 'Start 14-Day Free Trial'
                                : `Subscribe — ${tierOptions.find((t) => t.value === selectedTier)?.price}`}
                    </button>

                    <div className="auth-footer">
                        <p>
                            Already have an account?{' '}
                            <Link href="/login">Sign in</Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
