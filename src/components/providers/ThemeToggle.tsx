'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Button variant="ghost" size="icon-sm" className="h-8 w-8 opacity-0" />;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="h-8 w-8 rounded-full border border-border/60 bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 shadow-xs"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? '当前为深色模式，点击切换为浅色' : '当前为浅色模式，点击切换为深色'}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 text-slate-700 transition-transform duration-300 hover:-rotate-12" />
      )}
      <span className="sr-only">切换主题</span>
    </Button>
  );
}
