'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navigationGroups } from './nav-config';
import { cn } from '@/lib/utils';
import { Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AdminSidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  className?: string;
  onNavigate?: () => void; // for mobile closing
}

export function AdminSidebar({
  collapsed,
  onToggleCollapsed,
  className,
  onNavigate,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const isItemActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'relative flex flex-col h-full shrink-0 border-r border-border bg-card transition-all duration-200 select-none z-30',
          collapsed ? 'w-[68px]' : 'w-60',
          className
        )}
      >
        {/* Brand Header */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-border/80">
          <Link
            href="/"
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-2.5 overflow-hidden transition-all',
              collapsed ? 'justify-center w-full' : ''
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm shadow-sm">
              估
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="text-sm font-semibold tracking-tight text-foreground">估值助手</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Admin Console</span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4">
          {navigationGroups.map((group, gIdx) => (
            <div key={group.group} className="space-y-1">
              {!collapsed && (
                <div className="px-2.5 py-1 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
                  {group.group}
                </div>
              )}
              {collapsed && gIdx > 0 && <div className="my-2 border-t border-border/40 mx-2" />}

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isItemActive(item.href);
                  const Icon = item.icon;

                  const content = (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        'flex items-center gap-3 rounded-md text-xs font-medium transition-colors py-2 px-2.5',
                        active
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                        collapsed && 'justify-center px-0'
                      )}
                    >
                      <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary-foreground' : '')} />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                    </Link>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{content}</TooltipTrigger>
                        <TooltipContent side="right" className="text-xs font-medium">
                          {item.title}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return content;
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Collapsible Toggle button */}
        <div className="p-3 border-t border-border/80 hidden md:block">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapsed}
            className={cn('w-full h-8 text-xs text-muted-foreground', collapsed ? 'px-0 justify-center' : 'justify-start')}
            title={collapsed ? '展开侧边栏' : '折叠侧边栏'}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span>收起侧边栏</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
