import { EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Descriptions, Drawer, Space, Table, Tag, Typography } from 'antd';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { PageHeader } from '@/components/PageHeader';
import { adminApi } from '@/services/admin-api';
import type { AuditLog } from '@/types';

const actionNames: Record<string, string> = { 'transaction.update': '修改流水', 'transaction.delete': '删除流水', 'holding.recalculate': '重新计算', 'feedback.update': '处理反馈', 'hot_fund.create': '新增热门内容', 'hot_fund.update': '编辑热门内容', 'hot_fund.delete': '删除热门内容', 'changelog.create': '新增版本日志', 'changelog.update': '编辑版本日志', 'changelog.delete': '删除版本日志', 'config.upsert': '修改系统配置', 'resource.create': '新增资源', 'resource.update': '编辑资源', 'resource.delete': '删除资源', 'market.layout.update': '保存行情编排', 'market.stock.create': '新增行情股票', 'market.stock.refresh': '刷新行情股票', 'market.stock.delete': '删除行情股票' };
const dateTime = (value: string) => new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'medium' }).format(new Date(value));

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selected, setSelected] = useState<AuditLog | null>(null);
  const query = useQuery({ queryKey: ['audit', page, pageSize], queryFn: () => adminApi.auditLogs(page, pageSize), placeholderData: keepPreviousData });
  return <div><PageHeader title="操作记录" description="后台写操作会自动留下修改前后数据，便于排查误操作" extra={<Button icon={<ReloadOutlined />} loading={query.isFetching} onClick={() => query.refetch()}>刷新</Button>} />
    <Table rowKey="id" loading={query.isLoading} dataSource={query.data?.items || []} scroll={{ x: 1000 }} pagination={{ current: page, pageSize, total: query.data?.total || 0, showSizeChanger: true, showTotal: (total) => `共 ${total} 条记录`, onChange: (next, size) => { setPage(next); setPageSize(size); } }} columns={[
      { title: '时间', dataIndex: 'created_at', width: 190, render: dateTime },
      { title: '动作', dataIndex: 'action', width: 160, render: (value: string) => <Tag color={value.includes('delete') ? 'red' : value.includes('create') ? 'green' : 'blue'}>{actionNames[value] || value}</Tag> },
      { title: '对象', dataIndex: 'target_type', width: 220 },
      { title: '对象 ID', dataIndex: 'target_id', ellipsis: true },
      { title: '原因', dataIndex: 'reason', ellipsis: true, render: (value: string) => value || '-' },
      { title: '操作', fixed: 'right', width: 90, render: (_: unknown, row: AuditLog) => <Button type="link" icon={<EyeOutlined />} onClick={() => setSelected(row)}>详情</Button> },
    ]} />
    <Drawer size="large" title="操作详情" open={!!selected} onClose={() => setSelected(null)}><Descriptions bordered size="small" column={1} items={[{ key: 'time', label: '时间', children: selected ? dateTime(selected.created_at) : '-' }, { key: 'action', label: '动作', children: selected ? actionNames[selected.action] || selected.action : '-' }, { key: 'target', label: '对象', children: `${selected?.target_type || '-'} / ${selected?.target_id || '-'}` }, { key: 'reason', label: '原因', children: selected?.reason || '-' }, { key: 'ip', label: 'IP', children: selected?.ip || '-' }]} /><Space orientation="vertical" size={16} className="audit-json"><div><Typography.Title level={5}>修改前</Typography.Title><pre>{JSON.stringify(selected?.before_data ?? null, null, 2)}</pre></div><div><Typography.Title level={5}>修改后</Typography.Title><pre>{JSON.stringify(selected?.after_data ?? null, null, 2)}</pre></div></Space></Drawer>
  </div>;
}
