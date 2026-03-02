// ============================================================
// AI Debrief — API Layer
// ============================================================

import Parser from 'rss-parser';
import { NewsArticle } from './types';

const parser = new Parser({
    customFields: {
        item: [
            ['media:content', 'mediaContent', { keepArray: false }],
            ['content:encoded', 'contentEncoded']
        ]
    }
});

const RSS_FEEDS = [
    { name: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/' }, // Might need filtering for AI
    { name: 'Wired - AI', url: 'https://www.wired.com/feed/category/business/latest/rss' }, // Wired business/tech
    { name: 'TechCrunch - AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
    // A robust AI specific feed:
    { name: 'Artificial Intelligence News', url: 'https://www.artificialintelligence-news.com/feed/' }
];

export async function fetchAINews(limit: number = 20): Promise<NewsArticle[]> {
    const allArticles: NewsArticle[] = [];

    for (const feed of RSS_FEEDS) {
        try {
            console.log(`Fetching from ${feed.name}...`);
            const parsed = await parser.parseURL(feed.url);

            for (const item of parsed.items || []) {
                // Ensure it's somewhat recent (within last 48 hours for a daily briefing)
                const pubDate = new Date(item.isoDate || item.pubDate || Date.now());
                const now = new Date();
                const diffHours = (now.getTime() - pubDate.getTime()) / (1000 * 60 * 60);

                if (diffHours < 48) {
                    allArticles.push({
                        id: item.guid || item.link || String(Date.now()),
                        title: item.title || '',
                        body: item.contentSnippet || item.content || '',
                        url: item.link || '',
                        // Try to extract image if available (basic approach)
                        imageurl: (item as any).mediaContent?.$?.url || '',
                        source: feed.name,
                        published_on: Math.floor(pubDate.getTime() / 1000),
                    });
                }
            }
        } catch (err) {
            console.error(`Failed to fetch from ${feed.name}:`, err);
        }
    }

    // Sort by newest first
    allArticles.sort((a, b) => b.published_on - a.published_on);

    return allArticles.slice(0, limit);
}
