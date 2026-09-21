import React, { ReactNode } from 'react';
import { FileQuestion, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function EmptyState({
  title = '暂无数据',
  description = '当前没有找到匹配的记录',
  icon = <FileQuestion className="h-9 w-9 text-muted-foreground" />,
  action,
  className,
}: {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/60 mb-3">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = '加载失败',
  description = '获取数据时遇到问题，请重试',
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-3">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm">{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
          重新加载
        </Button>
      )}
    </div>
  );
}

export function LoadingState({
  description = '正在加载数据...',
  className,
}: {
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-12 text-center', className)}>
      <Loader2 className="h-7 w-7 animate-spin text-primary mb-3" />
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
