import type { PainCategory } from '@/lib/types';
import { PAIN_CATEGORY_LABELS, PAIN_CATEGORY_COLORS } from '@/lib/types';

interface BadgeProps {
  category: PainCategory;
  size?: 'sm' | 'md';
}

export function PainBadge({ category, size = 'md' }: BadgeProps) {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${PAIN_CATEGORY_COLORS[category]}`}>
      {PAIN_CATEGORY_LABELS[category]}
    </span>
  );
}

interface GenericBadgeProps {
  children: React.ReactNode;
  color?: 'gray' | 'blue' | 'green' | 'yellow' | 'red';
  size?: 'sm' | 'md';
}

const COLORS = {
  gray: 'bg-gray-100 text-gray-700',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red: 'bg-red-100 text-red-700',
};

export function Badge({ children, color = 'gray', size = 'md' }: GenericBadgeProps) {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${COLORS[color]}`}>
      {children}
    </span>
  );
}
