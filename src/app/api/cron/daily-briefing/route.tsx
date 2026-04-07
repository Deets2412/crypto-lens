import { NextResponse } from 'next/server';
import { fetchTopCoins, fetchNews } from '@/lib/api';
import { generateRecommendations } from '@/lib/scoring';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import * as React from 'react';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

function getResend() {
    return new Resend(process.env.RESEND_API_KEY!);
}

// A simple React component to format the email template
function DailyBriefingEmail({ recommendations }: { recommendations: any[] }) {
    return (
        <div style={{ fontFamily: 'sans-serif', color: '#111827', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            <h1 style={{ color: '#2563eb', marginBottom: '20px' }}>☕ The Morning Debrief</h1>
            <p style={{ fontSize: '16px', lineHeight: '1.5' }}>
                Good morning! Here is your daily analysis of the top crypto movers, straight from the CoinDebrief engine.
            </p>
            <hr style={{ border: '1px solid #e5e7eb', margin: '30px 0' }} />
            <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>Top 10 Recommendations</h2>
            {recommendations.slice(0, 10).map((rec, index) => (
                <div key={rec.coin.id} style={{ marginBottom: '24px', padding: '15px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>
                        #{index + 1} - {rec.coin.name} ({rec.coin.symbol.toUpperCase()})
                    </h3>
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '10px', fontSize: '14px' }}>
                        <span style={{ fontWeight: 'bold' }}>Price: ${(rec.coin.current_price || 0).toFixed(4)}</span>
                        <span style={{ color: (rec.coin.price_change_percentage_24h || 0) >= 0 ? 'green' : 'red' }}>
                            24h: {(rec.coin.price_change_percentage_24h || 0).toFixed(2)}%
                        </span>
                        <span>Confidence: {rec.confidenceScore}%</span>
                    </div>
                    <div>
                        <strong>Why we flagged it:</strong>
                        <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px', fontSize: '14px' }}>
                            {rec.reasoning.map((reason: string, i: number) => (
                                <li key={i}>{reason}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            ))}
            <hr style={{ border: '1px solid #e5e7eb', margin: '30px 0' }} />
            <p style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
                You are receiving this because you are a premium subscriber to CoinDebrief.<br />
                Stay sharp out there.
            </p>
        </div>
    );
}

export async function GET(req: Request) {
    const supabase = getSupabase();
    const resend = getResend();
    try {
        // Optional: Verify cron secret if triggered by Vercel
        const authHeader = req.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse('Unauthorized access to cron endpoint', { status: 401 });
        }

        // 1. Fetch market data
        const coins = await fetchTopCoins(100);
        const news = await fetchNews(50);

        if (!coins.length) {
            return new NextResponse('Failed to fetch market data', { status: 500 });
        }

        // 2. Generate recommendations 
        const recommendations = generateRecommendations(coins, news);

        // 3. Query premium users
        const { data: users, error } = await supabase
            .from('users')
            .select('email, tier')
            .in('tier', ['night_owl', 'coin_sense']);
        // In a real app we'd also check subscription_status = 'active', 
        // but for testing we'll just email anyone with the tier.

        if (error) {
            console.error('Failed to query premium users from Supabase', error);
            return new NextResponse('Database error fetching users', { status: 500 });
        }

        if (!users || users.length === 0) {
            return NextResponse.json({ message: 'No premium users found to email.' });
        }

        // 4. Send emails using Resend and React Email component
        // Resend's batch sending API is preferred, but for simplicity we will map it
        const bccList = users.map(u => u.email).filter(Boolean);

        if (!process.env.RESEND_API_KEY) {
            console.error('RESEND_API_KEY is missing');
            return new NextResponse('Missing Resend configuration', { status: 500 });
        }

        const data = await resend.emails.send({
            from: 'CoinDebrief <onboarding@resend.dev>', // Free tier Resend accounts must use this verified domain
            to: ['delivery@resend.dev'], // Must send "to" a dummy for bcc or "to" yourself on free tier
            bcc: bccList,
            subject: '☕ Your CoinDebrief Daily Intelligence',
            react: DailyBriefingEmail({ recommendations }) as React.ReactElement,
        });

        return NextResponse.json({
            success: true,
            emailsDispatched: bccList.length,
            resendId: data?.data?.id
        });

    } catch (err: any) {
        console.error('Job Error:', err);
        return new NextResponse(`Internal Server Error: ${err.message}`, { status: 500 });
    }
}
