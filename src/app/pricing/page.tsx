'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Eye, Crown, Moon, BriefcaseBusiness } from 'lucide-react';
import { useAuth, UserTier } from '@/lib/auth';

const tiers: {
    name: string;
    tier: UserTier;
    price: string;
    period: string;
    icon: typeof Eye;
    description: string;
    gradient: string;
    popular?: boolean;
    features: { text: string; included: boolean }[];
}[] = [
        {
            name: 'Normie',
            tier: 'normie',
            price: '$5',
            period: '/month after 14-day free trial',
            icon: Eye,
            description:
                'Two weeks free to pretend you\'re "just looking." Then $5/mo to keep the lights on. That\'s less than a bad coffee. You\'ll survive.',
            gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
            features: [
                { text: 'Top 10 Blue Chips (the boring ones)', included: true },
                { text: 'Basic Sentiment — "vibes-based analysis"', included: true },
                { text: 'Market Overview Dashboard', included: true },
                { text: 'News Headlines (just the clickbait)', included: true },
                { text: 'Daily Overnight Briefing email', included: false },
                { text: 'The Casino — where dreams go to die', included: false },
                { text: 'BS Meter & Real Talk De-Coder', included: false },
                { text: 'Portfolio X-Ray analysis', included: false },
            ],
        },
        {
            name: 'Night Owl',
            tier: 'night_owl',
            price: '$15',
            period: '/month (cheaper than your morning coffee habit)',
            icon: Moon,
            description:
                'Every morning, a crispy email lands in your inbox: the top 10 overnight picks with full analysis. You sip coffee. You feel informed. You make slightly less bad decisions.',
            gradient: 'linear-gradient(135deg, #f59e0b, #f97316)',
            popular: true,
            features: [
                { text: 'Everything the Normies get', included: true },
                { text: '📧 Daily Overnight Briefing email', included: true },
                { text: 'Top 10 picks with full analysis & reasoning', included: true },
                { text: 'The Casino — full access to the chaos 🎰', included: true },
                { text: 'BS Meter — know exactly how much they\'re lying', included: true },
                { text: 'Real Talk De-Coder — jargon annihilator', included: true },
                { text: 'Investment Screener — for "research"', included: true },
                { text: 'Portfolio X-Ray analysis', included: false },
            ],
        },
        {
            name: 'Coin Sense',
            tier: 'coin_sense',
            price: '$29',
            period: '/month (less than your last rug pull)',
            icon: BriefcaseBusiness,
            description:
                'Drop in your actual crypto portfolio and we\'ll roast — sorry, "analyse" — every single position. Plus everything below. Knowledge is power. Also pain.',
            gradient: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            features: [
                { text: 'Everything Night Owls get', included: true },
                { text: '🔍 Portfolio X-Ray — drop in your holdings', included: true },
                { text: 'Position-by-position roast... analysis', included: true },
                { text: 'Risk concentration warnings', included: true },
                { text: 'Rebalancing suggestions (we have opinions)', included: true },
                { text: 'Portfolio BS Score — how degen is your bag?', included: true },
                { text: 'Priority support (faster replies, same sass)', included: true },
                { text: 'Early access to new features', included: true },
            ],
        },
    ];

