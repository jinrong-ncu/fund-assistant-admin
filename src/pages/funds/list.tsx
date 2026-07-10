import React, { useState } from 'react';
import { RefreshCw, Link as LinkIcon } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { Link } from '@tanstack/react-router';
import { useHotFunds, useCreateHotFund, useToggleHotFund } from '../../hooks/queries';
import { HotFund } from '../../types';
import { DataTable } from '../../components/DataTable';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const hotFundSchema = z.object({
  fundCode: z.string().trim().min(1, '请输入基金代码'),
  fundName: z.string().trim().min(1, '请输入基金名称'),
  sortOrder: z.number().int('排序必须是整数'),
});
type HotFundForm = z.infer<typeof hotFundSchema>;

export default function HotFundsPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useHotFunds();
  const createMutation = useCreateHotFund();
  const toggleMutation = useToggleHotFund();
  const [submitError, setSubmitError] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<HotFundForm>({
    resolver: zodResolver(hotFundSchema),
    defaultValues: { fundCode: '', fundName: '', sortOrder: 0 },
  });

  async function onSubmit(form: HotFundForm) {
    setSubmitError('');
    try {
      await createMutation.mutateAsync({
        fundCode: form.fundCode.trim(),
        fundName: form.fundName.trim(),
        sortOrder: form.sortOrder || 0,
      });
      reset();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '新增热门基金失败');
    }
  }

  const columns: ColumnDef<HotFund>[] = [
    {
      header: '代码',
      accessorKey: 'fund_code',
      cell: ({ getValue }) => (
        <Link
          to="/funds/$fundCode"
          params={{ fundCode: getValue() as string }}
          className="text-primary hover:underline font-semibold font-mono flex items-center gap-1"
        >
          {getValue() as string}
          <LinkIcon size={12} className="opacity-60" />
        </Link>
      ),
    },
    {
      header: '名称',
      accessorKey: 'fund_name',
      cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span>,
    },
    {
      header: '排序',
      accessorKey: 'sort_order',
    },
    {
      header: '状态',
      accessorKey: 'is_active',
      cell: ({ getValue }) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
            getValue() ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'
          }`}
        >
          {getValue() ? '启用' : '停用'}
        </span>
      ),
    },
    {
      header: '操作',
      cell: ({ row }) => (
        <button
          onClick={() => toggleMutation.mutate(row.original)}
          className="btn-secondary h-10 px-3 text-sm font-semibold cursor-pointer"
          disabled={toggleMutation.isPending}
        >
          {row.original.is_active ? '停用' : '启用'}
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-textMain">热门基金</h2>
          <p className="text-xs text-textMuted mt-1">维护搜索页推荐内容</p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-white border border-[#d4dbea] text-[#34425b] hover:bg-gray-50 hover:border-[#b0bfd6] cursor-pointer transition-all active:scale-95"
          disabled={isLoading || isFetching}
          aria-label="刷新基金"
        >
          <RefreshCw size={16} className={isLoading || isFetching ? 'animate-spin text-primary' : ''} />
        </button>
      </div>

      {/* Inline Creation Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white border border-borderBase rounded-lg p-4 grid grid-cols-1 sm:grid-cols-[140px_1fr_90px_auto] gap-3 items-end shadow-sm"
      >
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-textMuted">基金代码</span>
          <input
            className="input-base"
            placeholder="如 000001"
            {...register('fundCode')}
          />
          {errors.fundCode && <span className="text-xs text-red-600">{errors.fundCode.message}</span>}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-textMuted">基金名称</span>
          <input
            className="input-base"
            placeholder="请输入基金简称"
            {...register('fundName')}
          />
          {errors.fundName && <span className="text-xs text-red-600">{errors.fundName.message}</span>}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-textMuted">排序</span>
          <input
            className="input-base"
            type="number"
            placeholder="0"
            {...register('sortOrder', { valueAsNumber: true })}
          />
          {errors.sortOrder && <span className="text-xs text-red-600">{errors.sortOrder.message}</span>}
        </div>
        <button
          className="btn-primary h-10 px-6 font-semibold"
          disabled={createMutation.isPending || isSubmitting}
        >
          {createMutation.isPending ? '正在新增...' : '新增'}
        </button>
      </form>
      {submitError && <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-600">{submitError}</div>}

      {/* Error Info */}
      {isError && (
        <div className="p-4 rounded-md bg-red-50 border border-red-200 text-xs text-red-600">
          加载热门基金失败: {error?.message || '未知错误'}
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={data || []}
        loading={isLoading || isFetching}
      />
    </div>
  );
}
