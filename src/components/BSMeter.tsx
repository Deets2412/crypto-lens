'use client';

interface BSMeterProps {
    score: number; // 0-100
    label: string;
    variant: 'fluff' | 'wipeout';
    size?: number;
}

export default function BSMeter({ score, label, variant, size = 140 }: BSMeterProps) {
    const radius = (size - 20) / 2;
    const centerX = size / 2;
    const centerY = size / 2 + 10;

    // Semi-circle arc (180 degrees)
    const circumference = Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    // Color based on score
    const getColor = (s: number) => {
        if (variant === 'fluff') {
            if (s < 25) return '#10b981';
            if (s < 50) return '#3b82f6';
            if (s < 70) return '#f59e0b';
            return '#ef4444';
        } else {
            if (s < 20) return '#10b981';
            if (s < 40) return '#06b6d4';
            if (s < 60) return '#f59e0b';
            if (s < 80) return '#f97316';
            return '#ef4444';
        }
    };

    const color = getColor(score);

    // Arc path for semi-circle
    const startAngle = Math.PI;
    const endAngle = 0;
    const startX = centerX + radius * Math.cos(startAngle);
    const startY = centerY + radius * Math.sin(startAngle);
    const endX = centerX + radius * Math.cos(endAngle);
    const endY = centerY + radius * Math.sin(endAngle);
    const arcPath = `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`;

    // Needle angle (180° for 0%, 0° for 100%)
    const needleAngle = Math.PI - (score / 100) * Math.PI;
    const needleLen = radius - 12;
    const needleX = centerX + needleLen * Math.cos(needleAngle);
    const needleY = centerY - needleLen * Math.sin(needleAngle);

    return (
        <div className={`bs-meter bs-meter--${variant}`} style={{ width: size, height: size * 0.7 }}>
            <svg width={size} height={size * 0.75} viewBox={`0 0 ${size} ${size * 0.75}`}>
                {/* Background arc */}
                <path
                    d={arcPath}
                    fill="none"
                    stroke="rgba(148,163,184,0.12)"
                    strokeWidth={10}
                    strokeLinecap="round"
                />
                {/* Filled arc */}
                <path
                    d={arcPath}
                    fill="none"
                    stroke={color}
                    strokeWidth={10}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{
                        transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        filter: `drop-shadow(0 0 8px ${color}60)`,
                    }}
                />
                {/* Needle */}
                <line
                    x1={centerX}
                    y1={centerY}
                    x2={needleX}
                    y2={needleY}
                    stroke={color}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    style={{
                        transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        filter: `drop-shadow(0 0 4px ${color}80)`,
                    }}
                />
                {/* Center dot */}
                <circle cx={centerX} cy={centerY} r={4} fill={color} />
            </svg>
            <div className="bs-meter-labels">
                <span className="bs-meter-score" style={{ color }}>{score}</span>
                <span className="bs-meter-label">{label}</span>
                <span className="bs-meter-type">
                    {variant === 'fluff' ? '🏛️ Corporate Fluff' : '💀 Wipeout Risk'}
                </span>
            </div>
        </div>
    );
}
