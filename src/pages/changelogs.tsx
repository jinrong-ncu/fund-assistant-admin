import React, { useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useChangelogs, useUpdateChangelog } from '../hooks/queries';
import { Changelog } from '../types';

const DETAIL_TYPES = [
  { value: 'feature', label: '功能' },
  { value: 'optimization', label: '优化' },
  { value: 'bugfix', label: '修复' },
  { value: 'notice', label: '说明' },
];

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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h5" sx={{ fontSize: 22, fontWeight: 850, color: 'text.primary' }}>
            更新日志
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.75, color: 'text.secondary', fontSize: 13 }}>
            查看和维护小程序版本内容
          </Typography>
        </Box>
        <Tooltip title="刷新日志">
          <span>
            <IconButton
              onClick={() => refetch()}
              disabled={isLoading || isFetching || saving}
              aria-label="刷新日志"
              sx={{ width: 42, height: 42, border: '1px solid', borderColor: '#cfd7e6', borderRadius: 2 }}
            >
              <RefreshCw size={19} className={isLoading || isFetching ? 'animate-spin text-primary' : ''} />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {isError && (
        <Alert severity="error">
          加载更新日志失败: {error?.message || '未知错误'}
        </Alert>
      )}

      {updateMutation.isError && (
        <Alert severity="error">
          保存更新日志失败: {updateMutation.error?.message || '未知错误'}
        </Alert>
      )}

      <Card variant="outlined" sx={{ position: 'relative', overflow: 'hidden' }}>
        {(isLoading || isFetching) && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-2 text-primary">
              <CircularProgress size={32} thickness={4} />
              <span className="text-xs font-semibold">正在努力加载数据...</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-[160px_150px_120px_minmax(420px,1fr)_168px] bg-[#f8fafd] border-b border-[#dfe4ee] text-xs font-semibold text-[#5f6b7d] min-w-300">
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
            <div className="min-w-300">
              {logs.map((log) => {
                const isEditing = editingId === log.id && draft;
                const visible = isEditing ? draft : log;
                return (
                  <div
                    key={log.id}
                    className="grid grid-cols-[160px_150px_120px_minmax(420px,1fr)_168px] border-b border-[#edf0f6] last:border-b-0 text-xs text-[#263248] hover:bg-[#f8fbff]"
                  >
                    <div className="px-4 py-4">
                      {isEditing ? (
                        <TextField
                          size="small"
                          value={visible.version}
                          onChange={(event) => setDraft({ ...visible, version: event.target.value })}
                          fullWidth
                          slotProps={{ input: { sx: { fontSize: 13, fontWeight: 700 } } }}
                        />
                      ) : (
                        <span className="font-semibold text-textMain">{log.version}</span>
                      )}
                    </div>

                    <div className="px-4 py-4">
                      {isEditing ? (
                        <TextField
                          size="small"
                          type="date"
                          value={visible.publish_date}
                          onChange={(event) => setDraft({ ...visible, publish_date: event.target.value })}
                          fullWidth
                          slotProps={{ input: { sx: { fontSize: 13 } } }}
                        />
                      ) : (
                        log.publish_date
                      )}
                    </div>

                    <div className="px-4 py-4">
                      {isEditing ? (
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={visible.is_latest}
                              onChange={(event) => setDraft({ ...visible, is_latest: event.target.checked })}
                            />
                          }
                          label="最新"
                          sx={{ m: 0, '& .MuiFormControlLabel-label': { fontSize: 13, fontWeight: 700 } }}
                        />
                      ) : log.is_latest ? (
                        <Chip
                          icon={<CheckCircle2 size={15} />}
                          label="最新"
                          size="small"
                          color="success"
                          variant="outlined"
                          sx={{ fontWeight: 800 }}
                        />
                      ) : (
                        <span className="text-textMuted">-</span>
                      )}
                    </div>

                    <div className="px-4 py-4">
                      {isEditing ? (
                        <div className="grid gap-2.5">
                          {visible.details.map((detail, index) => (
                            <div key={`${log.id}-${index}`} className="grid grid-cols-[116px_minmax(0,1fr)_40px] gap-2.5">
                              <Select
                                size="small"
                                value={detail.type}
                                onChange={(event) => updateDetail(index, 'type', event.target.value)}
                                sx={{ fontSize: 13 }}
                              >
                                {DETAIL_TYPES.map((item) => (
                                  <MenuItem key={item.value} value={item.value}>
                                    {item.label}
                                  </MenuItem>
                                ))}
                              </Select>
                              <TextField
                                size="small"
                                value={detail.content}
                                onChange={(event) => updateDetail(index, 'content', event.target.value)}
                                fullWidth
                                slotProps={{ input: { sx: { fontSize: 13 } } }}
                              />
                              <Tooltip title="删除条目">
                                <span>
                                  <IconButton
                                    onClick={() => removeDetail(index)}
                                    disabled={visible.details.length <= 1 || saving}
                                    aria-label="删除条目"
                                    size="small"
                                    sx={{ width: 38, height: 38, border: '1px solid', borderColor: '#cfd7e6', borderRadius: 2 }}
                                  >
                                    <Trash2 size={16} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </div>
                          ))}
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Plus size={15} />}
                            onClick={addDetail}
                            disabled={saving}
                            sx={{ width: 'fit-content', fontSize: 12, fontWeight: 800 }}
                          >
                            添加条目
                          </Button>
                        </div>
                      ) : (
                        <div className="grid gap-2.25">
                          {log.details.map((detail, index) => (
                            <div key={`${log.id}-${index}`} className="flex items-start gap-2 leading-5">
                              <Chip
                                label={typeLabel(detail.type)}
                                size="small"
                                variant="outlined"
                                sx={{
                                  flexShrink: 0,
                                  height: 22,
                                  borderRadius: 1.5,
                                  bgcolor: '#f8fafd',
                                  fontSize: 11,
                                  fontWeight: 800,
                                }}
                              />
                              <span className="text-[#34425b] break-all">{detail.content}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="px-4 py-4">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="contained"
                            size="medium"
                            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
                            onClick={saveDraft}
                            disabled={saving}
                            aria-label="保存"
                          >
                            保存
                          </Button>
                          <Button
                            variant="outlined"
                            size="medium"
                            startIcon={<X size={16} />}
                            onClick={cancelEdit}
                            disabled={saving}
                            aria-label="取消"
                          >
                            取消
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          <Button
                            variant="outlined"
                            size="medium"
                            startIcon={<Edit3 size={16} />}
                            onClick={() => startEdit(log)}
                            disabled={saving}
                            aria-label="编辑"
                          >
                            编辑
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
