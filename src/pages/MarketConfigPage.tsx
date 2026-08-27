import {
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  SearchOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Collapse,
  Empty,
  Flex,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { PageHeader } from '@/components/PageHeader';
import { adminApi } from '@/services/admin-api';
import type {
  MarketLayout,
  MarketModuleLayout,
  MarketSectionLayout,
  MarketStock,
  MarketStockSearchResult,
  MarketTabLayout,
} from '@/types';

function nextId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function cloneLayout(layout: MarketLayout): MarketLayout {
  return structuredClone(layout);
}

export default function MarketConfigPage() {
  const client = useQueryClient();
  const config = useQuery({ queryKey: ['market-config'], queryFn: adminApi.marketConfig });
  const [layout, setLayout] = useState<MarketLayout | null>(null);
  const [dirty, setDirty] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<MarketStockSearchResult[]>([]);

  useEffect(() => {
    if (config.data?.layout && !dirty) setLayout(cloneLayout(config.data.layout));
  }, [config.data, dirty]);

  const stocks = config.data?.stocks || [];
  const stockMap = useMemo(() => new Map(stocks.map((stock) => [stock.secid, stock])), [stocks]);
  const stockOptions = useMemo(
    () =>
      stocks.map((stock) => ({
        value: stock.secid,
        label: `${stock.name} · ${stock.code} · ${stock.secid}`,
      })),
    [stocks]
  );

  const updateLayout = (mutator: (next: MarketLayout) => void) => {
    setLayout((current) => {
      if (!current) return current;
      const next = cloneLayout(current);
      mutator(next);
      return next;
    });
    setDirty(true);
  };

  const save = useMutation({
    mutationFn: () => {
      if (!layout) throw new Error('行情配置尚未加载');
      return adminApi.saveMarketLayout(layout);
    },
    onSuccess: async (result) => {
      message.success(`行情配置已保存，版本 ${result.version}`);
      setDirty(false);
      setLayout(cloneLayout(result.layout));
      await client.invalidateQueries({ queryKey: ['market-config'] });
    },
    onError: (error: Error) => message.error(error.message),
  });

  const search = useMutation({
    mutationFn: adminApi.searchMarketStocks,
    onSuccess: setSearchResults,
    onError: (error: Error) => message.error(error.message),
  });

  const addStock = useMutation({
    mutationFn: adminApi.resolveMarketStock,
    onSuccess: async (stock) => {
      message.success(`已加入 ${stock.name}（${stock.code}）`);
      await client.invalidateQueries({ queryKey: ['market-config'] });
    },
    onError: (error: Error) => message.error(error.message),
  });

  const refreshStock = useMutation({
    mutationFn: adminApi.refreshMarketStock,
    onSuccess: async (stock) => {
      message.success(`已从东财刷新 ${stock.name}`);
      await client.invalidateQueries({ queryKey: ['market-config'] });
    },
    onError: (error: Error) => message.error(error.message),
  });

  const deleteStock = useMutation({
    mutationFn: adminApi.deleteMarketStock,
    onSuccess: async () => {
      message.success('股票已删除');
      await client.invalidateQueries({ queryKey: ['market-config'] });
    },
    onError: (error: Error) => message.error(error.message),
  });

  const addTicker = () => {
    if (!stocks.length) return message.warning('请先向股票库添加股票');
    const used = new Set(layout?.tickers.map((item) => item.secid));
    const stock = stocks.find((item) => !used.has(item.secid));
    if (!stock) return message.warning('股票库中的股票都已添加到顶部指标');
    updateLayout((next) => {
      next.tickers.push({
        secid: stock.secid,
        label: stock.name,
        enabled: true,
        sortOrder: next.tickers.length * 10,
      });
    });
  };

  const addTab = () => {
    updateLayout((next) => {
      const key = nextId('tab');
      next.tabs.push({
        key,
        label: '新标签',
        enabled: true,
        sortOrder: next.tabs.length * 10,
        sections: [],
      });
      if (!next.defaultTabKey) next.defaultTabKey = key;
    });
  };

  const addSection = (tabIndex: number) => {
    updateLayout((next) => {
      const sections = next.tabs[tabIndex].sections;
      sections.push({
        id: nextId('section'),
        title: '新分组',
        enabled: true,
        sortOrder: sections.length * 10,
        modules: [],
      });
    });
  };

  const addModule = (tabIndex: number, sectionIndex: number) => {
    if (!stocks.length) return message.warning('请先向股票库添加股票');
    updateLayout((next) => {
      const modules = next.tabs[tabIndex].sections[sectionIndex].modules;
      modules.push({
        id: nextId('module'),
        title: '新模块',
        icon: '📈',
        type: 'DIRECT',
        enabled: true,
        sortOrder: modules.length * 10,
        stockSecids: [stocks[0].secid],
      });
    });
  };

  const tickerEditor = () => (
    <Card
      title="顶部行情指标"
      extra={<Button icon={<PlusOutlined />} onClick={addTicker}>添加指标</Button>}
      className="market-editor-card"
    >
      <Space orientation="vertical" size={12} className="full-width">
        {layout?.tickers.length ? layout.tickers.map((ticker, index) => (
          <Flex key={`${ticker.secid}-${index}`} gap={10} align="center" wrap>
            <Select
              showSearch
              optionFilterProp="label"
              options={stockOptions}
              value={ticker.secid}
              className="market-stock-select"
              onChange={(value) => updateLayout((next) => {
                next.tickers[index].secid = value;
                next.tickers[index].label = stockMap.get(value)?.name || next.tickers[index].label;
              })}
            />
            <Input
              value={ticker.label}
              placeholder="指标展示名"
              className="market-label-input"
              onChange={(event) => updateLayout((next) => { next.tickers[index].label = event.target.value; })}
            />
            <InputNumber
              value={ticker.sortOrder}
              addonBefore="排序"
              onChange={(value) => updateLayout((next) => { next.tickers[index].sortOrder = value || 0; })}
            />
            <Switch
              checked={ticker.enabled}
              checkedChildren="启用"
              unCheckedChildren="停用"
              onChange={(value) => updateLayout((next) => { next.tickers[index].enabled = value; })}
            />
            <Button danger type="text" icon={<DeleteOutlined />} onClick={() => updateLayout((next) => { next.tickers.splice(index, 1); })} />
          </Flex>
        )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无顶部指标" />}
      </Space>
    </Card>
  );

  const moduleEditor = (
    module: MarketModuleLayout,
    tabIndex: number,
    sectionIndex: number,
    moduleIndex: number
  ) => (
    <Card key={module.id} size="small" className="market-module-card">
      <Flex gap={10} align="center" wrap>
        <Input
          value={module.icon}
          className="market-icon-input"
          aria-label="模块图标"
          onChange={(event) => updateLayout((next) => { next.tabs[tabIndex].sections[sectionIndex].modules[moduleIndex].icon = event.target.value; })}
        />
        <Input
          value={module.title}
          className="market-title-input"
          placeholder="模块名称"
          onChange={(event) => updateLayout((next) => { next.tabs[tabIndex].sections[sectionIndex].modules[moduleIndex].title = event.target.value; })}
        />
        <Select
          value={module.type}
          options={[{ value: 'DIRECT', label: '单标的直读' }, { value: 'AVERAGE', label: '成分平均' }]}
          className="market-type-select"
          onChange={(value) => updateLayout((next) => { next.tabs[tabIndex].sections[sectionIndex].modules[moduleIndex].type = value; })}
        />
        <InputNumber
          value={module.sortOrder}
          addonBefore="排序"
          onChange={(value) => updateLayout((next) => { next.tabs[tabIndex].sections[sectionIndex].modules[moduleIndex].sortOrder = value || 0; })}
        />
        <Switch
          checked={module.enabled}
          checkedChildren="启用"
          unCheckedChildren="停用"
          onChange={(value) => updateLayout((next) => { next.tabs[tabIndex].sections[sectionIndex].modules[moduleIndex].enabled = value; })}
        />
        <Popconfirm title="删除这个模块？" onConfirm={() => updateLayout((next) => { next.tabs[tabIndex].sections[sectionIndex].modules.splice(moduleIndex, 1); })}>
          <Button danger type="text" icon={<DeleteOutlined />} />
        </Popconfirm>
      </Flex>
      <Select
        mode="multiple"
        showSearch
        optionFilterProp="label"
        options={stockOptions}
        value={module.stockSecids}
        placeholder="选择这个模块包含的股票"
        className="full-width market-module-stocks"
        onChange={(value) => updateLayout((next) => { next.tabs[tabIndex].sections[sectionIndex].modules[moduleIndex].stockSecids = value; })}
      />
      <Typography.Text type="secondary" className="market-field-help">
        单标的直读必须选择 1 只；成分平均至少选择 2 只。名称统一来自股票库。
      </Typography.Text>
    </Card>
  );

  const sectionEditor = (
    section: MarketSectionLayout,
    tabIndex: number,
    sectionIndex: number
  ) => (
    <Card
      key={section.id}
      size="small"
      className="market-section-card"
      title={
        <Flex gap={8} align="center" wrap>
          <Input
            value={section.title}
            className="market-section-title-input"
            onChange={(event) => updateLayout((next) => { next.tabs[tabIndex].sections[sectionIndex].title = event.target.value; })}
          />
          <InputNumber
            value={section.sortOrder}
            addonBefore="排序"
            onChange={(value) => updateLayout((next) => { next.tabs[tabIndex].sections[sectionIndex].sortOrder = value || 0; })}
          />
          <Switch
            checked={section.enabled}
            checkedChildren="启用"
            unCheckedChildren="停用"
            onChange={(value) => updateLayout((next) => { next.tabs[tabIndex].sections[sectionIndex].enabled = value; })}
          />
        </Flex>
      }
      extra={
        <Space>
          <Button size="small" icon={<PlusOutlined />} onClick={() => addModule(tabIndex, sectionIndex)}>添加模块</Button>
          <Popconfirm title="删除这个分组及其全部模块？" onConfirm={() => updateLayout((next) => { next.tabs[tabIndex].sections.splice(sectionIndex, 1); })}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      }
    >
      <Space orientation="vertical" size={10} className="full-width">
        {section.modules.length ? section.modules.map((module, moduleIndex) => moduleEditor(module, tabIndex, sectionIndex, moduleIndex)) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无模块" />}
      </Space>
    </Card>
  );

  const tabEditor = (tab: MarketTabLayout, tabIndex: number) => ({
    key: tab.key,
    label: <Space><span>{tab.label}</span>{tab.enabled ? <Tag color="green">启用</Tag> : <Tag>停用</Tag>}</Space>,
    children: (
      <Space orientation="vertical" size={14} className="full-width">
        <Flex gap={10} align="center" wrap>
          <Input
            value={tab.label}
            addonBefore="Tab 名称"
            className="market-tab-name-input"
            onChange={(event) => updateLayout((next) => { next.tabs[tabIndex].label = event.target.value; })}
          />
          <Typography.Text code>{tab.key}</Typography.Text>
          <InputNumber
            value={tab.sortOrder}
            addonBefore="排序"
            onChange={(value) => updateLayout((next) => { next.tabs[tabIndex].sortOrder = value || 0; })}
          />
          <Switch
            checked={tab.enabled}
            checkedChildren="启用"
            unCheckedChildren="停用"
            onChange={(value) => updateLayout((next) => { next.tabs[tabIndex].enabled = value; })}
          />
          <Button icon={<PlusOutlined />} onClick={() => addSection(tabIndex)}>添加分组</Button>
          <Popconfirm title="删除这个 Tab 及其全部配置？" onConfirm={() => updateLayout((next) => {
            next.tabs.splice(tabIndex, 1);
            if (next.defaultTabKey === tab.key) next.defaultTabKey = next.tabs[0]?.key || '';
          })}>
            <Button danger icon={<DeleteOutlined />}>删除 Tab</Button>
          </Popconfirm>
        </Flex>
        {tab.sections.length ? tab.sections.map((section, sectionIndex) => sectionEditor(section, tabIndex, sectionIndex)) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无分组" />}
      </Space>
    ),
  });

  const layoutPanel = (
    <Spin spinning={config.isLoading}>
      {layout ? (
        <Space orientation="vertical" size={16} className="full-width">
          <Alert
            type="info"
            showIcon
            message="保存会整体校验并一次性生效"
            description="股票名称只来自股票库；页面编排保存失败时，线上配置不会发生部分变化。"
          />
          {tickerEditor()}
          <Card
            title="Tab 与模块编排"
            className="market-editor-card"
            extra={<Button icon={<PlusOutlined />} onClick={addTab}>添加 Tab</Button>}
          >
            <Flex gap={12} align="center" className="market-default-tab">
              <Typography.Text strong>默认 Tab</Typography.Text>
              <Select
                value={layout.defaultTabKey}
                options={layout.tabs.filter((tab) => tab.enabled).map((tab) => ({ value: tab.key, label: tab.label }))}
                onChange={(value) => updateLayout((next) => { next.defaultTabKey = value; })}
              />
            </Flex>
            <Collapse items={layout.tabs.map(tabEditor)} />
          </Card>
        </Space>
      ) : <Empty description="尚未初始化行情配置表" />}
    </Spin>
  );

  const stockColumns = [
    { title: '中文名称', dataIndex: 'name', width: 220, render: (value: string) => <Typography.Text strong>{value}</Typography.Text> },
    { title: '代码', dataIndex: 'code', width: 120 },
    { title: '东财 secid', dataIndex: 'secid', width: 140, render: (value: string) => <Typography.Text code copyable>{value}</Typography.Text> },
    { title: '市场', width: 170, render: (_: unknown, row: MarketStock) => <Space><Tag>{row.securityType || row.market}</Tag><span>{row.exchange}</span></Space> },
    { title: '更新时间', dataIndex: 'sourceUpdatedAt', width: 180, render: (value: string | null) => value ? new Date(value).toLocaleString('zh-CN') : '迁移数据' },
    { title: '操作', width: 150, render: (_: unknown, row: MarketStock) => <Space>
      <Button type="link" icon={<SyncOutlined />} loading={refreshStock.isPending} onClick={() => refreshStock.mutate(row.secid)}>刷新</Button>
      <Popconfirm title="删除这只股票？" description="仍被模块引用时服务端会拒绝删除。" onConfirm={() => deleteStock.mutate(row.secid)}>
        <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
      </Popconfirm>
    </Space> },
  ];

  const searchColumns = [
    { title: '名称', dataIndex: 'name', width: 260 },
    { title: '代码', dataIndex: 'code', width: 120 },
    { title: '市场', dataIndex: 'securityType', width: 100 },
    { title: '交易所', dataIndex: 'exchange', width: 120 },
    { title: 'secid', dataIndex: 'secid', width: 150, render: (value: string) => <Typography.Text code>{value}</Typography.Text> },
    { title: '操作', width: 130, render: (_: unknown, row: MarketStockSearchResult) => {
      const exists = stockMap.has(row.secid);
      return <Button type="link" disabled={exists} loading={addStock.isPending} onClick={() => addStock.mutate(row.secid)}>{exists ? '已在库' : '加入股票库'}</Button>;
    } },
  ];

  const stockPanel = (
    <Space orientation="vertical" size={16} className="full-width">
      <Card title="从东财添加股票">
        <Alert type="success" showIcon message="名称由服务端从东财查询并写入，后台不提供手工名称输入。" className="market-stock-alert" />
        <Input.Search
          value={keyword}
          allowClear
          enterButton={<><SearchOutlined /> 搜索东财</>}
          loading={search.isPending}
          placeholder="输入股票代码或中文名称，例如 NVDA、英伟达"
          onChange={(event) => setKeyword(event.target.value)}
          onSearch={(value) => value.trim() && search.mutate(value.trim())}
        />
        {searchResults.length > 0 && <Table rowKey="secid" className="market-search-results" pagination={false} dataSource={searchResults} columns={searchColumns} scroll={{ x: 900 }} />}
      </Card>
      <Card title={`股票库（${stocks.length}）`}>
        <Table rowKey="secid" loading={config.isLoading} dataSource={stocks} columns={stockColumns} pagination={{ pageSize: 20, showSizeChanger: true }} scroll={{ x: 980 }} />
      </Card>
    </Space>
  );

  return (
    <div>
      <PageHeader
        title="行情配置"
        description={`股票库与页面编排分开维护${config.data ? ` · 当前版本 ${config.data.version}` : ''}`}
        extra={
          <Space>
            {dirty && <Tag color="orange">有未保存修改</Tag>}
            <Button icon={<ReloadOutlined />} loading={config.isFetching} onClick={() => config.refetch()}>刷新</Button>
            <Button type="primary" icon={<SaveOutlined />} disabled={!dirty || !layout} loading={save.isPending} onClick={() => save.mutate()}>保存并生效</Button>
          </Space>
        }
      />
      <Tabs items={[
        { key: 'layout', label: '页面编排', children: layoutPanel },
        { key: 'stocks', label: `股票库（${stocks.length}）`, children: stockPanel },
      ]} />
    </div>
  );
}
