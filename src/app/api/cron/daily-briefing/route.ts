import { NextResponse } from 'next/server';
import { fetchAINews } from '@/lib/api';
import { filterArticles, summarizeArticles } from '@/lib/summarize';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import * as React from 'react';
import { SummarizedArticle } from '@/lib/types';

// Setup Supabase (Service Role for full DB access)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Setup Resend
const resendApiKey = process.env.RESEND_API_KEY || 'dummy';
const resend = new Resend(resendApiKey);

import { DailyBriefingEmail } from './email-template'; export async function GET(req: Request) {
    try {
        // Optional: Verify cron secret if triggered by Vercel
        const authHeader = req.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse('Unauthorized access to cron endpoint', { status: 401 });
        }

        console.log("Fetching AI News...");
        // 1. Fetch raw news
        const rawNews = await fetchAINews(30);

        if (!rawNews.length) {
            console.log("No news fetched.");
            return new NextResponse('Failed to fetch news data', { status: 500 });
        }

        console.log(`Fetched ${rawNews.length} articles. Filtering...`);
        // 2. Filter out spam/clickbait
        const filteredNews = await filterArticles(rawNews);
        const passedCount = filteredNews.filter(n => n.passedFilter).length;

        console.log(`Filtered down to ${passedCount} high-quality articles. Summarizing...`);
        // 3. Summarize the good ones
        const summarizedArticles = await summarizeArticles(filteredNews);

        // 4. Query premium users
        const { data: users, error } = await supabase
            .from('users')
            .select('email, tier')
            .in('tier', ['night_owl', 'coin_sense', 'pro', 'premium']); // Adjusted for potential new tiers

        if (error) {
            console.error('Failed to query premium users from Supabase', error);
            return new NextResponse('Database error fetching users', { status: 500 });
        }

        if (!users || users.length === 0) {
            return NextResponse.json({ message: 'No premium users found to email. Dry run successful.', compiledArticles: summarizedArticles.length });
        }

        // 5. Send emails
        const bccList = users.map(u => u.email).filter(Boolean);

        if (!resendApiKey) {
            console.error('RESEND_API_KEY is missing');
            return new NextResponse('Missing Resend configuration', { status: 500 });
        }

        const data = await resend.emails.send({
            from: 'AI Debrief <onboarding@resend.dev>',
            to: ['delivery@resend.dev'],
            bcc: bccList,
            subject: '☕ Your Morning AI Debrief',
            react: DailyBriefingEmail({ articles: summarizedArticles }) as React.ReactElement,
        });

        return NextResponse.json({
            success: true,
            emailsDispatched: bccList.length,
            articlesIncluded: summarizedArticles.length,
            resendId: data?.data?.id
        });

    } catch (err: any) {
        console.error('Job Error:', err);
        return new NextResponse(`Internal Server Error: ${err.message}`, { status: 500 });
    }
}
