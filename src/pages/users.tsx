import React, { useEffect, useState } from 'react';
import { Search, RefreshCw, X } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import {
  Avatar,
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
} from '@mui/material';
import { useUsers, useUserDetail } from '../hooks/queries';
import { UserRow } from '../types';
import { DataTable } from '../components/DataTable';

type DetailRecord = Record<string, unknown>;
type DetailKey = 'holdings' | 'watchlist' | 'transactions' | 'feedback';
type DetailData = Partial<Record<DetailKey, DetailRecord[]>>;
type DetailColumn = {
  key: string;
  header: string;
  render?: (row: DetailRecord) => React.ReactNode;
};

export default function UsersPage() {
  const [keyword, setKeyword] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [detailTab, setDetailTab] = useState<DetailKey>('holdings');

  const { data, isLoading, isError, error, refetch, isFetching } = useUsers(query, page, pageSize);
  const { data: detailData, isLoading: isDetailLoading } = useUserDetail(selectedUser?.openid || null);
  const total = data?.total || 0;

  useEffect(() => {
    if (total > 0 && page > Math.ceil(total / pageSize)) {
      setPage(1);
    }
  }, [page, pageSize, total]);

  function formatDate(value?: string) {
    if (!value) return '-';
    return new Intl.DateTimeFormat('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }

  function formatDay(value?: unknown) {
    if (!value) return '-';
    return String(value);
  }

  function formatNumber(value?: unknown) {
    if (value === undefined || value === null || value === '') return '-';
    const numberValue = Number(value);
    if (Number.isNaN(numberValue)) return String(value);
    return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(numberValue);
  }

  function formatPercent(value?: unknown) {
    if (value === undefined || value === null || value === '') return '-';
    const text = String(value);
    return text.includes('%') ? text : `${formatNumber(value)}%`;
  }

  function formatCellValue(value: unknown) {
    if (value === undefined || value === null || value === '') return '-';
    return String(value);
  }

  function getDetailRows(key: DetailKey) {
    const source = detailData as DetailData | undefined;
    return Array.isArray(source?.[key]) ? source[key] || [] : [];
  }

  const detailTabs: Array<{ key: DetailKey; label: string; columns: DetailColumn[] }> = [
    {
      key: 'holdings',
      label: '持仓',
      columns: [
        { key: 'fund_name', header: '基金名称' },
        { key: 'fund_code', header: '代码' },
        { key: 'current_value', header: '当前市值', render: (row) => formatNumber(row.current_value) },
        { key: 'hold_profit', header: '持有收益', render: (row) => formatNumber(row.hold_profit) },
        { key: 'hold_profit_rate', header: '收益率', render: (row) => formatPercent(row.hold_profit_rate) },
        { key: 'shares', header: '份额', render: (row) => formatNumber(row.shares) },
        { key: 'updated_at', header: '更新时间', render: (row) => formatDate(row.updated_at as string | undefined) },
      ],
    },
    {
      key: 'watchlist',
      label: '自选',
      columns: [
        { key: 'fund_name', header: '基金名称' },
        { key: 'fund_code', header: '代码' },
        { key: 'fund_type', header: '类型' },
        { key: 'created_at', header: '添加时间', render: (row) => formatDate(row.created_at as string | undefined) },
      ],
    },
    {
      key: 'transactions',
      label: '交易流水',
      columns: [
        { key: 'fund_code', header: '代码' },
        { key: 'transaction_type', header: '类型' },
        { key: 'trade_date', header: '交易日', render: (row) => formatDay(row.trade_date) },
        { key: 'amount', header: '金额', render: (row) => formatNumber(row.amount) },
        { key: 'shares', header: '份额', render: (row) => formatNumber(row.shares) },
        { key: 'nav', header: '净值', render: (row) => formatNumber(row.nav) },
        { key: 'remark', header: '备注' },
        {
          key: 'is_buy_point',
          header: 'B点',
          render: (row) => row.is_buy_point ? <Chip size="small" label="是" color="primary" /> : '-',
        },
      ],
    },
    {
      key: 'feedback',
      label: '反馈',
      columns: [
        { key: 'category', header: '分类' },
        { key: 'content', header: '内容' },
        { key: 'status', header: '状态' },
        { key: 'priority', header: '优先级' },
        { key: 'created_at', header: '提交时间', render: (row) => formatDate(row.created_at as string | undefined) },
      ],
    },
  ];
  const activeDetailConfig = detailTabs.find((item) => item.key === detailTab) || detailTabs[0];
  const activeDetailRows = getDetailRows(activeDetailConfig.key);

  const columns: ColumnDef<UserRow>[] = [
    {
      header: '用户',
      accessorKey: 'nickname',
      cell: ({ row }) => {
        const user = row.original;
        const avatarUrl = user.avatarUrl || user.avatar_url || '';
        const displayName = user.nickname || '微信用户';

        return (
          <button
            onClick={() => setSelectedUser(user)}
            className="flex items-center gap-2.5 bg-transparent border-0 cursor-pointer p-0 text-left group min-w-0"
          >
            <Avatar
              src={avatarUrl}
              alt={displayName}
              sx={{ width: 34, height: 34, bgcolor: '#e8f0ff', color: '#2563eb', fontSize: 13, fontWeight: 800 }}
            >
              {displayName.slice(0, 1)}
            </Avatar>
            <span className="text-primary group-hover:underline font-semibold truncate max-w-38">
              {displayName}
            </span>
          </button>
        );
      },
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
    {
      header: '注册时间',
      accessorFn: (row) => row.createdAt || row.created_at,
      cell: ({ getValue }) => formatDate(getValue() as string | undefined),
    },
  ];

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    setQuery(keyword.trim());
    setPage(1);
    setSelectedUser(null);
  }

  function closeDetailDialog() {
    setSelectedUser(null);
    setDetailTab('holdings');
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

      <div>
        <DataTable
          columns={columns}
          data={data?.items || []}
          loading={isLoading || isFetching}
        />
        <div className="bg-white border-x border-b border-borderBase rounded-b-lg">
          <TablePagination
            component="div"
            count={total}
            page={page - 1}
            rowsPerPage={pageSize}
            rowsPerPageOptions={[10, 20, 50, 100]}
            labelRowsPerPage="每页"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} / ${count === -1 ? `超过 ${to}` : count}`
            }
            onPageChange={(_, nextPage) => {
              setPage(nextPage + 1);
              setSelectedUser(null);
            }}
            onRowsPerPageChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
              setSelectedUser(null);
            }}
          />
        </div>
      </div>

      <Dialog open={!!selectedUser} onClose={closeDetailDialog} fullWidth maxWidth="lg">
        <DialogTitle sx={{ px: 3, py: 2.25, borderBottom: '1px solid #edf0f6' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
              <Avatar
                src={selectedUser?.avatarUrl || selectedUser?.avatar_url || ''}
                alt={selectedUser?.nickname || '微信用户'}
                sx={{ width: 44, height: 44, bgcolor: '#e8f0ff', color: '#2563eb', fontSize: 16, fontWeight: 800 }}
              >
                {(selectedUser?.nickname || '微').slice(0, 1)}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Box sx={{ fontSize: 16, fontWeight: 800, color: '#1f2a44' }}>
                  {selectedUser?.nickname || '微信用户'}
                </Box>
                <Box sx={{ mt: 0.25, display: 'flex', gap: 1.5, flexWrap: 'wrap', color: '#6b7890', fontSize: 12 }}>
                  <code>{selectedUser?.openid}</code>
                  <span>注册时间 {formatDate(selectedUser?.createdAt || selectedUser?.created_at)}</span>
                </Box>
              </Box>
            </Box>
            <IconButton onClick={closeDetailDialog} size="small" aria-label="关闭用户详情">
              <X size={18} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Tabs
            value={detailTab}
            onChange={(_, value: DetailKey) => setDetailTab(value)}
            sx={{ px: 3, borderBottom: '1px solid #edf0f6', minHeight: 44 }}
          >
            {detailTabs.map((item) => (
              <Tab
                key={item.key}
                value={item.key}
                label={`${item.label} ${getDetailRows(item.key).length}`}
                sx={{ minHeight: 44, fontWeight: 700, letterSpacing: 0 }}
              />
            ))}
          </Tabs>

          {isDetailLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-xs text-textMuted gap-2">
              <RefreshCw size={20} className="animate-spin text-primary" />
              <span>加载用户详情...</span>
            </div>
          ) : (
            <TableContainer sx={{ maxHeight: '62vh' }}>
              <Table stickyHeader size="small" sx={{ minWidth: 860 }}>
                <TableHead>
                  <TableRow>
                    {activeDetailConfig.columns.map((column) => (
                      <TableCell
                        key={column.key}
                        sx={{
                          bgcolor: '#f8fbff',
                          borderBottom: '1px solid #dfe4ee',
                          color: '#34425b',
                          fontWeight: 800,
                          whiteSpace: 'nowrap',
                          letterSpacing: 0,
                        }}
                      >
                        {column.header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeDetailRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={activeDetailConfig.columns.length} sx={{ py: 7, textAlign: 'center', color: 'text.secondary' }}>
                        暂无{activeDetailConfig.label}数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    activeDetailRows.map((row, rowIndex) => (
                      <TableRow key={String(row.id || `${activeDetailConfig.key}-${rowIndex}`)} hover>
                        {activeDetailConfig.columns.map((column) => (
                          <TableCell
                            key={column.key}
                            sx={{
                              maxWidth: column.key === 'content' ? 360 : 220,
                              borderBottom: '1px solid #edf0f6',
                              color: '#34425b',
                              fontSize: 13,
                              whiteSpace: column.key === 'content' ? 'normal' : 'nowrap',
                              wordBreak: column.key === 'content' ? 'break-word' : 'normal',
                            }}
                          >
                            {column.render ? column.render(row) : formatCellValue(row[column.key])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
