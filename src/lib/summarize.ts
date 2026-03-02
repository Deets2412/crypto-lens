// ============================================================
// AI Debrief — Summarization Engine (OpenAI)
// ============================================================

import OpenAI from 'openai';
import { NewsArticle, FilteredArticle, SummarizedArticle } from './types';

// Create OpenAI client (Requires OPENAI_API_KEY in environment)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'dummy_key' });

/**
 * Step 1: Filter out spam/clickbait/low-quality articles.
 * We send a batch to save tokens and time. 
 */
export async function filterArticles(articles: NewsArticle[]): Promise<FilteredArticle[]> {
    if (articles.length === 0) return [];

    const prompt = `
    You are an expert news editor for an AI newsletter. 
    Review the following list of news articles and determine if they are substantive, high-quality AI news, OR if they are clickbait, spam, overly promotional, or low-quality.

    Articles to review:
    ${articles.map((a, i) => `[ID: ${a.id}] Title: "${a.title}"\nContent Snippet: ${a.body.substring(0, 300)}...`).join('\n\n')}

    Output a JSON array of objects with fields:
    - id: The article ID string
    - passedFilter: Boolean (true if high-quality AI news, false if clickbait/spam/irrelevant)
    - filterReason: A short string explaining why (optional if true)
    
    Ensure the output is strictly valid JSON without markdown wrapping. Give back an array.
    `;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini', // Faster, cheaper model for filtering
            messages: [{ role: 'system', content: prompt }],
            response_format: { type: 'json_object' } // Enforce JSON
        });

        const rawContent = response.choices[0].message.content || '{"results": []}';
        let resultsList: any[] = [];

        try {
            const parsed = JSON.parse(rawContent);
            resultsList = parsed.results || parsed || [];
            if (!Array.isArray(resultsList)) {
                // Try to extract array if it was wrapped differently
                resultsList = Object.values(parsed).find(Array.isArray) as any[] || [];
            }
        } catch (e) {
            console.error("Failed to parse JSON from OpenAI filter", e);
        }

        const filteredDict = Object.fromEntries(resultsList.map(r => [r.id, r]));

        return articles.map(article => ({
            ...article,
            passedFilter: filteredDict[article.id]?.passedFilter ?? true, // Default to true if missing
            filterReason: filteredDict[article.id]?.filterReason,
        }));
    } catch (err) {
        console.error("Error during filtering:", err);
        // Fallback: pass all if API fails
        return articles.map(a => ({ ...a, passedFilter: true }));
    }
}

/**
 * Step 2: Summarize the high-quality articles for a 70-year-old audience.
 */
export async function summarizeArticles(articles: FilteredArticle[]): Promise<SummarizedArticle[]> {
    // Only summarize ones that passed
    const toSummarize = articles.filter(a => a.passedFilter);
    const results: SummarizedArticle[] = [];

    // Process in parallel, but with a concurrency limit if there are many. 
    // For now, assume a small handful (e.g. top 5-10) after filtering.
    const topArticles = toSummarize.slice(0, 10);

    for (const article of topArticles) {
        const prompt = `
            Take the following news article snippet and write a 3-4 sentence summary of it in plain English.
            
            Your target audience is a 70-year-old grandfather who does not understand computer science or technical jargon. 
            Explain what happened simply, and explain WHY it matters to their daily life or the future (e.g., healthcare, avoiding scams, making things easier). Use a warm, informative tone.

            Title: ${article.title}
            Content: ${article.body}
         `;

        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o', // Use a stronger model for tone and summarization
                messages: [{ role: 'system', content: prompt }]
            });

            results.push({
                ...article,
                plainEnglishSummary: response.choices[0].message.content?.trim() || 'Summary could not be generated.'
            });
        } catch (err) {
            console.error(`Error summarizing article ${article.id}:`, err);
            // Provide a simple fallback
            results.push({
                ...article,
                plainEnglishSummary: article.body.substring(0, 200) + '...'
            });
        }
    }

    return results;
}
