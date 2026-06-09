import React from 'react';
import { RefreshCw } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { useConfigs, useToggleConfig } from '../hooks/queries';
import { SystemConfig } from '../types';
import { DataTable } from '../components/DataTable';

function getConfigLabel(key: string) {
  switch (key) {
    case 'personal_safe_mode':
      return '个人主体安全模式';
    case 'show_market_indices':
      return '顶部数据卡片';
    default:
      return key;
  }
}

function getConfigValueLabel(item: SystemConfig) {
  if (item.key === 'personal_safe_mode') {
    return item.value === 'true' ? '已开启' : '已关闭';
  }
  if (item.key === 'show_market_indices') {
    return item.value === 'true' ? '显示' : '隐藏';
  }
  return item.value;
}

function getConfigActionLabel(item: SystemConfig) {
  if (item.key === 'personal_safe_mode') {
    return item.value === 'true' ? '关闭安全模式' : '开启安全模式';
  }
  if (item.key === 'show_market_indices') {
    return item.value === 'true' ? '隐藏数据卡片' : '显示数据卡片';
  }
  return item.value === 'true' ? '关闭' : '开启';
}

function isPrimaryConfig(key: string) {
  return key === 'personal_safe_mode';
}

export default function ConfigPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useConfigs();
  const toggleMutation = useToggleConfig();
  const [lastChangedKey, setLastChangedKey] = React.useState<string>('');
  const sortedData = React.useMemo(() => {
    const items = [...(data || [])];
    const priority: Record<string, number> = {
      personal_safe_mode: 0,
      show_market_indices: 1,
    };
    items.sort((a, b) => {
      const aPriority = priority[a.key] ?? 99;
      const bPriority = priority[b.key] ?? 99;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return a.key.localeCompare(b.key);
    });
    return items;
  }, [data]);

  const successTip = React.useMemo(() => {
    if (!lastChangedKey || !data?.length || toggleMutation.isPending) return '';
    const item = data.find((config) => config.key === lastChangedKey);
    if (!item) return '';
    if (item.key === 'personal_safe_mode') {
      return item.value === 'true'
        ? '已开启安全模式，前台将显示中性安全界面。'
        : '已关闭安全模式，前台将恢复完整界面。';
    }
    if (item.key === 'show_market_indices') {
      return item.value === 'true' ? '已显示顶部数据卡片。' : '已隐藏顶部数据卡片。';
    }
    return `${getConfigLabel(item.key)} 已更新。`;
  }, [data, lastChangedKey, toggleMutation.isPending]);

  const columns: ColumnDef<SystemConfig>[] = [
    {
      header: '配置键名',
      accessorKey: 'key',
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-textMain">{getConfigLabel(row.original.key)}</span>
          <code className="text-[11px] text-textMuted font-mono">{row.original.key}</code>
        </div>
      ),
    },
    {
      header: '当前配置值',
      accessorKey: 'value',
      cell: ({ row }) => {
        const isOn = row.original.value === 'true';
        return (
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                isOn ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {getConfigValueLabel(row.original)}
            </span>
            <code className="text-xs bg-gray-100 text-[#3c4a64] px-2 py-0.5 rounded font-mono select-all">
              {row.original.value}
            </code>
          </div>
        );
      },
    },
    {
      header: '配置说明',
      accessorKey: 'description',
      cell: ({ getValue }) => <span className="text-textMuted">{(getValue() as string) || '-'}</span>,
    },
    {
      header: '操作',
      cell: ({ row }) => {
        const isOn = row.original.value === 'true';
        const isPrimary = isPrimaryConfig(row.original.key);
        return (
          <button
            onClick={() => {
              setLastChangedKey(row.original.key);
              toggleMutation.mutate(row.original);
            }}
            className={
              isPrimary
                ? `inline-flex h-9 items-center rounded-full px-4 text-xs font-semibold cursor-pointer transition-all ${
                    isOn
                      ? 'bg-slate-900 text-white hover:bg-slate-800'
                      : 'bg-emerald-600 text-white hover:bg-emerald-500'
                  }`
                : 'btn-secondary h-8 px-3.5 text-xs font-semibold cursor-pointer'
            }
            disabled={toggleMutation.isPending}
          >
            {getConfigActionLabel(row.original)}
          </button>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-textMain">系统配置</h2>
          <p className="text-xs text-textMuted mt-1">安全模式与全局配置管理</p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center justify-center w-8.5 h-8.5 rounded-md bg-white border border-[#d4dbea] text-[#34425b] hover:bg-gray-50 hover:border-[#b0bfd6] cursor-pointer transition-all active:scale-95"
          disabled={isLoading || isFetching}
          aria-label="刷新配置"
        >
          <RefreshCw size={16} className={isLoading || isFetching ? 'animate-spin text-primary' : ''} />
        </button>
      </div>

      {/* Error Info */}
      {isError && (
        <div className="p-4 rounded-md bg-red-50 border border-red-200 text-xs text-red-600">
          加载系统配置失败: {error?.message || '未知错误'}
        </div>
      )}

      {!isError && successTip && (
        <div className="p-4 rounded-md bg-sky-50 border border-sky-200 text-xs text-sky-700">
          {successTip}
        </div>
      )}

      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-xs text-emerald-800">
        <strong className="font-semibold">推荐操作：</strong>
        个人主体提审时保持“个人主体安全模式”开启；切换企业主体并确认资质后，再关闭该模式恢复完整界面。
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={sortedData}
        loading={isLoading || isFetching}
      />
    </div>
  );
}
