'use client';

interface ToggleGroupProps {
    options: number[];
    value: number;
    onChange: (val: number) => void;
    prefix?: string;
}

export default function ToggleGroup({ options, value, onChange, prefix = 'Top' }: ToggleGroupProps) {
    return (
        <div className="toggle-group">
            {options.map((opt) => (
                <button
                    key={opt}
                    className={`toggle-group-btn ${value === opt ? 'active' : ''}`}
                    onClick={() => onChange(opt)}
                >
                    {prefix} {opt}
                </button>
            ))}
        </div>
    );
}
