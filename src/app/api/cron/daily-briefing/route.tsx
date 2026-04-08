import { NextResponse } from 'next/server';
import { fetchTopCoins, fetchNews, formatCurrency, formatPercentage } from '@/lib/api';
import { generateRecommendations, scoreSentiment } from '@/lib/scoring';
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

// ============================================================
// CoinDebrief — The Overnight Debrief (Email Template)
// Modelled on ASX Morning Brief structure, CoinDebrief brand voice
// ============================================================

function formatDate(): string {
    const d = new Date();
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${days[d.getUTCDay()]} ${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function OvernightDebrief({ recommendations, coins, news }: {
    recommendations: any[];
    coins: any[];
    news: any[];
}) {
    const totalMarketCap = coins.reduce((sum: number, c: any) => sum + (c.market_cap || 0), 0);
    const totalVolume = coins.reduce((sum: number, c: any) => sum + (c.total_volume || 0), 0);
    const btc = coins.find((c: any) => c.symbol === 'btc');
    const eth = coins.find((c: any) => c.symbol === 'eth');
    const sol = coins.find((c: any) => c.symbol === 'sol');
    const btcDominance = btc ? ((btc.market_cap / totalMarketCap) * 100).toFixed(1) : 'N/A';

    const topGainers = [...coins]
        .sort((a: any, b: any) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0))
        .slice(0, 5);

    const topLosers = [...coins]
        .sort((a: any, b: any) => (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0))
        .slice(0, 5);

    const bullishCount = news.filter((n: any) => {
        const scored = scoreSentiment(n);
        return scored.sentiment === 'Bullish';
    }).length;
    const bearishCount = news.filter((n: any) => {
        const scored = scoreSentiment(n);
        return scored.sentiment === 'Bearish';
    }).length;
    const neutralCount = news.length - bullishCount - bearishCount;

    // Market mood one-liner
    const btcChange = btc?.price_change_percentage_24h || 0;
    let moodLine = '';
    if (btcChange > 5) moodLine = 'Market is pumping. Your group chat is insufferable. Enjoy it while it lasts.';
    else if (btcChange > 2) moodLine = 'Green candles across the board. Not enough to retire on, but enough to feel smug at brunch.';
    else if (btcChange > 0) moodLine = 'Mildly green. The kind of day where nothing exciting happens but at least you\'re not losing money.';
    else if (btcChange > -2) moodLine = 'Slightly red. Nothing to panic about. Put the phone down. We mean it.';
    else if (btcChange > -5) moodLine = 'Red day. The "buy the dip" crowd has entered the chat. Proceed with caution and/or popcorn.';
    else moodLine = 'Bloodbath. If you\'re reading this, congratulations on not panic-selling. Or condolences if you did.';

    const top3 = recommendations.slice(0, 3);
    const rest7 = recommendations.slice(3, 10);

    return (
        <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#e2e8f0', backgroundColor: '#0f172a', maxWidth: '640px', margin: '0 auto' }}>

            {/* ── HEADER ── */}
            <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#1e293b', borderBottom: '3px solid #3b82f6' }}>
                <tbody><tr><td style={{ padding: '24px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8', letterSpacing: '2px', marginBottom: '8px' }}>THE OVERNIGHT DEBRIEF</div>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#ffffff' }}>☕ CoinDebrief</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', letterSpacing: '1px' }}>{formatDate()}</div>
                </td></tr></tbody>
            </table>

            {/* ── MOOD CHECK ── */}
            <table width="100%" cellPadding={0} cellSpacing={0}>
                <tbody><tr><td style={{ padding: '20px', backgroundColor: '#1a2744', borderLeft: '4px solid #3b82f6' }}>
                    <div style={{ fontSize: '11px', color: '#60a5fa', letterSpacing: '1.5px', marginBottom: '6px', fontWeight: 'bold' }}>MOOD CHECK</div>
                    <div style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.5', fontStyle: 'italic' }}>{moodLine}</div>
                </td></tr></tbody>
            </table>

            {/* ── OVERNIGHT SNAPSHOT ── */}
            <table width="100%" cellPadding={0} cellSpacing={0}>
                <tbody><tr><td style={{ padding: '20px 20px 8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#94a3b8', letterSpacing: '1.5px', marginBottom: '12px' }}>OVERNIGHT SNAPSHOT</div>
                </td></tr></tbody>
            </table>
            <table width="100%" cellPadding={0} cellSpacing={0} style={{ margin: '0 20px', maxWidth: '600px' }}>
                <tbody>
                    <tr style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '8px 0', fontSize: '13px', color: '#94a3b8' }}>Total Market Cap</td>
                        <td style={{ padding: '8px 0', fontSize: '13px', color: '#ffffff', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(totalMarketCap)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '8px 0', fontSize: '13px', color: '#94a3b8' }}>24h Volume</td>
                        <td style={{ padding: '8px 0', fontSize: '13px', color: '#ffffff', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(totalVolume)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '8px 0', fontSize: '13px', color: '#94a3b8' }}>BTC Dominance</td>
                        <td style={{ padding: '8px 0', fontSize: '13px', color: '#ffffff', textAlign: 'right', fontWeight: 'bold' }}>{btcDominance}%</td>
                    </tr>
                    {[
                        { name: 'BTC', data: btc },
                        { name: 'ETH', data: eth },
                        { name: 'SOL', data: sol },
                    ].map(({ name, data }) => (
                        <tr key={name} style={{ borderBottom: '1px solid #1e293b' }}>
                            <td style={{ padding: '8px 0', fontSize: '13px', color: '#94a3b8' }}>{name}</td>
                            <td style={{ padding: '8px 0', fontSize: '13px', textAlign: 'right' }}>
                                <span style={{ color: '#ffffff', fontWeight: 'bold' }}>${(data?.current_price || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                                <span style={{ color: (data?.price_change_percentage_24h || 0) >= 0 ? '#22c55e' : '#ef4444', marginLeft: '8px', fontSize: '12px' }}>
                                    {(data?.price_change_percentage_24h || 0) >= 0 ? '▲' : '▼'} {Math.abs(data?.price_change_percentage_24h || 0).toFixed(2)}%
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* ── SENTIMENT PULSE ── */}
            <table width="100%" cellPadding={0} cellSpacing={0}>
                <tbody><tr><td style={{ padding: '24px 20px 8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#94a3b8', letterSpacing: '1.5px', marginBottom: '12px' }}>NEWS SENTIMENT PULSE</div>
                </td></tr></tbody>
            </table>
            <table width="100%" cellPadding={0} cellSpacing={0} style={{ margin: '0 20px', maxWidth: '600px' }}>
                <tbody><tr>
                    <td style={{ textAlign: 'center', padding: '12px', backgroundColor: '#14532d', borderRadius: '6px 0 0 6px' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#22c55e' }}>{bullishCount}</div>
                        <div style={{ fontSize: '11px', color: '#86efac', letterSpacing: '1px' }}>BULLISH</div>
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px', backgroundColor: '#1e293b' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#94a3b8' }}>{neutralCount}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '1px' }}>NEUTRAL</div>
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px', backgroundColor: '#450a0a', borderRadius: '0 6px 6px 0' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ef4444' }}>{bearishCount}</div>
                        <div style={{ fontSize: '11px', color: '#fca5a5', letterSpacing: '1px' }}>BEARISH</div>
                    </td>
                </tr></tbody>
            </table>

            {/* ── TOP 3 SIGNALS ── */}
            <table width="100%" cellPadding={0} cellSpacing={0}>
                <tbody><tr><td style={{ padding: '24px 20px 8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#94a3b8', letterSpacing: '1.5px', marginBottom: '4px' }}>TODAY&apos;S TOP 3 PICKS</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>The ones we&apos;d actually look at if we weren&apos;t busy writing this email.</div>
                </td></tr></tbody>
            </table>
            {top3.map((rec: any, index: number) => {
                const change = rec.coin.price_change_percentage_24h || 0;
                const isUp = change >= 0;
                const borderColor = index === 0 ? '#f59e0b' : index === 1 ? '#94a3b8' : '#cd7f32';
                return (
                    <table key={rec.coin.id} width="100%" cellPadding={0} cellSpacing={0} style={{ margin: '8px 20px', maxWidth: '600px' }}>
                        <tbody><tr><td style={{ padding: '16px', backgroundColor: '#1e293b', borderRadius: '8px', borderLeft: `4px solid ${borderColor}` }}>
                            <table width="100%" cellPadding={0} cellSpacing={0}>
                                <tbody><tr>
                                    <td>
                                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff' }}>
                                            #{index + 1} — {rec.coin.name}
                                            <span style={{ color: '#64748b', fontWeight: 'normal', fontSize: '13px' }}> ({rec.coin.symbol.toUpperCase()})</span>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <span style={{ backgroundColor: rec.confidenceScore >= 80 ? '#14532d' : rec.confidenceScore >= 60 ? '#422006' : '#1e293b', color: rec.confidenceScore >= 80 ? '#22c55e' : rec.confidenceScore >= 60 ? '#f59e0b' : '#94a3b8', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                                            {rec.confidenceScore}% confidence
                                        </span>
                                    </td>
                                </tr></tbody>
                            </table>
                            <table width="100%" cellPadding={0} cellSpacing={0} style={{ marginTop: '10px' }}>
                                <tbody><tr>
                                    <td style={{ fontSize: '13px', color: '#94a3b8' }}>
                                        Price: <span style={{ color: '#ffffff', fontWeight: 'bold' }}>${(rec.coin.current_price || 0).toLocaleString('en-US', { maximumFractionDigits: 4 })}</span>
                                    </td>
                                    <td style={{ fontSize: '13px', textAlign: 'center' }}>
                                        <span style={{ color: isUp ? '#22c55e' : '#ef4444' }}>
                                            24h: {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'right' }}>
                                        Risk: <span style={{ color: rec.riskRating === 'Low' ? '#22c55e' : rec.riskRating === 'Medium' ? '#f59e0b' : '#ef4444', fontWeight: 'bold' }}>{rec.riskRating}</span>
                                    </td>
                                </tr></tbody>
                            </table>
                            <div style={{ marginTop: '10px', fontSize: '12px', color: '#94a3b8', lineHeight: '1.6' }}>
                                {rec.reasoning.map((reason: string, i: number) => (
                                    <div key={i}>→ {reason}</div>
                                ))}
                            </div>
                        </td></tr></tbody>
                    </table>
                );
            })}

            {/* ── REST OF TOP 10 ── */}
            <table width="100%" cellPadding={0} cellSpacing={0}>
                <tbody><tr><td style={{ padding: '24px 20px 8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#94a3b8', letterSpacing: '1.5px', marginBottom: '4px' }}>THE REST OF THE TOP 10</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Not bad enough to ignore, not exciting enough for the podium.</div>
                </td></tr></tbody>
            </table>
            <table width="100%" cellPadding={0} cellSpacing={0} style={{ margin: '0 20px', maxWidth: '600px' }}>
                <tbody>
                    {rest7.map((rec: any, index: number) => {
                        const change = rec.coin.price_change_percentage_24h || 0;
                        return (
                            <tr key={rec.coin.id} style={{ borderBottom: '1px solid #1e293b' }}>
                                <td style={{ padding: '8px 0', fontSize: '13px', color: '#64748b', width: '24px' }}>#{index + 4}</td>
                                <td style={{ padding: '8px 4px', fontSize: '13px', color: '#ffffff', fontWeight: 'bold' }}>{rec.coin.name} <span style={{ color: '#64748b', fontWeight: 'normal' }}>{rec.coin.symbol.toUpperCase()}</span></td>
                                <td style={{ padding: '8px 0', fontSize: '13px', color: '#ffffff', textAlign: 'right' }}>${(rec.coin.current_price || 0).toLocaleString('en-US', { maximumFractionDigits: 4 })}</td>
                                <td style={{ padding: '8px 0', fontSize: '12px', textAlign: 'right', color: change >= 0 ? '#22c55e' : '#ef4444', width: '70px' }}>{change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%</td>
                                <td style={{ padding: '8px 0', fontSize: '12px', textAlign: 'right', color: '#94a3b8', width: '40px' }}>{rec.confidenceScore}%</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* ── MOVERS & SHAKERS ── */}
            <table width="100%" cellPadding={0} cellSpacing={0}>
                <tbody><tr><td style={{ padding: '24px 20px 8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#94a3b8', letterSpacing: '1.5px', marginBottom: '4px' }}>MOVERS &amp; SHAKERS</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>The heroes and the victims of the last 24 hours.</div>
                </td></tr></tbody>
            </table>
            <table width="100%" cellPadding={0} cellSpacing={0} style={{ margin: '0 20px', maxWidth: '600px' }}>
                <tbody>
                    <tr><td colSpan={3} style={{ padding: '8px 0 4px', fontSize: '11px', color: '#22c55e', letterSpacing: '1px', fontWeight: 'bold' }}>TOP GAINERS</td></tr>
                    {topGainers.map((coin: any) => (
                        <tr key={coin.id} style={{ borderBottom: '1px solid #1e293b' }}>
                            <td style={{ padding: '6px 0', fontSize: '13px', color: '#ffffff' }}>{coin.name} <span style={{ color: '#64748b' }}>{coin.symbol.toUpperCase()}</span></td>
                            <td style={{ padding: '6px 0', fontSize: '13px', color: '#ffffff', textAlign: 'right' }}>${(coin.current_price || 0).toLocaleString('en-US', { maximumFractionDigits: 4 })}</td>
                            <td style={{ padding: '6px 0', fontSize: '13px', color: '#22c55e', textAlign: 'right', fontWeight: 'bold', width: '80px' }}>▲ {(coin.price_change_percentage_24h || 0).toFixed(2)}%</td>
                        </tr>
                    ))}
                    <tr><td colSpan={3} style={{ padding: '16px 0 4px', fontSize: '11px', color: '#ef4444', letterSpacing: '1px', fontWeight: 'bold' }}>TOP LOSERS</td></tr>
                    {topLosers.map((coin: any) => (
                        <tr key={coin.id} style={{ borderBottom: '1px solid #1e293b' }}>
                            <td style={{ padding: '6px 0', fontSize: '13px', color: '#ffffff' }}>{coin.name} <span style={{ color: '#64748b' }}>{coin.symbol.toUpperCase()}</span></td>
                            <td style={{ padding: '6px 0', fontSize: '13px', color: '#ffffff', textAlign: 'right' }}>${(coin.current_price || 0).toLocaleString('en-US', { maximumFractionDigits: 4 })}</td>
                            <td style={{ padding: '6px 0', fontSize: '13px', color: '#ef4444', textAlign: 'right', fontWeight: 'bold', width: '80px' }}>▼ {Math.abs(coin.price_change_percentage_24h || 0).toFixed(2)}%</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* ── FOOTER ── */}
            <table width="100%" cellPadding={0} cellSpacing={0}>
                <tbody><tr><td style={{ padding: '24px 20px', textAlign: 'center', borderTop: '1px solid #1e293b' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.6' }}>
                        You&apos;re receiving this because you&apos;re a premium subscriber to CoinDebrief.<br />
                        We did the doomscrolling so you didn&apos;t have to. You&apos;re welcome.<br /><br />
                        <span style={{ fontSize: '11px', color: '#475569' }}>
                            ⚠️ This is not financial advice. We&apos;re a website with opinions, not your financial planner.
                            Always DYOR before doing anything with your actual money.
                        </span>
                    </div>
                    <div style={{ marginTop: '12px', fontSize: '11px', color: '#334155' }}>
                        Data: CoinGecko &amp; CryptoCompare · Engine: CoinDebrief v2.0
                    </div>
                </td></tr></tbody>
            </table>
        </div>
    );
}

export async function GET(req: Request) {
    const supabase = getSupabase();
    const resend = getResend();
    try {
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

        if (error) {
            console.error('Failed to query premium users from Supabase', error);
            return new NextResponse('Database error fetching users', { status: 500 });
        }

        if (!users || users.length === 0) {
            return NextResponse.json({ message: 'No premium users found to email.' });
        }

        // 4. Send emails
        const bccList = users.map(u => u.email).filter(Boolean);

        if (!process.env.RESEND_API_KEY) {
            console.error('RESEND_API_KEY is missing');
            return new NextResponse('Missing Resend configuration', { status: 500 });
        }

        const data = await resend.emails.send({
            from: 'CoinDebrief <onboarding@resend.dev>',
            to: ['delivery@resend.dev'],
            bcc: bccList,
            subject: `☕ The Overnight Debrief — ${formatDate()}`,
            react: OvernightDebrief({ recommendations, coins, news }) as React.ReactElement,
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
