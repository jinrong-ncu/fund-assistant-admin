import React, { useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { useUsers, useUserDetail } from '../hooks/queries';
import { UserRow } from '../types';
import { DataTable } from '../components/DataTable';

export default function UsersPage() {
  const [keyword, setKeyword] = useState('');
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useUsers(query);
  const { data: detailData, isLoading: isDetailLoading } = useUserDetail(selectedUser?.openid || null);

  const columns: ColumnDef<UserRow>[] = [
    {
      header: '用户',
      accessorKey: 'nickname',
      cell: ({ row }) => (
        <button
          onClick={() => setSelectedUser(row.original)}
          className="text-primary hover:underline font-semibold bg-transparent border-0 cursor-pointer p-0 text-left"
        >
          {row.original.nickname || '微信用户'}
        </button>
      ),
    },
    {
      header: 'openid',
      accessorKey: 'openid',
      cell: ({ getValue }) => (
        <code className="text-[11px] text-[#3c4a64] font-mono select-all">
          {getValue() as string}
        </code>
      ),
    },
    {
      header: '持仓',
      accessorKey: 'holdingsCount',
      cell: ({ getValue }) => (getValue() !== undefined ? (getValue() as number) : '-'),
    },
    {
      header: '自选',
      accessorKey: 'watchlistCount',
      cell: ({ getValue }) => (getValue() !== undefined ? (getValue() as number) : '-'),
    },
    {
      header: '反馈',
      accessorKey: 'feedbackCount',
      cell: ({ getValue }) => (getValue() !== undefined ? (getValue() as number) : '-'),
    },
  ];

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    setQuery(keyword.trim());
    setSelectedUser(null);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-textMain">用户管理</h2>
          <p className="text-xs text-textMuted mt-1">按 openid 或昵称定位用户</p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center justify-center w-8.5 h-8.5 rounded-md bg-white border border-[#d4dbea] text-[#34425b] hover:bg-gray-50 hover:border-[#b0bfd6] cursor-pointer transition-all active:scale-95"
          disabled={isLoading || isFetching}
          aria-label="刷新用户列表"
        >
          <RefreshCw size={16} className={isLoading || isFetching ? 'animate-spin text-primary' : ''} />
        </button>
      </div>

      {/* Toolbar / Search Box */}
      <form onSubmit={handleSearch} className="flex items-center gap-2.5">
        <div className="flex items-center gap-2 px-3 border border-[#cfd7e6] rounded-md bg-white h-9.5 w-80 focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/15 transition-all">
          <Search size={16} className="text-textMuted" />
          <input
            className="w-full bg-transparent border-0 outline-none text-sm text-textMain"
            placeholder="搜索 openid / 昵称"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
        <button className="btn-secondary h-9.5 px-4">搜索</button>
      </form>

      {/* Error Info */}
      {isError && (
        <div className="p-4 rounded-md bg-red-50 border border-red-200 text-xs text-red-600">
          加载用户列表失败: {error?.message || '未知错误'}
        </div>
      )}

      {/* Split view: List & Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.9fr] gap-5">
        <div>
          <DataTable
            columns={columns}
            data={data?.items || []}
            loading={isLoading || isFetching}
          />
        </div>

        {/* Detail Panel */}
        <aside className="bg-white border border-borderBase rounded-lg p-5 flex flex-col gap-4 max-h-[calc(100vh-170px)] overflow-auto shadow-sm">
          <h3 className="text-sm font-bold text-textMain border-b border-[#edf0f6] pb-3">
            {selectedUser ? selectedUser.nickname || selectedUser.openid : '用户详情'}
          </h3>
          {selectedUser ? (
            isDetailLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-xs text-textMuted gap-2">
                <RefreshCw size={20} className="animate-spin text-primary" />
                <span>加载用户详情...</span>
              </div>
            ) : (
              <pre className="bg-[#101828] text-[#dce5f5] rounded-md p-4 text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap select-all">
                {JSON.stringify(detailData, null, 2)}
              </pre>
            )
          ) : (
            <p className="text-xs text-textMuted text-center py-12">
              选择左侧用户查看自选、持仓、流水和反馈。
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
