import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { App, Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, Tabs, Tag } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { PageHeader } from '@/components/PageHeader';
import { adminApi } from '@/services/admin-api';
import type { Changelog, HotFund, ResourceEntry } from '@/types';

type Editor = { type: 'fund'; data?: HotFund } | { type: 'changelog'; data?: Changelog } | { type: 'resource'; data?: ResourceEntry } | null;

export default function ContentPage() {
  const { message } = App.useApp();
  const client = useQueryClient();
  const [editor, setEditor] = useState<Editor>(null);
  const [form] = Form.useForm();
  const funds = useQuery({ queryKey: ['hot-funds'], queryFn: adminApi.hotFunds });
  const changelogs = useQuery({ queryKey: ['changelogs'], queryFn: adminApi.changelogs });
  const resources = useQuery({ queryKey: ['resources'], queryFn: adminApi.resources });
  const invalidate = () => { client.invalidateQueries({ queryKey: ['hot-funds'] }); client.invalidateQueries({ queryKey: ['changelogs'] }); client.invalidateQueries({ queryKey: ['resources'] }); client.invalidateQueries({ queryKey: ['dashboard'] }); };
  const save = useMutation({ mutationFn: async (values: Record<string, unknown>) => { if (editor?.type === 'fund') return adminApi.saveHotFund({ fundCode: values.fundCode, fundName: values.fundName, sortOrder: values.sortOrder, isActive: values.isActive, reason: '后台编辑热门内容' }, editor.data?.id); if (editor?.type === 'changelog') { const details = String(values.details || '').split('\n').map((content) => content.trim()).filter(Boolean).map((content) => ({ type: 'feature', content })); return adminApi.saveChangelog({ version: values.version, publishDate: values.publishDate, isLatest: values.isLatest, details, reason: '后台编辑版本日志' }, editor.data?.id); } return adminApi.saveResource({ category: values.category, channel: values.channel, title: values.title, description: values.description, imageUrl: values.imageUrl, actionType: values.actionType, actionValue: values.actionValue, enabled: values.enabled, sortOrder: values.sortOrder, reason: '后台编辑资源' }, editor?.data?.id); }, onSuccess: () => { message.success('内容已保存'); setEditor(null); invalidate(); } });
  const remove = useMutation({ mutationFn: ({ type, id }: { type: string; id: string | number }) => type === 'fund' ? adminApi.deleteHotFund(Number(id)) : type === 'changelog' ? adminApi.deleteChangelog(Number(id)) : adminApi.deleteResource(String(id)), onSuccess: () => { message.success('内容已删除'); invalidate(); } });

  function open(next: NonNullable<Editor>) {
    setEditor(next);
    if (next.type === 'fund') form.setFieldsValue({ fundCode: next.data?.fund_code, fundName: next.data?.fund_name, sortOrder: next.data?.sort_order ?? 0, isActive: next.data?.is_active ?? true });
    if (next.type === 'changelog') form.setFieldsValue({ version: next.data?.version, publishDate: next.data?.publish_date, isLatest: next.data?.is_latest ?? false, details: next.data?.details.map((item) => item.content).join('\n') });
    if (next.type === 'resource') form.setFieldsValue({ category: next.data?.category || 'community', channel: next.data?.channel, title: next.data?.title, description: next.data?.description, imageUrl: next.data?.image_url, actionType: next.data?.action_type || 'preview_image', actionValue: next.data?.action_value, enabled: next.data?.enabled ?? true, sortOrder: next.data?.sort_order ?? 0 });
  }

  const action = (type: 'fund' | 'changelog' | 'resource', data: HotFund | Changelog | ResourceEntry) => <Space><Button type="link" icon={<EditOutlined />} onClick={() => open({ type, data } as NonNullable<Editor>)}>编辑</Button><Popconfirm title="确定删除？" description="删除后将立即影响小程序展示。" onConfirm={() => remove.mutate({ type, id: data.id })}><Button type="link" danger icon={<DeleteOutlined />}>删除</Button></Popconfirm></Space>;
  const tabItems = [
    { key: 'funds', label: '热门内容', children: <><div className="tab-actions"><Button type="primary" icon={<PlusOutlined />} onClick={() => open({ type: 'fund' })}>新增</Button></div><Table rowKey="id" loading={funds.isLoading} pagination={false} dataSource={funds.data || []} columns={[{ title: '排序', dataIndex: 'sort_order', width: 80 }, { title: '代码', dataIndex: 'fund_code', width: 120 }, { title: '名称', dataIndex: 'fund_name' }, { title: '状态', dataIndex: 'is_active', width: 100, render: (value: boolean) => <Tag color={value ? 'green' : 'default'}>{value ? '启用' : '停用'}</Tag> }, { title: '操作', width: 160, render: (_: unknown, row: HotFund) => action('fund', row) }]} /></> },
    { key: 'changelog', label: '版本日志', children: <><div className="tab-actions"><Button type="primary" icon={<PlusOutlined />} onClick={() => open({ type: 'changelog' })}>新增版本</Button></div><Table rowKey="id" loading={changelogs.isLoading} pagination={false} dataSource={changelogs.data || []} columns={[{ title: '版本', dataIndex: 'version', width: 130 }, { title: '发布日期', dataIndex: 'publish_date', width: 140 }, { title: '最新版本', dataIndex: 'is_latest', width: 100, render: (value: boolean) => value ? <Tag color="blue">最新</Tag> : '-' }, { title: '更新内容', dataIndex: 'details', render: (value: Changelog['details']) => value.map((item) => item.content).join('；') }, { title: '操作', width: 160, render: (_: unknown, row: Changelog) => action('changelog', row) }]} /></> },
    { key: 'resources', label: '交流与支持资源', children: <><div className="tab-actions"><Button type="primary" icon={<PlusOutlined />} onClick={() => open({ type: 'resource' })}>新增资源</Button></div><Table rowKey="id" loading={resources.isLoading} pagination={false} dataSource={resources.data || []} columns={[{ title: '分类', dataIndex: 'category', width: 100, render: (value: string) => value === 'community' ? '交流' : '支持' }, { title: '渠道', dataIndex: 'channel', width: 130 }, { title: '标题', dataIndex: 'title' }, { title: '状态', dataIndex: 'enabled', width: 90, render: (value: boolean) => <Tag color={value ? 'green' : 'default'}>{value ? '启用' : '停用'}</Tag> }, { title: '排序', dataIndex: 'sort_order', width: 80 }, { title: '操作', width: 160, render: (_: unknown, row: ResourceEntry) => action('resource', row) }]} /></> },
  ];

  const title = editor?.type === 'fund' ? '热门内容' : editor?.type === 'changelog' ? '版本日志' : '资源';
  return <div><PageHeader title="内容配置" description="管理小程序中的热门推荐、版本日志和交流资源" extra={<Button icon={<ReloadOutlined />} onClick={() => { funds.refetch(); changelogs.refetch(); resources.refetch(); }}>刷新</Button>} /><Tabs items={tabItems} />
    <Modal title={`${editor && 'data' in editor && editor.data ? '编辑' : '新增'}${title}`} open={!!editor} onCancel={() => setEditor(null)} onOk={() => form.submit()} confirmLoading={save.isPending} destroyOnHidden width={620}><Form form={form} layout="vertical" onFinish={(values) => save.mutate(values)}>
      {editor?.type === 'fund' && <><Form.Item name="fundCode" label="代码" rules={[{ required: true }]}><Input maxLength={10} /></Form.Item><Form.Item name="fundName" label="名称" rules={[{ required: true }]}><Input /></Form.Item><Space align="start" className="form-row"><Form.Item name="sortOrder" label="排序"><InputNumber min={0} /></Form.Item><Form.Item name="isActive" label="启用" valuePropName="checked"><Switch /></Form.Item></Space></>}
      {editor?.type === 'changelog' && <><Form.Item name="version" label="版本号" rules={[{ required: true }]}><Input placeholder="例如 v1.6.0" /></Form.Item><Form.Item name="publishDate" label="发布日期" rules={[{ required: true }]}><Input type="date" /></Form.Item><Form.Item name="isLatest" label="设为最新版本" valuePropName="checked"><Switch /></Form.Item><Form.Item name="details" label="更新内容" extra="每行一条" rules={[{ required: true }]}><Input.TextArea rows={6} /></Form.Item></>}
      {editor?.type === 'resource' && <><Form.Item name="category" label="分类" rules={[{ required: true }]}><Select options={[{ value: 'community', label: '交流' }, { value: 'support', label: '支持' }]} /></Form.Item><Form.Item name="channel" label="渠道标识" rules={[{ required: true }]}><Input placeholder="例如 wechat_group" /></Form.Item><Form.Item name="title" label="标题" rules={[{ required: true }]}><Input /></Form.Item><Form.Item name="description" label="说明"><Input.TextArea rows={2} /></Form.Item><Form.Item name="imageUrl" label="图片地址"><Input /></Form.Item><Form.Item name="actionType" label="点击动作"><Select options={[{ value: 'preview_image', label: '预览图片' }, { value: 'copy_text', label: '复制文字' }, { value: 'navigate', label: '页面跳转' }]} /></Form.Item><Form.Item name="actionValue" label="动作内容"><Input /></Form.Item><Space align="start" className="form-row"><Form.Item name="sortOrder" label="排序"><InputNumber min={0} /></Form.Item><Form.Item name="enabled" label="启用" valuePropName="checked"><Switch /></Form.Item></Space></>}
    </Form></Modal>
  </div>;
}
