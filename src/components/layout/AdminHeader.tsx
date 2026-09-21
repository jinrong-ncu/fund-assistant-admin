'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Menu, LogOut, User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/providers/ThemeToggle';
import { useAuth } from '@/features/auth/AuthContext';
import { navigationGroups } from './nav-config';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface AdminHeaderProps {
  onOpenMobileMenu: () => void;
}

export function AdminHeader({ onOpenMobileMenu }: AdminHeaderProps) {
  const pathname = usePathname();
  const { admin, logout } = useAuth();

  // Find active item title
  const activeItem = navigationGroups
    .flatMap((g) => g.items)
    .find((item) => (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)));

  const roleLabel =
    admin?.role === 'admin'
      ? '超级管理'
      : admin?.role === 'operator'
      ? '运营人员'
      : '只读观察';

  return (
    <header className="shrink-0 sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/95 backdrop-blur px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          onClick={onOpenMobileMenu}
          title="打开导航菜单"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground hidden sm:inline">估值助手</span>
          <span className="text-muted-foreground hidden sm:inline">/</span>
          <span className="font-semibold text-foreground text-sm">
            {activeItem?.title || '控制台'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />

        <div className="h-4 w-px bg-border mx-0.5" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 pl-1.5 pr-2.5 h-8 rounded-full hover:bg-muted"
            >
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold">
                  {(admin?.name || admin?.email || 'A').slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-foreground max-w-[120px] truncate hidden sm:inline">
                {admin?.name || admin?.email || '管理员'}
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-muted-foreground/30 hidden md:inline-flex">
                {roleLabel}
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 text-xs">
            <DropdownMenuLabel className="font-normal p-3">
              <div className="flex flex-col space-y-1">
                <p className="font-medium text-foreground truncate">{admin?.name || '管理员'}</p>
                <p className="text-[11px] text-muted-foreground truncate">{admin?.email}</p>
                <div className="pt-1">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    角色: {roleLabel}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => logout()}
              className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
            >
              <LogOut className="h-4 w-4 mr-2" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
