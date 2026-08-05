import { CheckCircleFilled, ClockCircleOutlined, DatabaseOutlined, HeartOutlined, MessageOutlined, ReloadOutlined, StarOutlined, TeamOutlined, UserAddOutlined, WarningFilled } from '@ant-design/icons';
import { Button, Card, Col, Flex, Row, Space, Spin, Statistic, Tag, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';

import { PageHeader } from '@/components/PageHeader';
import { adminApi } from '@/services/admin-api';

export default function DashboardPage() {
  const summary = useQuery({ queryKey: ['dashboard'], queryFn: adminApi.dashboard });
  const health = useQuery({ queryKey: ['health'], queryFn: adminApi.health, refetchInterval: 60_000 });
  const data = summary.data;
  const metrics = [
    { title: '全部用户', value: data?.users ?? 0, icon: <TeamOutlined />, color: '#1677ff' },
    { title: '今日新增', value: data?.newUsersToday ?? 0, icon: <UserAddOutlined />, color: '#13c2c2' },
    { title: '有金额记录', value: data?.holdingsUsers ?? 0, icon: <DatabaseOutlined />, color: '#722ed1' },
    { title: '有关注清单', value: data?.watchlistUsers ?? 0, icon: <StarOutlined />, color: '#fa8c16' },
    { title: '待处理反馈', value: data?.feedback?.open ?? 0, suffix: `/ ${data?.feedback?.total ?? 0}`, icon: <MessageOutlined />, color: '#eb2f96' },
    { title: '启用热门内容', value: data?.hotFundsActive ?? 0, icon: <HeartOutlined />, color: '#52c41a' },
  ];

  return <div><PageHeader title="工作台" description="快速了解小程序数据和服务运行状态" extra={<Button icon={<ReloadOutlined />} loading={summary.isFetching || health.isFetching} onClick={() => { summary.refetch(); health.refetch(); }}>刷新</Button>} />
    <Spin spinning={summary.isLoading}>
      <Row gutter={[16, 16]}>{metrics.map((item) => <Col xs={24} sm={12} xl={8} xxl={4} key={item.title}><Card className="metric-card"><Flex justify="space-between" align="center"><Statistic title={item.title} value={item.value} suffix={item.suffix} /><div className="metric-icon" style={{ color: item.color, background: `${item.color}12` }}>{item.icon}</div></Flex></Card></Col>)}</Row>
    </Spin>
    <Row gutter={[16, 16]} className="dashboard-section">
      <Col xs={24} xl={14}><Card title="系统状态" extra={<Typography.Text type="secondary"><ClockCircleOutlined /> 每分钟自动检查</Typography.Text>}><div className="status-list">{Object.entries(health.data?.checks || {}).map(([name, check]) => <Flex key={name} justify="space-between" align="center" className="status-row"><div><Typography.Text strong>{name === 'api' ? 'API 服务' : name === 'supabase' ? '数据库' : name === 'redis' ? '缓存服务' : name}</Typography.Text><Typography.Text type="secondary" className="status-description">{check.optional ? '可选服务，不影响主要功能' : check.configured === false ? '尚未配置' : '已连接'}</Typography.Text></div>{check.ok ? <Tag icon={<CheckCircleFilled />} color="success">正常</Tag> : <Tag icon={<WarningFilled />} color="error">异常</Tag>}</Flex>)}</div></Card></Col>
      <Col xs={24} xl={10}><Card title="当前关键开关"><Space orientation="vertical" size={16} className="full-width"><Flex justify="space-between"><Typography.Text>行情指数</Typography.Text><Tag color={data?.showMarketIndices ? 'green' : 'default'}>{data?.showMarketIndices ? '已开启' : '已关闭'}</Tag></Flex><Flex justify="space-between"><Typography.Text>安全展示模式</Typography.Text><Tag color={data?.personalSafeMode ? 'blue' : 'default'}>{data?.personalSafeMode ? '已开启' : '已关闭'}</Tag></Flex><Typography.Text type="secondary">更多小程序开关请前往“系统设置”。</Typography.Text></Space></Card></Col>
    </Row>
  </div>;
}
