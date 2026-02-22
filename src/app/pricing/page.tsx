'use client';

import { useState } from 'react';
import { Check, X, Zap, Eye, Crown } from 'lucide-react';
import { LeadCaptureModal } from '@/components/LeadCaptureModal';

const tiers = [
    {
        name: 'Normie',
        price: '$0',
        period: 'forever, baby',
        icon: Eye,
        description: 'You\'re "just looking." Sure you are. That\'s what they all say before they\'re refreshing charts at 3am.',
        gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
        features: [
            { text: 'Top 10 Blue Chips (the boring ones)', included: true },
            { text: 'Basic Sentiment — "vibes-based analysis"', included: true },
            { text: 'Market Overview Dashboard', included: true },
            { text: 'News Headlines (just the clickbait)', included: true },
            { text: 'The Casino — where dreams go to die', included: false },
            { text: 'BS Meter — corp speak translator', included: false },
            { text: 'Real Talk De-Coder', included: false },
            { text: 'Investment Screener', included: false },
            { text: 'Overnight Intelligence Briefing', included: false },
        ],
    },
    {
        name: 'Coin Sense',
        price: '$29',
        period: '/month (less than your last rug pull)',
        icon: Zap,
        description: 'You\'ve accepted who you are. Might as well have good data while you YOLO your savings into coins you found on TikTok.',
        gradient: 'linear-gradient(135deg, #f59e0b, #f97316)',
        popular: true,
        features: [
            { text: 'Everything the Normies get', included: true },
            { text: 'Full Blue Chip Rankings — all of them', included: true },
            { text: 'The Casino — full degen access 🎰', included: true },
            { text: 'BS Meter — know exactly how much they\'re lying', included: true },
            { text: 'Real Talk De-Coder — corporate jargon annihilator', included: true },
            { text: 'Investment Screener — for "research"', included: true },
            { text: 'Full News Sentiment — every last bearish tweet', included: true },
            { text: 'Overnight Intelligence Briefing ☕', included: true },
            { text: 'Priority support (we\'ll answer faster, not better)', included: true },
        ],
    },
];

export default function PricingPage() {
    const [showLeadModal, setShowLeadModal] = useState(false);

    return (
        <div>
            <div className="page-header animate-fade-in-up" style={{ textAlign: 'center' }}>
                <h1 className="page-title">Pick Your Fighter</h1>
                <p className="page-subtitle" style={{ maxWidth: 600, margin: '0 auto' }}>
                    Look, you&apos;re already here. You&apos;re already checking crypto prices
                    when you should be working. The only question is whether you want
                    the training wheels on or off.
                </p>
            </div>

            <div className="pricing-grid" style={{ maxWidth: 800, margin: '32px auto 0' }}>
                {tiers.map((tier, index) => {
                    const Icon = tier.icon;
                    return (
                        <div
                            key={tier.name}
                            className={`pricing-card animate-fade-in-up ${tier.popular ? 'pricing-card--popular' : ''}`}
                            style={{ animationDelay: `${index * 150}ms` }}
                        >
                            {tier.popular && (
                                <div className="pricing-popular-badge">
                                    <Crown size={12} /> You Know You Want This
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
                                className={`pricing-cta ${tier.popular ? 'pricing-cta--popular' : ''}`}
                                style={{ background: tier.popular ? tier.gradient : undefined }}
                                onClick={() => {
                                    if (tier.name === 'Normie') {
                                        setShowLeadModal(true);
                                    }
                                }}
                            >
                                {tier.name === 'Normie' ? 'Start Lurking (Free)' : 'Get Coin Sense'}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* FAQ */}
            <div className="methodology" style={{ marginTop: 48, textAlign: 'center' }}>
                <h3>🤔 FAQ: &quot;Is this real money?&quot;</h3>
                <p style={{ maxWidth: 520, margin: '8px auto 0' }}>
                    Nope. This is a demo. The data is real, the scores are real,
                    the sarcasm is very real — but the payment buttons just sit there
                    looking pretty. Like a crypto influencer&apos;s portfolio screenshots.
                </p>
            </div>

            <LeadCaptureModal isOpen={showLeadModal} onClose={() => setShowLeadModal(false)} />
        </div>
    );
}
