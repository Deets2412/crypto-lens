'use client';

import { ReactNode } from 'react';
import { Lock } from 'lucide-react';

interface TierBadgeProps {
    tier: 'pro' | 'institutional';
}

export function TierBadge({ tier }: TierBadgeProps) {
    return (
        <span className={`tier-badge tier-badge--${tier}`}>
            <Lock size={10} />
            {tier === 'pro' ? '💡' : 'INST'}
        </span>
    );
}

interface BlurOverlayProps {
    children: ReactNode;
    isLocked: boolean;
    ctaText?: string;
    onUpgrade?: () => void;
}

export function BlurOverlay({ children, isLocked, ctaText = 'Upgrade to Pro', onUpgrade }: BlurOverlayProps) {
    if (!isLocked) return <>{children}</>;

    return (
        <div className="blur-overlay-wrapper">
            <div className="blur-overlay-content">
                {children}
            </div>
            <div className="blur-overlay">
                <div className="blur-overlay-cta">
                    <Lock size={32} />
                    <h3>Premium Feature</h3>
                    <p>This content requires a Pro or Institutional subscription.</p>
                    <button className="blur-overlay-button" onClick={onUpgrade}>
                        {ctaText}
                    </button>
                </div>
            </div>
        </div>
    );
}
