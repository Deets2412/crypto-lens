'use client';

import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface SparklineChartProps {
    data: number[];
    color?: string;
    height?: number;
}

export default function SparklineChart({
    data,
    color,
    height = 40,
}: SparklineChartProps) {
    if (!data || data.length === 0) return null;

    const isPositive = data[data.length - 1] >= data[0];
    const strokeColor = color || (isPositive ? '#10b981' : '#ef4444');

    const chartData = data.map((price, index) => ({ index, price }));

    return (
        <div className="sparkline-container" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <Line
                        type="monotone"
                        dataKey="price"
                        stroke={strokeColor}
                        strokeWidth={1.5}
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
