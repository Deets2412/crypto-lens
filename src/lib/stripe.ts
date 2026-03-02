import Stripe from 'stripe';

export const stripe = new Stripe((process.env.STRIPE_SECRET_KEY || 'sk_test_123') as string, {
    apiVersion: '2026-01-28.clover', // Latest Stripe API Version
});
