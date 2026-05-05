import { statusBadge, priorityBadge, statusLabel, priorityLabel } from '@/Utils/badges';

type BadgeProps = {
  variant: 'status' | 'priority';
  value: string;
  className?: string;
};

export default function Badge({ variant, value, className }: BadgeProps) {
  const badgeClass = variant === 'status' ? statusBadge(value) : priorityBadge(value);
  const label = variant === 'status' ? statusLabel[value] : priorityLabel[value];

  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeClass} ${className ?? ''}`}>
      {label ?? value}
    </span>
  );
}