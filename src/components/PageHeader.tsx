import { Flex, Typography } from 'antd';
import type { ReactNode } from 'react';

export function PageHeader({ title, description, extra }: { title: string; description?: string; extra?: ReactNode }) {
  return <Flex justify="space-between" align="flex-start" gap={16} className="page-heading"><div><Typography.Title level={2}>{title}</Typography.Title>{description && <Typography.Text type="secondary">{description}</Typography.Text>}</div>{extra}</Flex>;
}
