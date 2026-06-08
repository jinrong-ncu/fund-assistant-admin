import React, { useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { useChangelogs, useUpdateChangelog } from '../hooks/queries';
import { Changelog } from '../types';

const DETAIL_TYPES = [
  { value: 'feature', label: '功能' },
  { value: 'optimization', label: '优化' },
  { value: 'bugfix', label: '修复' },
  { value: 'notice', label: '说明' },
];

const iconButtonClass =
  'inline-flex items-center justify-center h-10 min-w-10 px-3 rounded-md bg-white border border-[#b8c4d8] text-[#263248] hover:bg-gray-50 hover:border-[#8fa0bb] transition-all disabled:opacity-50 disabled:pointer-events-none';
const actionButtonClass =
  'inline-flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-md bg-white border border-[#b8c4d8] text-[#263248] text-xs font-semibold hover:bg-gray-50 hover:border-[#8fa0bb] transition-all disabled:opacity-50 disabled:pointer-events-none';

function typeLabel(type: string) {
  return DETAIL_TYPES.find((item) => item.value === type)?.label || type || '说明';
}

function createDraft(log: Changelog): Changelog {
  return {
    ...log,
    details: log.details?.length
      ? log.details.map((detail) => ({ ...detail }))
      : [{ type: 'feature', content: '' }],
  };
}

export default function ChangelogPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useChangelogs();
  const updateMutation = useUpdateChangelog();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Changelog | null>(null);

  function startEdit(log: Changelog) {
    setEditingId(log.id);
    setDraft(createDraft(log));
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  function updateDetail(index: number, field: 'type' | 'content', value: string) {
    if (!draft) return;
    setDraft({
      ...draft,
      details: draft.details.map((detail, detailIndex) =>
        detailIndex === index ? { ...detail, [field]: value } : detail
      ),
    });
  }

  function addDetail() {
    if (!draft) return;
    setDraft({
      ...draft,
      details: [...draft.details, { type: 'feature', content: '' }],
    });
  }

  function removeDetail(index: number) {
    if (!draft || draft.details.length <= 1) return;
    setDraft({
      ...draft,
      details: draft.details.filter((_, detailIndex) => detailIndex !== index),
    });
  }

  async function saveDraft() {
    if (!draft) return;
    const next = {
      ...draft,
      details: draft.details
        .map((detail) => ({
          type: detail.type || 'feature',
          content: detail.content.trim(),
        }))
        .filter((detail) => detail.content),
    };
    await updateMutation.mutateAsync(next);
    cancelEdit();
  }

  const logs = data || [];
  const saving = updateMutation.isPending;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-textMain">更新日志</h2>
          <p className="text-xs text-textMuted mt-1">查看和维护小程序版本内容</p>
        </div>
        <button
          onClick={() => refetch()}
          className={iconButtonClass}
          disabled={isLoading || isFetching || saving}
          aria-label="刷新日志"
        >
          <RefreshCw size={18} className={isLoading || isFetching ? 'animate-spin text-primary' : ''} />
        </button>
      </div>

      {isError && (
        <div className="p-4 rounded-md bg-red-50 border border-red-200 text-xs text-red-600">
          加载更新日志失败: {error?.message || '未知错误'}
        </div>
      )}

      {updateMutation.isError && (
        <div className="p-4 rounded-md bg-red-50 border border-red-200 text-xs text-red-600">
          保存更新日志失败: {updateMutation.error?.message || '未知错误'}
        </div>
      )}

      <div className="relative bg-white border border-borderBase rounded-lg overflow-hidden shadow-sm">
        {(isLoading || isFetching) && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-2 text-primary">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xs font-semibold">正在努力加载数据...</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-[160px_150px_120px_minmax(360px,1fr)_168px] bg-[#f8fafd] border-b border-[#edf0f6] text-xs font-semibold text-[#5f6b7d] uppercase tracking-wider min-w-280">
          <div className="px-4 py-3">版本</div>
          <div className="px-4 py-3">日期</div>
          <div className="px-4 py-3">最新版本</div>
          <div className="px-4 py-3">更新内容</div>
          <div className="px-4 py-3 text-right">操作</div>
        </div>

        <div className="overflow-x-auto">
          {logs.length === 0 ? (
            <div className="px-4 py-12 text-center text-[#7b8798] text-sm">
              {isLoading ? '加载中...' : '暂无数据'}
            </div>
          ) : (
            <div className="min-w-260">
              {logs.map((log) => {
                const isEditing = editingId === log.id && draft;
                const visible = isEditing ? draft : log;
                return (
                  <div
                    key={log.id}
                    className="grid grid-cols-[160px_150px_120px_minmax(360px,1fr)_168px] border-b border-[#edf0f6] last:border-b-0 text-xs text-[#263248] hover:bg-[#edf3ff]/20"
                  >
                    <div className="px-4 py-4">
                      {isEditing ? (
                        <input
                          className="input-base w-full h-8 text-xs"
                          value={visible.version}
                          onChange={(event) => setDraft({ ...visible, version: event.target.value })}
                        />
                      ) : (
                        <span className="font-semibold text-textMain">{log.version}</span>
                      )}
                    </div>

                    <div className="px-4 py-4">
                      {isEditing ? (
                        <input
                          className="input-base w-full h-8 text-xs"
                          type="date"
                          value={visible.publish_date}
                          onChange={(event) => setDraft({ ...visible, publish_date: event.target.value })}
                        />
                      ) : (
                        log.publish_date
                      )}
                    </div>

                    <div className="px-4 py-4">
                      {isEditing ? (
                        <label className="inline-flex items-center gap-2 text-xs font-medium text-[#34425b]">
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={visible.is_latest}
                            onChange={(event) => setDraft({ ...visible, is_latest: event.target.checked })}
                          />
                          最新
                        </label>
                      ) : log.is_latest ? (
                        <span className="text-green-600 inline-flex items-center gap-1.5 font-medium text-xs">
                          <CheckCircle2 size={16} />
                          <span>最新</span>
                        </span>
                      ) : (
                        <span className="text-textMuted">-</span>
                      )}
                    </div>

                    <div className="px-4 py-4">
                      {isEditing ? (
                        <div className="grid gap-2">
                          {visible.details.map((detail, index) => (
                            <div key={`${log.id}-${index}`} className="grid grid-cols-[108px_minmax(0,1fr)_34px] gap-2">
                              <select
                                className="input-base h-8 text-xs"
                                value={detail.type}
                                onChange={(event) => updateDetail(index, 'type', event.target.value)}
                              >
                                {DETAIL_TYPES.map((item) => (
                                  <option key={item.value} value={item.value}>
                                    {item.label}
                                  </option>
                                ))}
                              </select>
                              <input
                                className="input-base h-8 text-xs w-full"
                                value={detail.content}
                                onChange={(event) => updateDetail(index, 'content', event.target.value)}
                              />
                              <button
                                className={iconButtonClass}
                                onClick={() => removeDetail(index)}
                                disabled={visible.details.length <= 1 || saving}
                                aria-label="删除条目"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                          <button
                            className="btn-secondary h-8 w-fit px-3 text-xs"
                            onClick={addDetail}
                            disabled={saving}
                          >
                            <Plus size={14} />
                            添加条目
                          </button>
                        </div>
                      ) : (
                        <div className="grid gap-2">
                          {log.details.map((detail, index) => (
                            <div key={`${log.id}-${index}`} className="flex items-start gap-2 leading-5">
                              <span className="shrink-0 px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-semibold text-[11px]">
                                {typeLabel(detail.type)}
                              </span>
                              <span className="text-[#34425b] break-all">{detail.content}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="px-4 py-4">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            className={actionButtonClass}
                            onClick={saveDraft}
                            disabled={saving}
                            aria-label="保存"
                          >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            保存
                          </button>
                          <button
                            className={actionButtonClass}
                            onClick={cancelEdit}
                            disabled={saving}
                            aria-label="取消"
                          >
                            <X size={16} />
                            取消
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          <button
                            className={actionButtonClass}
                            onClick={() => startEdit(log)}
                            disabled={saving}
                            aria-label="编辑"
                          >
                            <Edit3 size={16} />
                            编辑
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
