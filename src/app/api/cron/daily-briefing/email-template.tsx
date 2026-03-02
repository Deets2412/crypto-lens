import * as React from 'react';
import { SummarizedArticle } from '@/lib/types';

export function DailyBriefingEmail({ articles }: { articles: SummarizedArticle[] }) {
    return (
        <div style={{ fontFamily: 'sans-serif', color: '#111827', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            <h1 style={{ color: '#2563eb', marginBottom: '20px' }}>☕ Your Morning AI Debrief </h1>
            <p style={{ fontSize: '18px', lineHeight: '1.6' }}>
                Good morning! Here is your daily summary of the most important Artificial Intelligence news, explained simply so you understand exactly how the world is changing today.
            </p>
            <hr style={{ border: '1px solid #e5e7eb', margin: '30px 0' }} />

            <h2 style={{ fontSize: '22px', marginBottom: '20px' }}> Top Stories </h2>
            {articles.length === 0 ? (
                <p>No major updates today. Enjoy your coffee! </p>
            ) : (
                articles.map((article, index) => (
                    <div key={article.id} style={{ marginBottom: '32px', padding: '20px', border: '1px solid #e5e7eb', borderRadius: '12px', backgroundColor: '#f9fafb' }}>
                        <h3 style={{ margin: '0 0 15px 0', fontSize: '20px', color: '#1f2937' }}>
                            {index + 1}. {article.title}
                        </h3>
                        <p style={{ fontSize: '16px', lineHeight: '1.6', margin: '0 0 15px 0' }}>
                            {article.plainEnglishSummary}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#6b7280' }}>
                            <span><strong>Source: </strong> {article.source}</span>
                            <a href={article.url} style={{ color: '#3b82f6', textDecoration: 'none' }}> Read full article &rarr; </a>
                        </div>
                    </div>
                ))
            )}

            <hr style={{ border: '1px solid #e5e7eb', margin: '30px 0' }} />
            <p style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center', lineHeight: '1.5' }}>
                You are receiving this safe, spam-free briefing because you are subscribed to AI Debrief.<br />
                Stay informed and stay safe.
            </p>
        </div>
    );
}
