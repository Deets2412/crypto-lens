'use client';

import { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth, UserTier } from '@/lib/auth';

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
    requiredTier: UserTier;
    featureName?: string;
}

export function BlurOverlay({ children, requiredTier, featureName = 'This feature' }: BlurOverlayProps) {
    const { hasAccess, user } = useAuth();
    const router = useRouter();

    const tierLabels: Record<UserTier, string> = {
        normie: 'Normie',
        night_owl: 'Night Owl',
        coin_sense: 'Coin Sense',
    };

    if (hasAccess(requiredTier)) {
        return <>{children}</>;
    }

    const handleUpgrade = () => {
        if (!user) {
            router.push('/signup?tier=' + requiredTier);
        } else {
            router.push('/pricing');
        }
    };

    return (
        <div className="blur-overlay-wrapper">
            <div className="blur-overlay-content">
                {children}
            </div>
            <div className="blur-overlay">
                <div className="blur-overlay-cta">
                    <Lock size={32} />
                    <h3>{tierLabels[requiredTier]}+ Required</h3>
                    <p>{featureName} requires a {tierLabels[requiredTier]} subscription or higher.</p>
                    <button className="blur-overlay-button" onClick={handleUpgrade}>
                        {user ? `Upgrade to ${tierLabels[requiredTier]}` : 'Sign Up Now'}
                    </button>
                </div>
            </div>
        </div>
    );
}
