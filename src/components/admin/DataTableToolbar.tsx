import React, { ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, RotateCw, X } from 'lucide-react';

interface DataTableToolbarProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  actions?: ReactNode;
  onRefresh?: () => void;
  loading?: boolean;
}

export function DataTableToolbar({
  search,
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder = '按关键字搜索...',
  filters,
  actions,
  onRefresh,
  loading = false,
}: DataTableToolbarProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearchSubmit && search !== undefined) {
      onSearchSubmit(search.trim());
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <div className="flex flex-1 items-center gap-2 flex-wrap">
        {onSearchChange && (
          <div className="relative w-full sm:w-64 md:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={search || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-8 pr-8 h-9 text-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  if (onSearchSubmit) onSearchSubmit('');
                }}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
        {onSearchSubmit && onSearchChange && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onSearchSubmit(search?.trim() || '')}
            className="h-9 px-3"
          >
            搜索
          </Button>
        )}
        {filters}
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto">
        {actions}
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="h-9 px-3 text-xs"
            title="刷新数据"
          >
            <RotateCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        )}
      </div>
    </div>
  );
}
