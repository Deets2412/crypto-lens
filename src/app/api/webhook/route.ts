import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
    try {
        const body = await req.text();
        const signature = req.headers.get('stripe-signature');

        if (!signature || !webhookSecret) {
            return new NextResponse('Webhook Missing Secret or Signature', { status: 400 });
        }

        let event;
        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err: any) {
            console.error(`Webhook signature verification failed.`, err.message);
            return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
        }

        // Handle the event
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as any;

            const supabaseUserId = session.metadata?.supabase_uuid;
            const newTier = session.metadata?.tier;

            if (supabaseUserId && newTier) {
                // Update the user's tier in our database
                const { error } = await supabase
                    .from('users')
                    .update({
                        tier: newTier,
                        subscription_status: 'active'
                    })
                    .eq('id', supabaseUserId);

                if (error) {
                    console.error('Error updating user tier after successful payment:', error);
                } else {
                    console.log(`Successfully upgraded user ${supabaseUserId} to ${newTier}`);
                }
            }
        }

        if (event.type === 'customer.subscription.deleted') {
            const subscription = event.data.object as any;
            const stripeCustomerId = subscription.customer;

            // Downgrade user back to normie if their subscription cancels
            await supabase
                .from('users')
                .update({
                    tier: 'normie',
                    subscription_status: 'canceled'
                })
                .eq('stripe_customer_id', stripeCustomerId);
        }

        return new NextResponse('ok', { status: 200 });
    } catch (err: any) {
        console.error('Webhook Error:', err);
        return new NextResponse(`Internal Server Error: ${err.message}`, { status: 500 });
    }
}
