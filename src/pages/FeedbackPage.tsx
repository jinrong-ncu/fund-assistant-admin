import { EditOutlined, ReloadOutlined } from '@ant-design/icons';
import { App, Avatar, Button, Form, Input, Modal, Select, Space, Table, Tag, Typography } from 'antd';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { PageHeader } from '@/components/PageHeader';
import { adminApi } from '@/services/admin-api';
import type { FeedbackRow } from '@/types';

const statusMeta: Record<string, { text: string; color: string }> = { open: { text: '待处理', color: 'orange' }, processing: { text: '处理中', color: 'blue' }, resolved: { text: '已解决', color: 'green' }, ignored: { text: '已忽略', color: 'default' } };
const priorityMeta: Record<string, { text: string; color: string }> = { low: { text: '低', color: 'default' }, normal: { text: '普通', color: 'blue' }, high: { text: '高', color: 'red' } };
const dateTime = (value: string) => new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

export default function FeedbackPage() {
  const { message } = App.useApp();
  const client = useQueryClient();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [editing, setEditing] = useState<FeedbackRow | null>(null);
  const [form] = Form.useForm();
  const query = useQuery({ queryKey: ['feedback', status, page, pageSize], queryFn: () => adminApi.feedback({ status, page, pageSize }), placeholderData: keepPreviousData });
  const update = useMutation({ mutationFn: (values: Partial<FeedbackRow>) => adminApi.updateFeedback(editing!.id, values), onSuccess: () => { message.success('反馈状态已更新'); setEditing(null); client.invalidateQueries({ queryKey: ['feedback'] }); client.invalidateQueries({ queryKey: ['dashboard'] }); } });

  function edit(row: FeedbackRow) {
    setEditing(row);
    form.setFieldsValue({ status: row.status || 'open', priority: row.priority || 'normal', adminNote: row.admin_note || '' });
  }

  return <div><PageHeader title="反馈处理" description="集中查看用户建议并记录处理结果" extra={<Button icon={<ReloadOutlined />} loading={query.isFetching} onClick={() => query.refetch()}>刷新</Button>} />
    <div className="table-toolbar"><Select value={status} onChange={(value) => { setStatus(value); setPage(1); }} options={[{ value: '', label: '全部状态' }, ...Object.entries(statusMeta).map(([value, meta]) => ({ value, label: meta.text }))]} style={{ width: 160 }} /></div>
    <Table rowKey="id" loading={query.isLoading} dataSource={query.data?.items || []} scroll={{ x: 1050 }} pagination={{ current: page, pageSize, total: query.data?.total || 0, showSizeChanger: true, showTotal: (total) => `共 ${total} 条反馈`, onChange: (next, size) => { setPage(next); setPageSize(size); } }} columns={[
      { title: '用户', key: 'user', width: 180, render: (_: unknown, row: FeedbackRow) => <Space><Avatar size="small" src={row.avatar_url}>{(row.nickname || '微').slice(0, 1)}</Avatar><Typography.Text>{row.nickname || '微信用户'}</Typography.Text></Space> },
      { title: '分类', dataIndex: 'category', width: 100 },
      { title: '内容', dataIndex: 'content', ellipsis: true, width: 360 },
      { title: '优先级', dataIndex: 'priority', width: 90, render: (value: string) => { const meta = priorityMeta[value] || priorityMeta.normal; return <Tag color={meta.color}>{meta.text}</Tag>; } },
      { title: '状态', dataIndex: 'status', width: 100, render: (value: string) => { const meta = statusMeta[value] || statusMeta.open; return <Tag color={meta.color}>{meta.text}</Tag>; } },
      { title: '提交时间', dataIndex: 'created_at', width: 170, render: dateTime },
      { title: '操作', fixed: 'right', width: 100, render: (_: unknown, row: FeedbackRow) => <Button type="link" icon={<EditOutlined />} onClick={() => edit(row)}>处理</Button> },
    ]} />
    <Modal title="处理反馈" open={!!editing} onCancel={() => setEditing(null)} onOk={() => form.submit()} confirmLoading={update.isPending} destroyOnHidden><Typography.Paragraph>{editing?.content}</Typography.Paragraph><Form form={form} layout="vertical" onFinish={(values) => update.mutate(values)}><Form.Item name="status" label="处理状态" rules={[{ required: true }]}><Select options={Object.entries(statusMeta).map(([value, meta]) => ({ value, label: meta.text }))} /></Form.Item><Form.Item name="priority" label="优先级" rules={[{ required: true }]}><Select options={Object.entries(priorityMeta).map(([value, meta]) => ({ value, label: meta.text }))} /></Form.Item><Form.Item name="adminNote" label="处理备注"><Input.TextArea rows={4} maxLength={500} showCount /></Form.Item></Form></Modal>
  </div>;
}
