import { CopyOutlined, DeleteOutlined, EditOutlined, ReloadOutlined, SearchOutlined, SyncOutlined } from '@ant-design/icons';
import { App, Avatar, Button, Descriptions, Drawer, Form, Input, InputNumber, Modal, Popconfirm, Space, Table, Tabs, Tag, Tooltip, Typography } from 'antd';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { PageHeader } from '@/components/PageHeader';
import { adminApi } from '@/services/admin-api';
import type { TransactionRow, UserRow } from '@/types';

const dateTime = (value?: string) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '-';
const money = (value: unknown) => value === null || value === undefined ? '-' : Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 2 });

export default function UsersPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [editing, setEditing] = useState<TransactionRow | null>(null);
  const [form] = Form.useForm();
  const users = useQuery({ queryKey: ['users', keyword, page, pageSize], queryFn: () => adminApi.users({ keyword, page, pageSize }), placeholderData: keepPreviousData });
  const details = useQuery({ queryKey: ['user-details', selected?.openid], queryFn: () => adminApi.userDetails(selected!.openid), enabled: !!selected });

  const refreshDetails = () => queryClient.invalidateQueries({ queryKey: ['user-details', selected?.openid] });
  const saveTransaction = useMutation({ mutationFn: (values: Record<string, unknown>) => adminApi.updateTransaction(editing!.id, values as Partial<TransactionRow> & { reason: string }), onSuccess: () => { message.success('流水已更新，汇总金额已重新计算'); setEditing(null); refreshDetails(); } });
  const deleteTransaction = useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.deleteTransaction(id, reason), onSuccess: () => { message.success('流水已删除'); refreshDetails(); } });
  const recalculate = useMutation({ mutationFn: ({ fundCode, reason }: { fundCode: string; reason: string }) => adminApi.recalculateHolding(selected!.openid, fundCode, reason), onSuccess: () => { message.success('金额记录已重新计算'); refreshDetails(); } });

  const transactionColumns = [
    { title: '日期', dataIndex: 'trade_date', width: 110 },
    { title: '代码', dataIndex: 'fund_code', width: 100 },
    { title: '类型', dataIndex: 'transaction_type', width: 80, render: (value: string) => <Tag color={value === 'buy' ? 'blue' : 'orange'}>{value === 'buy' ? '买入' : '卖出'}</Tag> },
    { title: '金额', dataIndex: 'amount', align: 'right' as const, render: money },
    { title: '成本', dataIndex: 'cost_amount', align: 'right' as const, render: money },
    { title: '份额', dataIndex: 'shares', align: 'right' as const, render: money },
    { title: '估值', dataIndex: 'nav', align: 'right' as const, render: money },
    { title: '备注', dataIndex: 'remark', ellipsis: true },
    { title: '操作', key: 'action', fixed: 'right' as const, width: 150, render: (_: unknown, row: TransactionRow) => <Space><Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditing(row); form.setFieldsValue({ date: row.trade_date, type: row.transaction_type, nav: row.nav, amount: row.amount, costAmount: row.cost_amount, shares: row.shares, isBuyPoint: row.is_buy_point, remark: row.remark, reason: '' }); }}>编辑</Button><Popconfirm title="删除这条流水？" description={<Input.TextArea id={`reason-${row.id}`} placeholder="请输入删除原因" />} onConfirm={() => { const input = document.getElementById(`reason-${row.id}`) as HTMLTextAreaElement | null; const reason = input?.value.trim(); if (!reason) return message.warning('请输入删除原因'); deleteTransaction.mutate({ id: row.id, reason }); }}><Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button></Popconfirm></Space> },
  ];

  const tabs = [
    { key: 'holdings', label: `金额记录 ${details.data?.holdings.length ?? 0}`, children: <Table rowKey="fund_code" size="small" scroll={{ x: 900 }} pagination={false} loading={details.isLoading} dataSource={details.data?.holdings || []} columns={[{ title: '名称', dataIndex: 'fund_name', fixed: 'left', width: 180 }, { title: '代码', dataIndex: 'fund_code', width: 100 }, { title: '当前金额', dataIndex: 'current_value', align: 'right', render: money }, { title: '成本金额', dataIndex: 'cost_amount', align: 'right', render: money }, { title: '份额', dataIndex: 'shares', align: 'right', render: money }, { title: '更新时间', dataIndex: 'updated_at', width: 160, render: dateTime }, { title: '操作', key: 'action', fixed: 'right', width: 100, render: (_: unknown, row: { fund_code: string }) => <Popconfirm title="重新计算该记录？" description="系统将根据全部流水重新生成汇总金额。" onConfirm={() => recalculate.mutate({ fundCode: row.fund_code, reason: '后台手动重新计算金额记录' })}><Button type="link" icon={<SyncOutlined />}>重算</Button></Popconfirm> }]} /> },
    { key: 'transactions', label: `流水 ${details.data?.transactions.length ?? 0}`, children: <Table rowKey="id" size="small" scroll={{ x: 1100 }} pagination={false} loading={details.isLoading} dataSource={details.data?.transactions || []} columns={transactionColumns} /> },
    { key: 'watchlist', label: `关注清单 ${details.data?.watchlist.length ?? 0}`, children: <Table rowKey="fund_code" size="small" pagination={false} loading={details.isLoading} dataSource={details.data?.watchlist || []} columns={[{ title: '名称', dataIndex: 'fund_name' }, { title: '代码', dataIndex: 'fund_code' }, { title: '类型', dataIndex: 'fund_type' }, { title: '添加时间', dataIndex: 'created_at', render: dateTime }]} /> },
    { key: 'feedback', label: `反馈 ${details.data?.feedback.length ?? 0}`, children: <Table rowKey="id" size="small" pagination={false} loading={details.isLoading} dataSource={details.data?.feedback || []} columns={[{ title: '分类', dataIndex: 'category' }, { title: '内容', dataIndex: 'content' }, { title: '状态', dataIndex: 'status' }, { title: '时间', dataIndex: 'created_at', render: dateTime }]} /> },
  ];

  return <div><PageHeader title="用户数据" description="查询用户并查看其金额记录、流水、关注清单和反馈" extra={<Button icon={<ReloadOutlined />} loading={users.isFetching} onClick={() => users.refetch()}>刷新</Button>} />
    <div className="table-toolbar"><Input.Search allowClear enterButton={<><SearchOutlined /> 搜索</>} placeholder="用户编号、昵称或 openid" value={keywordInput} onChange={(event) => setKeywordInput(event.target.value)} onSearch={(value) => { setKeyword(value.trim()); setPage(1); }} /></div>
    <Table rowKey="id" loading={users.isLoading} dataSource={users.data?.items || []} scroll={{ x: 1050 }} pagination={{ current: page, pageSize, total: users.data?.total || 0, showSizeChanger: true, showTotal: (total) => `共 ${total} 位用户`, onChange: (next, size) => { setPage(next); setPageSize(size); } }} columns={[
      { title: '用户', key: 'user', fixed: 'left', width: 220, render: (_: unknown, row: UserRow) => <Space><Avatar src={row.avatar_url}>{(row.nickname || '微').slice(0, 1)}</Avatar><Button type="link" onClick={() => setSelected(row)}>{row.nickname || '微信用户'}</Button></Space> },
      { title: '用户编号', dataIndex: 'user_code', width: 140, render: (value: string) => value || '-' },
      { title: '金额记录', dataIndex: 'holdingsCount', align: 'center', width: 100 },
      { title: '关注', dataIndex: 'watchlistCount', align: 'center', width: 80 },
      { title: '反馈', dataIndex: 'feedbackCount', align: 'center', width: 80 },
      { title: '注册时间', dataIndex: 'created_at', width: 170, render: dateTime },
      { title: '最近登录', dataIndex: 'updated_at', width: 170, render: dateTime },
      { title: '操作', fixed: 'right', width: 90, render: (_: unknown, row: UserRow) => <Button type="link" onClick={() => setSelected(row)}>查看</Button> },
    ]} />
    <Drawer size="large" title="用户详情" open={!!selected} onClose={() => setSelected(null)} extra={<Button icon={<ReloadOutlined />} onClick={() => details.refetch()}>刷新</Button>} destroyOnHidden>
      {selected && <><Descriptions bordered size="small" column={{ xs: 1, sm: 2, lg: 3 }} items={[{ key: 'name', label: '昵称', children: selected.nickname || '微信用户' }, { key: 'code', label: '用户编号', children: selected.user_code || '-' }, { key: 'created', label: '注册时间', children: dateTime(selected.created_at) }, { key: 'openid', label: 'openid', span: 3, children: <Space><Typography.Text copyable={{ icon: <CopyOutlined /> }} code>{selected.openid}</Typography.Text></Space> }]} /><Tabs className="detail-tabs" items={tabs} /></>}
    </Drawer>
    <Modal title="编辑流水" open={!!editing} onCancel={() => setEditing(null)} onOk={() => form.submit()} confirmLoading={saveTransaction.isPending} destroyOnHidden><Form form={form} layout="vertical" onFinish={(values) => saveTransaction.mutate(values)}><Form.Item name="date" label="日期" rules={[{ required: true }]}><Input type="date" /></Form.Item><Space align="start" className="form-row"><Form.Item name="amount" label="金额"><InputNumber /></Form.Item><Form.Item name="costAmount" label="成本金额"><InputNumber /></Form.Item><Form.Item name="shares" label="份额"><InputNumber /></Form.Item><Form.Item name="nav" label="估值"><InputNumber /></Form.Item></Space><Form.Item name="remark" label="备注"><Input /></Form.Item><Form.Item name="reason" label="修改原因" rules={[{ required: true, message: '请输入修改原因' }]}><Input.TextArea placeholder="用于操作记录" /></Form.Item></Form></Modal>
  </div>;
}
