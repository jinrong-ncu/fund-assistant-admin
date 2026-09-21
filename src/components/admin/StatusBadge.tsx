import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusType =
  | 'healthy'
  | 'degraded'
  | 'unavailable'
  | 'open'
  | 'processing'
  | 'resolved'
  | 'ignored'
  | 'low'
  | 'normal'
  | 'high'
  | 'active'
  | 'inactive'
  | 'buy'
  | 'sell';

interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
  className?: string;
}

const statusConfig: Record<
  string,
  { label: string; dotColor: string; badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' }
> = {
  // Health
  healthy: { label: '正常', dotColor: 'bg-emerald-500', badgeVariant: 'success' },
  degraded: { label: '降级', dotColor: 'bg-amber-500', badgeVariant: 'warning' },
  unavailable: { label: '异常', dotColor: 'bg-destructive', badgeVariant: 'destructive' },

  // Feedback Status
  open: { label: '待处理', dotColor: 'bg-amber-500', badgeVariant: 'warning' },
  processing: { label: '处理中', dotColor: 'bg-blue-500', badgeVariant: 'secondary' },
  resolved: { label: '已解决', dotColor: 'bg-emerald-500', badgeVariant: 'success' },
  ignored: { label: '已忽略', dotColor: 'bg-muted-foreground', badgeVariant: 'outline' },

  // Feedback Priority
  low: { label: '低', dotColor: 'bg-muted-foreground', badgeVariant: 'outline' },
  normal: { label: '普通', dotColor: 'bg-blue-500', badgeVariant: 'secondary' },
  high: { label: '高', dotColor: 'bg-destructive', badgeVariant: 'destructive' },

  // General State
  active: { label: '启用', dotColor: 'bg-emerald-500', badgeVariant: 'success' },
  inactive: { label: '停用', dotColor: 'bg-muted-foreground', badgeVariant: 'outline' },

  // Transaction Types
  buy: { label: '买入', dotColor: 'bg-blue-500', badgeVariant: 'secondary' },
  sell: { label: '卖出', dotColor: 'bg-amber-500', badgeVariant: 'warning' },
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: label || status,
    dotColor: 'bg-muted-foreground',
    badgeVariant: 'outline',
  };

  return (
    <Badge
      variant={config.badgeVariant}
      className={cn('inline-flex items-center gap-1.5 font-normal tracking-wide px-2 py-0.5', className)}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', config.dotColor)} />
      <span>{label || config.label}</span>
    </Badge>
  );
}
