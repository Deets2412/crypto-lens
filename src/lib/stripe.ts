import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
    if (!_stripe) {
        _stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
            apiVersion: '2026-01-28.clover',
        });
    }
    return _stripe;
}

// Keep backward-compatible export for existing imports
export const stripe = new Proxy({} as Stripe, {
    get(_target, prop) {
        return (getStripe() as any)[prop];
    },
});
