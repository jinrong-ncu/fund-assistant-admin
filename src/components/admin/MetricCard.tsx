import React, { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/formatters';

interface MetricCardProps {
  title: string;
  value: number | string;
  suffix?: string;
  icon: ReactNode;
  iconColor?: string;
  description?: string;
  loading?: boolean;
  className?: string;
}

export function MetricCard({
  title,
  value,
  suffix,
  icon,
  iconColor = 'text-primary',
  description,
  loading = false,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn('overflow-hidden transition-all duration-150 hover:border-border/80', className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
          <div className={cn('flex h-8 w-8 items-center justify-center rounded-md bg-muted/60', iconColor)}>
            {icon}
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          {loading ? (
            <div className="h-8 w-24 animate-pulse rounded bg-muted" />
          ) : (
            <>
              <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                {typeof value === 'number' ? formatNumber(value) : value}
              </span>
              {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
            </>
          )}
        </div>
        {description && (
          <p className="mt-1.5 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
