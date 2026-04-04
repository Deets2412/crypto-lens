'use client';

interface ConfidenceGaugeProps {
    value: number; // 0-100
    size?: number;
}

export default function ConfidenceGauge({ value, size = 100 }: ConfidenceGaugeProps) {
    const radius = (size - 16) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    const getColor = (v: number) => {
        if (v >= 75) return '#10b981';
        if (v >= 50) return '#3b82f6';
        if (v >= 25) return '#f59e0b';
        return '#ef4444';
    };

    const color = getColor(value);

    return (
        <div className="confidence-gauge" style={{ width: size, height: size }}>
            <svg width={size} height={size}>
                <circle
                    className="confidence-gauge-bg"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                />
                <circle
                    className="confidence-gauge-fill"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                />
            </svg>
            <div className="confidence-gauge-label">
                <span className="confidence-value" style={{ color }}>
                    {value}
                </span>
                <span className="confidence-text">Score</span>
            </div>
        </div>
    );
}
