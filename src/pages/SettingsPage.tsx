import { CheckCircleFilled, ReloadOutlined, WarningFilled } from '@ant-design/icons';
import { App, Button, Card, Col, Empty, Flex, Input, Popconfirm, Row, Space, Spin, Switch, Tag, Typography } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { PageHeader } from '@/components/PageHeader';
import { adminApi } from '@/services/admin-api';
import type { SystemConfig } from '@/types';

const configLabels: Record<string, { label: string; help: string; type: 'boolean' | 'text'; warning?: string }> = {
  show_market_indices: { label: '显示行情指数', help: '控制金额记录页顶部是否显示行情指数。', type: 'boolean' },
  review_mode: { label: '提审模式', help: '开启后隐藏新增入口并暂停截图识别。', type: 'boolean', warning: '会立即影响小程序主要入口' },
  ocr_enabled: { label: '截图识别功能', help: '控制用户是否可以通过截图补全金额记录。', type: 'boolean' },
  support_entry_enabled: { label: '显示交流与支持入口', help: '控制“我的”页面中的相关入口。', type: 'boolean' },
  personal_safe_mode: { label: '安全展示模式', help: '使用更中性的工具界面和字段文案。', type: 'boolean' },
  community_qr_code: { label: '交流社群图片', help: '填写可公开访问的图片地址。', type: 'text' },
  support_qr_code: { label: '支持作者图片', help: '填写可公开访问的图片地址。', type: 'text' },
};

export default function SettingsPage() {
  const { message } = App.useApp();
  const client = useQueryClient();
  const configs = useQuery({ queryKey: ['configs'], queryFn: adminApi.configs });
  const health = useQuery({ queryKey: ['health'], queryFn: adminApi.health });
  const save = useMutation({ mutationFn: ({ item, value }: { item: SystemConfig; value: string }) => adminApi.saveConfig(item, value), onSuccess: () => { message.success('配置已保存并立即生效'); client.invalidateQueries({ queryKey: ['configs'] }); client.invalidateQueries({ queryKey: ['dashboard'] }); } });
  const known = (configs.data || []).filter((item) => configLabels[item.key]);
  const other = (configs.data || []).filter((item) => !configLabels[item.key]);

  function booleanControl(item: SystemConfig) {
    const meta = configLabels[item.key];
    const next = item.value === 'true' ? 'false' : 'true';
    const control = <Switch checked={item.value === 'true'} loading={save.isPending && save.variables?.item.key === item.key} onChange={() => save.mutate({ item, value: next })} />;
    return meta.warning ? <Popconfirm title={`确认${next === 'true' ? '开启' : '关闭'}${meta.label}？`} description={meta.warning} onConfirm={() => save.mutate({ item, value: next })}>{control}</Popconfirm> : control;
  }

  function configRow(item: SystemConfig, knownConfig: boolean) {
    const meta = knownConfig ? configLabels[item.key] : { label: item.key, help: item.description || '', type: 'text' as const };
    const control = meta.type === 'boolean' ? booleanControl(item) : <Input defaultValue={item.value} className="config-input" onPressEnter={(event) => save.mutate({ item, value: event.currentTarget.value.trim() })} suffix={<Typography.Text type="secondary">回车保存</Typography.Text>} />;
    return <Flex key={item.key} justify="space-between" align="center" gap={20} className="config-row"><div><Space>{meta.label}{'warning' in meta && meta.warning && <Tag color="orange">谨慎操作</Tag>}</Space><Typography.Text type="secondary" className="config-help">{meta.help}</Typography.Text></div>{control}</Flex>;
  }

  return <div><PageHeader title="系统设置" description="这些配置会直接影响小程序展示和可用功能" extra={<Button icon={<ReloadOutlined />} loading={configs.isFetching || health.isFetching} onClick={() => { configs.refetch(); health.refetch(); }}>刷新</Button>} />
    <Row gutter={[16, 16]}><Col xs={24} xl={16}><Card title="功能开关与资源"><Spin spinning={configs.isLoading}>{known.length ? known.map((item) => configRow(item, true)) : <Empty description="暂无配置，请先执行系统配置数据库脚本" />}</Spin></Card>
      {other.length > 0 && <Card title="其他配置" className="settings-card">{other.map((item) => configRow(item, false))}</Card>}
    </Col><Col xs={24} xl={8}><Card title="服务连接"><div className="status-list">{Object.entries(health.data?.checks || {}).map(([name, check]) => <Flex key={name} justify="space-between" align="center" className="status-row"><Typography.Text>{name === 'api' ? 'API 服务' : name === 'supabase' ? '数据库' : name === 'redis' ? '缓存服务' : name}</Typography.Text>{check.ok ? <Tag icon={<CheckCircleFilled />} color="success">正常</Tag> : <Tag icon={<WarningFilled />} color="error">异常</Tag>}</Flex>)}</div></Card></Col></Row>
  </div>;
}
