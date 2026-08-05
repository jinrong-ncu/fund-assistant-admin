import {
  AppstoreOutlined,
  DashboardOutlined,
  FileSearchOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MessageOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Layout, Menu, Space, Tag, Typography } from 'antd';
import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/AuthProvider';

const { Header, Sider, Content } = Layout;
const navigation = [
  { key: '/', icon: <DashboardOutlined />, label: '工作台' },
  { key: '/users', icon: <UserOutlined />, label: '用户数据' },
  { key: '/feedback', icon: <MessageOutlined />, label: '反馈处理' },
  { key: '/content', icon: <AppstoreOutlined />, label: '内容配置' },
  { key: '/settings', icon: <SettingOutlined />, label: '系统设置' },
  { key: '/audit', icon: <FileSearchOutlined />, label: '操作记录' },
];

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAuth();
  const selectedKey = navigation.find((item) => item.key !== '/' && location.pathname.startsWith(item.key))?.key || '/';

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <Layout className="admin-shell">
      <Sider collapsible collapsed={collapsed} trigger={null} width={232} className="admin-sider">
        <div className="brand"><div className="brand-symbol">估</div>{!collapsed && <div><strong>估值助手</strong><span>管理后台</span></div>}</div>
        <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]} items={navigation} onClick={({ key }) => navigate(key)} />
      </Sider>
      <Layout>
        <Header className="admin-header">
          <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed((value) => !value)} />
          <Space size={12}>
            <Tag color="blue">单人管理</Tag>
            <Avatar size="small" icon={<UserOutlined />} />
            <Typography.Text className="admin-email">{admin?.email}</Typography.Text>
            <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout}>退出</Button>
          </Space>
        </Header>
        <Content className="admin-content"><Outlet /></Content>
      </Layout>
    </Layout>
  );
}
