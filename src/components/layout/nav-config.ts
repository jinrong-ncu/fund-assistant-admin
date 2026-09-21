import {
  LayoutDashboard,
  Users,
  MessageSquare,
  TrendingUp,
  GitCommitHorizontal,
  Compass,
  Database,
  Layers,
  Settings,
  Activity,
  FileSearch,
} from 'lucide-react';
import type { ComponentType } from 'react';

export type NavItem = {
  title: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  badge?: string;
};

export type NavGroup = {
  group: string;
  items: NavItem[];
};

export const navigationGroups: NavGroup[] = [
  {
    group: '概览',
    items: [
      {
        title: '工作台',
        href: '/',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    group: '用户与互动',
    items: [
      {
        title: '用户数据',
        href: '/users',
        icon: Users,
      },
      {
        title: '反馈处理',
        href: '/feedback',
        icon: MessageSquare,
      },
    ],
  },
  {
    group: '运营中心',
    items: [
      {
        title: '热门内容',
        href: '/operations/hot-funds',
        icon: TrendingUp,
      },
      {
        title: '版本日志',
        href: '/operations/changelog',
        icon: GitCommitHorizontal,
      },
      {
        title: '交流与支持',
        href: '/operations/resources',
        icon: Compass,
      },
    ],
  },
  {
    group: '行情引擎',
    items: [
      {
        title: '股票标的库',
        href: '/market/stock-pool',
        icon: Database,
      },
      {
        title: '布局编排器',
        href: '/market/layout-builder',
        icon: Layers,
      },
    ],
  },
  {
    group: '系统与治理',
    items: [
      {
        title: '系统设置',
        href: '/system/settings',
        icon: Settings,
      },
      {
        title: '服务健康',
        href: '/system/health',
        icon: Activity,
      },
      {
        title: '操作审计',
        href: '/system/audit',
        icon: FileSearch,
      },
    ],
  },
];
