import { NextResponse } from 'next/server';
import { fetchAINews } from '@/lib/api';
import { filterArticles, summarizeArticles } from '@/lib/summarize';

export async function GET() {
    try {
        console.log("TEST ROUTE: Fetching AI News...");
        const rawNews = await fetchAINews(10); // small batch for testing

        if (!rawNews.length) {
            return new NextResponse('Failed to fetch news data', { status: 500 });
        }

        console.log(`TEST ROUTE: Fetched ${rawNews.length} articles. Filtering...`);
        const filteredNews = await filterArticles(rawNews);
        const passedCount = filteredNews.filter(n => n.passedFilter).length;

        console.log(`TEST ROUTE: Filtered down to ${passedCount} high-quality articles. Summarizing...`);
        // Just summarize top 2 for a quick test
        const toSummarize = filteredNews.filter(n => n.passedFilter).slice(0, 2);
        const summarizedArticles = await summarizeArticles(toSummarize);

        return NextResponse.json({
            success: true,
            articles: summarizedArticles,
            rawCount: rawNews.length,
            passedCount: passedCount
        });

    } catch (err: any) {
        console.error('Test Job Error:', err);
        return new NextResponse(`Internal Server Error: ${err.message}`, { status: 500 });
    }
}
