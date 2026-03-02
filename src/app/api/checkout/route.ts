import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy';
// Use the service role key so this backend route has full DB access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
    try {
        const { tierId, email, userId } = await req.json();

        // Safety checks
        if (!tierId || !email || !userId) {
            return new NextResponse('Missing required parameters', { status: 400 });
        }

        let priceId = '';
        if (tierId === 'night_owl') priceId = process.env.NEXT_PUBLIC_STRIPE_NIGHT_OWL_PRICE_ID!;
        if (tierId === 'coin_sense') priceId = process.env.NEXT_PUBLIC_STRIPE_COIN_SENSE_PRICE_ID!;

        if (!priceId) {
            return new NextResponse('Invalid tier configuration server-side', { status: 500 });
        }

        // Determine the domain for success/cancel redirects
        const domainUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';

        // 1. Check if user already has a Stripe Customer ID in Supabase
        const { data: dbUser, error } = await supabase
            .from('users')
            .select('stripe_customer_id')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Supabase DB error finding user:', error);
            return new NextResponse('Database error', { status: 500 });
        }

        let stripeCustomerId = dbUser?.stripe_customer_id;

        // 2. If no Stripe Customer exists yet, create one
        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email,
                metadata: {
                    supabase_uuid: userId,
                },
            });
            stripeCustomerId = customer.id;

            // Save the new Stripe customer ID back to Supabase
            await supabase
                .from('users')
                .update({ stripe_customer_id: stripeCustomerId })
                .eq('id', userId);
        }

        // 3. Create the Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${domainUrl}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${domainUrl}/pricing?canceled=true`,
            metadata: {
                supabase_uuid: userId,
                tier: tierId, // passing 'night_owl' or 'coin_sense' through to the webhook
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (err: any) {
        console.error('Stripe Checkout Error:', err);
        return new NextResponse(`Internal Server Error: ${err.message}`, { status: 500 });
    }
}
