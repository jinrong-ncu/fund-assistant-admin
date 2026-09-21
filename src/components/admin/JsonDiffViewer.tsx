import React, { useState } from 'react';
import { CopyButton } from './CopyButton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface JsonDiffViewerProps {
  before: unknown;
  after: unknown;
}

export function JsonDiffViewer({ before, after }: JsonDiffViewerProps) {
  const [viewMode, setViewMode] = useState<'diff' | 'raw'>('diff');

  const beforeObj = (before && typeof before === 'object' ? before : {}) as Record<string, unknown>;
  const afterObj = (after && typeof after === 'object' ? after : {}) as Record<string, unknown>;

  const allKeys = Array.from(new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)])).sort();

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4 text-xs font-mono">
      <div className="flex items-center justify-between">
        <span className="font-sans text-xs font-medium text-muted-foreground">变更前后比对</span>
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'diff' | 'raw')}>
            <TabsList className="h-7 text-[11px]">
              <TabsTrigger value="diff" className="px-2 py-0.5">结构化差异</TabsTrigger>
              <TabsTrigger value="raw" className="px-2 py-0.5">原始数据</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {viewMode === 'diff' ? (
        <div className="divide-y divide-border/50 overflow-x-auto rounded border border-border/60 bg-muted/20">
          {allKeys.length === 0 ? (
            <div className="p-4 text-center font-sans text-xs text-muted-foreground">无字段变更或均为原始空对象</div>
          ) : (
            allKeys.map((key) => {
              const hasBefore = key in beforeObj;
              const hasAfter = key in afterObj;
              const beforeVal = beforeObj[key];
              const afterVal = afterObj[key];
              const isSame = JSON.stringify(beforeVal) === JSON.stringify(afterVal);

              if (isSame) {
                return (
                  <div key={key} className="flex px-3 py-1.5 text-muted-foreground/80 hover:bg-muted/30">
                    <span className="w-40 shrink-0 font-semibold">{key}</span>
                    <span className="truncate">{JSON.stringify(afterVal)}</span>
                  </div>
                );
              }

              if (!hasBefore && hasAfter) {
                // Added
                return (
                  <div key={key} className="flex bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 px-3 py-1.5">
                    <span className="w-40 shrink-0 font-semibold flex items-center gap-1">
                      <span className="font-bold">+</span> {key}
                    </span>
                    <span className="break-all font-medium">{JSON.stringify(afterVal)}</span>
                  </div>
                );
              }

              if (hasBefore && !hasAfter) {
                // Removed
                return (
                  <div key={key} className="flex bg-destructive/10 text-destructive px-3 py-1.5">
                    <span className="w-40 shrink-0 font-semibold flex items-center gap-1">
                      <span className="font-bold">-</span> {key}
                    </span>
                    <span className="line-through break-all">{JSON.stringify(beforeVal)}</span>
                  </div>
                );
              }

              // Changed
              return (
                <div key={key} className="flex flex-col sm:flex-row bg-amber-500/10 text-amber-900 dark:text-amber-300 px-3 py-1.5 gap-1 sm:gap-2">
                  <span className="w-40 shrink-0 font-semibold flex items-center gap-1">
                    <span className="font-bold">~</span> {key}
                  </span>
                  <div className="flex flex-col sm:flex-row gap-2 flex-1">
                    <span className="line-through opacity-70 break-all">{JSON.stringify(beforeVal)}</span>
                    <span className="font-sans text-[11px] text-muted-foreground hidden sm:inline">➔</span>
                    <span className="font-bold break-all">{JSON.stringify(afterVal)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground font-sans">
              <span>变更前 (Before)</span>
              <CopyButton text={JSON.stringify(before, null, 2)} />
            </div>
            <pre className="p-3 bg-muted/40 rounded border border-border/60 overflow-x-auto text-[11px] max-h-80">
              {JSON.stringify(before, null, 2) || 'null'}
            </pre>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground font-sans">
              <span>变更后 (After)</span>
              <CopyButton text={JSON.stringify(after, null, 2)} />
            </div>
            <pre className="p-3 bg-muted/40 rounded border border-border/60 overflow-x-auto text-[11px] max-h-80">
              {JSON.stringify(after, null, 2) || 'null'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
