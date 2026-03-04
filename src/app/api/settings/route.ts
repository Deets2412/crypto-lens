// ============================================================
// CoinDebrief V2 — Email Preferences API
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// GET /api/settings — fetch user's email preferences
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: preferences, error } = await supabase
      .from('email_preferences')
      .select('daily_briefing, briefing_time, include_portfolio')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = row not found, which is fine (we return defaults)
      console.error('Failed to fetch preferences:', error);
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }

    return NextResponse.json({
      preferences: preferences || {
        daily_briefing: true,
        briefing_time: '06:00',
        include_portfolio: true,
      },
    });
  } catch (err) {
    console.error('Settings GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/settings — update user's email preferences
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { daily_briefing, briefing_time, include_portfolio } = body;

    const { data, error } = await supabase
      .from('email_preferences')
      .upsert(
        {
          user_id: user.id,
          daily_briefing: daily_briefing ?? true,
          briefing_time: briefing_time ?? '06:00',
          include_portfolio: include_portfolio ?? true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Failed to update preferences:', error);
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    return NextResponse.json({ preferences: data });
  } catch (err) {
    console.error('Settings POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
