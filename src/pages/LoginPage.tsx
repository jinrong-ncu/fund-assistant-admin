import { LockOutlined, MailOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/AuthProvider';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  async function submit(values: { email: string; password: string }) {
    setError('');
    try {
      await login(values.email.trim(), values.password);
      navigate('/', { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '登录失败，请检查账号和密码');
    }
  }

  return (
    <main className="login-page">
      <Card className="login-card" variant="borderless">
        <div className="login-brand"><SafetyCertificateOutlined /></div>
        <Typography.Title level={2}>估值助手后台</Typography.Title>
        <Typography.Paragraph type="secondary">登录后管理用户数据、反馈和小程序配置</Typography.Paragraph>
        {error && <Alert type="error" showIcon message={error} className="login-error" />}
        <Form layout="vertical" size="large" onFinish={submit} requiredMark={false}>
          <Form.Item label="邮箱" name="email" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '邮箱格式不正确' }]}>
            <Input prefix={<MailOutlined />} placeholder="管理员邮箱" autoComplete="username" />
          </Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="管理员密码" autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>登录</Button>
        </Form>
      </Card>
    </main>
  );
}
