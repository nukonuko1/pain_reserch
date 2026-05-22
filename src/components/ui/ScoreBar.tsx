interface ScoreBarProps {
  label: string;
  value: number;  // 1-5
  max?: number;
}

function scoreColor(value: number, max: number): string {
  const ratio = value / max;
  if (ratio >= 0.8) return 'bg-green-500';
  if (ratio >= 0.6) return 'bg-blue-500';
  if (ratio >= 0.4) return 'bg-yellow-500';
  return 'bg-red-400';
}

export function ScoreBar({ label, value, max = 5 }: ScoreBarProps) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-28 text-gray-500 truncate shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all ${scoreColor(value, max)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-right font-medium text-gray-700">{value}</span>
    </div>
  );
}

interface TotalScoreBadgeProps {
  score: number;  // 0-100
  size?: 'sm' | 'lg';
}

export function TotalScoreBadge({ score, size = 'sm' }: TotalScoreBadgeProps) {
  const color =
    score >= 75 ? 'text-green-700 bg-green-50 ring-green-200' :
    score >= 55 ? 'text-blue-700 bg-blue-50 ring-blue-200' :
    score >= 35 ? 'text-yellow-700 bg-yellow-50 ring-yellow-200' :
    'text-gray-600 bg-gray-50 ring-gray-200';

  const sizeClass = size === 'lg'
    ? 'text-3xl font-bold px-4 py-2 rounded-xl ring-2'
    : 'text-sm font-bold px-2.5 py-1 rounded-lg ring-1';

  return (
    <span className={`${color} ${sizeClass} tabular-nums`}>
      {score}
    </span>
  );
}
