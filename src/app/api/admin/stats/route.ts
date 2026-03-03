// ============================================================
// CoinDebrief V2 — Admin Stats API (admin-only)
// ============================================================

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch stats using the user's supabase client
    // Note: admin needs SELECT access to profiles, subscriptions, leads
    // You may want to use service role for this, but for now we use RLS + admin check

    // Total users — count profiles
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Tier breakdown
    const { data: profiles } = await supabase
      .from('profiles')
      .select('tier');

    const tierBreakdown = { normie: 0, night_owl: 0, coin_sense: 0 };
    (profiles || []).forEach((p) => {
      if (p.tier in tierBreakdown) {
        tierBreakdown[p.tier as keyof typeof tierBreakdown]++;
      }
    });

    // Active subscriptions
    const { count: activeSubscriptions } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Total leads
    const { count: totalLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });

    // Recent users (last 50)
    const { data: recentUsers } = await supabase
      .from('profiles')
      .select('id, email, tier, role, created_at, stripe_customer_id')
      .order('created_at', { ascending: false })
      .limit(50);

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      tierBreakdown,
      activeSubscriptions: activeSubscriptions || 0,
      totalLeads: totalLeads || 0,
      recentUsers: recentUsers || [],
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
