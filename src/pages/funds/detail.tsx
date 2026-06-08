import React from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { ArrowLeft, Star, TrendingUp, ShieldAlert, Award, FileText } from 'lucide-react';
import { useHotFunds } from '../../hooks/queries';

export default function FundDetailPage() {
  const { fundCode } = useParams({ from: '/_admin-layout/funds/$fundCode' });
  const { data: hotFunds, isLoading } = useHotFunds();

  const fund = hotFunds?.find((item) => item.fund_code === fundCode);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-xs text-textMuted gap-2">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span>正在加载基金详情...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back navigation & Page title */}
      <div>
        <Link
          to="/funds"
          className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline bg-transparent border-0 cursor-pointer decoration-none p-0 mb-3"
        >
          <ArrowLeft size={14} />
          <span>返回热门基金列表</span>
        </Link>
        <h2 className="text-xl font-bold text-textMain flex items-center gap-2">
          <span>基金详情: {fund ? fund.fund_name : '未添加推荐'}</span>
          <span className="text-sm font-mono font-medium text-textMuted bg-gray-200/60 px-2 py-0.5 rounded">
            {fundCode}
          </span>
        </h2>
        <p className="text-xs text-textMuted mt-1">基金关键指标、基本参数与持仓分析</p>
      </div>

      {/* Grid: Details */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* Left Side: General & Mock Performance */}
        <div className="flex flex-col gap-6">
          {/* Status and core info card */}
          <div className="card-base">
            <h3 className="text-sm font-bold text-textMain mb-4 flex items-center gap-2 border-b border-[#edf0f6] pb-3">
              <Award size={16} className="text-primary" />
              <span>推荐规则参数</span>
            </h3>
            {fund ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                <div>
                  <span className="text-[11px] font-medium text-textMuted block">系统内部 ID</span>
                  <span className="text-sm font-bold text-textMain block mt-1.5">{fund.id}</span>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-textMuted block">排序权重</span>
                  <span className="text-sm font-bold text-textMain block mt-1.5">{fund.sort_order}</span>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-textMuted block">当前推荐状态</span>
                  <span className="mt-1.5 block">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        fund.is_active
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-gray-100 text-gray-500 border border-gray-200'
                      }`}
                    >
                      {fund.is_active ? '已启用' : '已停用'}
                    </span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-[#b42318] bg-red-50 border border-red-100 rounded-lg p-3">
                <ShieldAlert size={16} />
                <span>该基金代码当前不属于热门推荐基金。</span>
              </div>
            )}
          </div>

          {/* Performance Card */}
          <div className="card-base">
            <h3 className="text-sm font-bold text-textMain mb-4 flex items-center gap-2 border-b border-[#edf0f6] pb-3">
              <TrendingUp size={16} className="text-primary" />
              <span>历史业绩（模拟）</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-gray-50 rounded-lg border border-[#edf2f7]">
                <span className="text-[11px] font-medium text-textMuted">近1个月</span>
                <span className="text-lg font-bold text-green-600 block mt-1">+4.25%</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-[#edf2f7]">
                <span className="text-[11px] font-medium text-textMuted">近3个月</span>
                <span className="text-lg font-bold text-green-600 block mt-1">+12.80%</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-[#edf2f7]">
                <span className="text-[11px] font-medium text-textMuted">近6个月</span>
                <span className="text-lg font-bold text-[#b42318] block mt-1">-1.15%</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-[#edf2f7]">
                <span className="text-[11px] font-medium text-textMuted">成立以来</span>
                <span className="text-lg font-bold text-green-600 block mt-1">+148.62%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Fund parameters summary */}
        <aside className="card-base self-start flex flex-col gap-4">
          <h3 className="text-sm font-bold text-textMain border-b border-[#edf0f6] pb-3 flex items-center gap-2">
            <FileText size={16} className="text-primary" />
            <span>基本要素</span>
          </h3>
          <div className="flex flex-col gap-3.5 text-xs">
            <div className="flex justify-between border-b border-[#f5f7fb] pb-2">
              <span className="text-textMuted">基金类型</span>
              <span className="font-medium text-textMain">混合型-偏股</span>
            </div>
            <div className="flex justify-between border-b border-[#f5f7fb] pb-2">
              <span className="text-textMuted">起购金额</span>
              <span className="font-medium text-textMain">10.00 元</span>
            </div>
            <div className="flex justify-between border-b border-[#f5f7fb] pb-2">
              <span className="text-textMuted">托管人</span>
              <span className="font-medium text-textMain">估值助手托管行</span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-textMuted">风险等级</span>
              <span className="font-semibold text-yellow-600">中高风险 (R3)</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
