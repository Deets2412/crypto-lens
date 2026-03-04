// ============================================================
// CoinDebrief V2 — Portfolio API (CRUD for holdings)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// GET /api/portfolio — fetch user's holdings
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: holdings, error } = await supabase
      .from('portfolio_holdings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch holdings:', error);
      return NextResponse.json({ error: 'Failed to fetch holdings' }, { status: 500 });
    }

    return NextResponse.json({ holdings: holdings || [] });
  } catch (err) {
    console.error('Portfolio GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/portfolio — add or update a holding
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { coinId, symbol, name, amount, buyPrice } = body;

    // Validate
    if (!coinId || !symbol || !name || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
    }

    if (buyPrice === undefined || buyPrice < 0) {
      return NextResponse.json({ error: 'Invalid buy price' }, { status: 400 });
    }

    // Upsert (one entry per coin per user)
    const { data, error } = await supabase
      .from('portfolio_holdings')
      .upsert(
        {
          user_id: user.id,
          coin_id: coinId,
          symbol: symbol.toUpperCase(),
          name,
          amount,
          buy_price: buyPrice,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,coin_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Failed to upsert holding:', error);
      return NextResponse.json({ error: 'Failed to save holding' }, { status: 500 });
    }

    return NextResponse.json({ holding: data });
  } catch (err) {
    console.error('Portfolio POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/portfolio — remove a holding
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const holdingId = searchParams.get('id');

    if (!holdingId) {
      return NextResponse.json({ error: 'Missing holding ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('portfolio_holdings')
      .delete()
      .eq('id', holdingId)
      .eq('user_id', user.id); // Ensure user owns this holding

    if (error) {
      console.error('Failed to delete holding:', error);
      return NextResponse.json({ error: 'Failed to delete holding' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Portfolio DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
