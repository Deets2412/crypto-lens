import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Use service role client for webhook (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const tier = session.metadata?.tier as string;
        const subscriptionId = session.subscription as string;

        if (userId && tier && subscriptionId) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);

          await supabaseAdmin.from('subscriptions').upsert({
            user_id: userId,
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: session.customer as string,
            tier: tier,
            status: subscription.status === 'trialing' ? 'active' : subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          }, {
            onConflict: 'user_id',
          });

          // Update profile tier
          await supabaseAdmin.from('profiles').update({
            tier: tier,
          }).eq('id', userId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        if (userId) {
          const isActive = ['active', 'trialing'].includes(subscription.status);

          await supabaseAdmin.from('subscriptions').upsert({
            user_id: userId,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer as string,
            tier: subscription.metadata?.tier || 'normie',
            status: isActive ? 'active' : subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          }, {
            onConflict: 'user_id',
          });

          // If subscription is no longer active, revert to normie
          if (!isActive) {
            await supabaseAdmin.from('profiles').update({
              tier: 'normie',
            }).eq('id', userId);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        if (userId) {
          await supabaseAdmin.from('subscriptions').update({
            status: 'canceled',
          }).eq('user_id', userId);

          await supabaseAdmin.from('profiles').update({
            tier: 'normie',
          }).eq('id', userId);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = subscription.metadata?.supabase_user_id;

          if (userId) {
            await supabaseAdmin.from('subscriptions').update({
              status: 'past_due',
            }).eq('user_id', userId);
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