export default function PricingPage() {
    const router = useRouter();
    const { user, isAuthenticated, upgradeTier, isAdmin } = useAuth();

    const [loadingTier, setLoadingTier] = useState<UserTier | null>(null);

    const handleTierAction = async (tier: typeof tiers[0]) => {
        if (!isAuthenticated) {
            router.push(`/signup?tier=${tier.tier}`);
            return;
        }

        if (user?.tier === tier.tier) {
            return;
        }

        try {
            setLoadingTier(tier.tier);
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tierId: tier.tier,
                    email: user?.email,
                    userId: user?.id
                }),
            });

            const data = await response.json();

            if (data.url) {
                // Redirect to Stripe checkout
                window.location.href = data.url;
            } else {
                console.error('Failed to create checkout session:', data);
                alert('Checkout failed. Please ensure setup is complete.');
            }
        } catch (error) {
            console.error('Error starting checkout:', error);
            alert('An error occurred during checkout.');
        } finally {
            setLoadingTier(null);
        }
    };

    const getButtonLabel = (tier: typeof tiers[0]) => {
        if (!isAuthenticated) {
            if (tier.tier === 'normie') return 'Start 14-Day Free Trial';
            if (tier.tier === 'night_owl') return 'Get the Briefing ☕';
            return 'Get Coin Sense 🧠';
        }
        if (user?.tier === tier.tier) return '✓ Current Plan';
        if (isAdmin) return '✓ Admin Access';
        // Check if upgrade or downgrade
        const tierOrder: UserTier[] = ['normie', 'night_owl', 'coin_sense'];
        const currentIdx = tierOrder.indexOf(user?.tier || 'normie');
        const targetIdx = tierOrder.indexOf(tier.tier);
        if (targetIdx > currentIdx) return `Upgrade to ${tier.name}`;
        return `Switch to ${tier.name}`;
    };

    const isCurrentTier = (tier: typeof tiers[0]) => {
        if (isAdmin) return tier.tier === 'coin_sense';
        return user?.tier === tier.tier;
    };

    return (
        <div>
            <div className="page-header animate-fade-in-up" style={{ textAlign: 'center' }}>
                <h1 className="page-title">Pick Your Fighter</h1>
                <p className="page-subtitle" style={{ maxWidth: 600, margin: '0 auto' }}>
                    Look, you&apos;re already here. You&apos;re already checking crypto
                    prices when you should be working. The only question is how
                    much hand-holding you want while you do it.
                </p>
            </div>

            <div className="pricing-grid">
                {tiers.map((tier, index) => {
                    const Icon = tier.icon;
                    const isCurrent = isCurrentTier(tier);
                    return (
                        <div
                            key={tier.name}
                            className={`pricing-card animate-fade-in-up ${tier.popular ? 'pricing-card--popular' : ''} ${isCurrent ? 'pricing-card--current' : ''}`}
                            style={{ animationDelay: `${index * 150}ms` }}
                        >
                            {isCurrent && isAuthenticated && (
                                <div className="pricing-current-badge">
                                    ✓ Your Plan
                                </div>
                            )}
                            {tier.popular && !isCurrent && (
                                <div className="pricing-popular-badge">
                                    <Crown size={12} /> Most Popular (Obviously)
                                </div>
                            )}

                            <div className="pricing-card-header">
                                <div
                                    className="pricing-icon"
                                    style={{ background: tier.gradient }}
                                >
                                    <Icon size={24} />
                                </div>
                                <h2 className="pricing-name">{tier.name}</h2>
                                <div className="pricing-price">
                                    <span className="pricing-amount">{tier.price}</span>
                                    <span className="pricing-period">{tier.period}</span>
                                </div>
                                <p className="pricing-desc">{tier.description}</p>
                            </div>

                            <div className="pricing-features">
                                {tier.features.map((feature, i) => (
                                    <div
                                        key={i}
                                        className={`pricing-feature ${feature.included ? '' : 'pricing-feature--disabled'}`}
                                    >
                                        {feature.included ? (
                                            <Check size={16} className="pricing-feature-icon pricing-feature-icon--yes" />
                                        ) : (
                                            <X size={16} className="pricing-feature-icon pricing-feature-icon--no" />
                                        )}
                                        <span>{feature.text}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                className={`pricing-cta ${tier.popular ? 'pricing-cta--popular' : ''} ${isCurrent ? 'pricing-cta--current' : ''}`}
                                style={{
                                    background: isCurrent
                                        ? 'transparent'
                                        : tier.popular
                                            ? tier.gradient
                                            : tier.name === 'Coin Sense'
                                                ? tier.gradient
                                                : undefined,
                                    color: isCurrent
                                        ? 'var(--green)'
                                        : tier.name !== 'Normie' ? 'white' : undefined,
                                    border: isCurrent
                                        ? '2px solid var(--green)'
                                        : tier.name !== 'Normie' ? 'none' : undefined,
                                }}
                                onClick={() => handleTierAction(tier)}
                                disabled={isCurrent}
                            >
                                {getButtonLabel(tier)}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
