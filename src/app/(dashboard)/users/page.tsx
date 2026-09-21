'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ColumnDef, PaginationState } from '@tanstack/react-table';
import { apiClient } from '@/lib/api-client';
import type { UserRow, Paginated } from '@/types';
import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { DataTableToolbar } from '@/components/admin/DataTableToolbar';
import { UserDetailSheet } from '@/features/users/UserDetailSheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/admin/CopyButton';
import { formatDateTime } from '@/lib/formatters';
import { Eye, Users } from 'lucide-react';

export default function UsersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL State
  const pageParam = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSizeParam = Number(searchParams.get('pageSize')) || 20;
  const searchParam = searchParams.get('keyword') || searchParams.get('search') || '';

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: pageParam - 1,
    pageSize: pageSizeParam,
  });
  const [searchInput, setSearchInput] = useState(searchParam);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  // Sync to URL
  const updateUrl = (page: number, pageSize: number, keyword: string) => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', String(page));
    if (pageSize !== 20) params.set('pageSize', String(pageSize));
    if (keyword.trim()) params.set('keyword', keyword.trim());
    router.replace(`${pathname}?${params.toString()}`);
  };

  // Fetch users query
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['users', pagination.pageIndex, pagination.pageSize, searchParam],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(pagination.pageIndex + 1),
        pageSize: String(pagination.pageSize),
      });
      if (searchParam.trim()) params.set('keyword', searchParam.trim());
      return apiClient.get<Paginated<UserRow>>(`/api/admin/users?${params.toString()}`);
    },
  });

  const columns: ColumnDef<UserRow>[] = [
    {
      accessorKey: 'user',
      header: '微信用户',
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className="flex items-center gap-2.5">
            <Avatar className="h-7 w-7 border border-border">
              <AvatarImage src={u.avatar_url || undefined} />
              <AvatarFallback className="text-[11px] font-semibold bg-primary/10 text-primary">
                {(u.nickname || '用').slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => setSelectedUser(u)}
              className="text-xs font-semibold text-foreground hover:underline text-left"
            >
              {u.nickname || '微信用户'}
            </button>
          </div>
        );
      },
    },
    {
      accessorKey: 'user_code',
      header: '用户编号',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.user_code || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'openid',
      header: 'OpenID',
      cell: ({ row }) => {
        const openid = row.original.openid;
        return (
          <div className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
            <span className="max-w-[130px] truncate" title={openid}>
              {openid}
            </span>
            <CopyButton text={openid} />
          </div>
        );
      },
    },
    {
      accessorKey: 'holdingsCount',
      header: '持仓数',
      cell: ({ row }) => (
        <span className="font-mono tabular-nums text-xs">
          {row.original.holdingsCount}
        </span>
      ),
    },
    {
      accessorKey: 'watchlistCount',
      header: '关注数',
      cell: ({ row }) => (
        <span className="font-mono tabular-nums text-xs">
          {row.original.watchlistCount}
        </span>
      ),
    },
    {
      accessorKey: 'feedbackCount',
      header: '反馈数',
      cell: ({ row }) => (
        <span className="font-mono tabular-nums text-xs">
          {row.original.feedbackCount}
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: '注册时间',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatDateTime(row.original.created_at)}
        </span>
      ),
    },
    {
      accessorKey: 'updated_at',
      header: '最后活跃',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatDateTime(row.original.updated_at)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedUser(row.original)}
          className="h-7 text-xs px-2 text-primary hover:text-primary hover:bg-primary/10"
        >
          <Eye className="h-3.5 w-3.5 mr-1" />
          全景画像
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="用户数据"
        description="按昵称、用户编号或 openid 检索小程序用户，全景查阅并维护其持仓、流水与自选资产"
      />

      <DataTable
        columns={columns}
        data={data?.items || []}
        loading={isLoading}
        total={data?.total}
        pagination={pagination}
        onPaginationChange={(updater) => {
          const next = typeof updater === 'function' ? updater(pagination) : updater;
          setPagination(next);
          updateUrl(next.pageIndex + 1, next.pageSize, searchParam);
        }}
        emptyTitle="未查询到任何匹配用户"
        emptyDescription="尝试更换搜索关键词或清空筛选条件"
        toolbar={
          <DataTableToolbar
            search={searchInput}
            onSearchChange={setSearchInput}
            onSearchSubmit={(val) => {
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              updateUrl(1, pagination.pageSize, val);
            }}
            searchPlaceholder="搜索用户编号、微信昵称或 OpenID..."
            onRefresh={() => refetch()}
            loading={isFetching}
          />
        }
      />

      {/* User Detail Sheet */}
      <UserDetailSheet
        user={selectedUser}
        open={!!selectedUser}
        onOpenChange={(open) => !open && setSelectedUser(null)}
      />
    </div>
  );
}
