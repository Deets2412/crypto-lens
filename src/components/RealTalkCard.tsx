'use client';

import { RealTalkData, CoinCategory } from '@/lib/types';

interface RealTalkCardProps {
    data: RealTalkData;
    category: CoinCategory;
    coinName: string;
}

export default function RealTalkCard({ data, category, coinName }: RealTalkCardProps) {
    return (
        <div className="real-talk-card">
            {/* Official Side */}
            <div className="real-talk-panel real-talk-official">
                <div className="real-talk-header">
                    <span className="real-talk-icon">🏢</span>
                    <span className="real-talk-title">The Official Version</span>
                </div>
                <p className="real-talk-text real-talk-text--official">
                    {data.officialDescription}
                </p>
                <div className="real-talk-source">
                    — {coinName} Marketing Department, probably
                </div>
            </div>

            {/* Divider */}
            <div className="real-talk-divider">
                <span className="real-talk-vs">VS</span>
            </div>

            {/* Real Talk Side */}
            <div className={`real-talk-panel real-talk-honest real-talk-honest--${category}`}>
                <div className="real-talk-header">
                    <span className="real-talk-icon">
                        {category === 'blue-chip' ? '🧐' : '🎰'}
                    </span>
                    <span className="real-talk-title">
                        {category === 'blue-chip' ? 'The Clinical Take' : 'Real Talk (2am Edition)'}
                    </span>
                </div>
                <p className="real-talk-text real-talk-text--honest">
                    {data.realTalk}
                </p>
                <div className="real-talk-source">
                    — A guy who&apos;s been doing this too long
                </div>
            </div>
        </div>
    );
}
