import React from 'react';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useResourceMutation, useResources } from '../hooks/queries';
import { ResourceEntry } from '../types';

const emptyForm = { category: 'community', channel: 'wechat_group', title: '', description: '', imageUrl: '', actionType: 'preview_image', actionValue: '', enabled: true, sortOrder: 0 };

export default function ResourcesPage() {
  const { data = [], isLoading, refetch, isFetching } = useResources();
  const mutation = useResourceMutation();
  const [form, setForm] = React.useState<any>(emptyForm);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState('');

  const submit = () => {
    if (!form.title || !form.channel) {
      setFormError('请填写资源标题和渠道标识');
      return;
    }
    setFormError('');
    mutation.mutate({ method: editingId ? 'PUT' : 'POST', id: editingId || undefined, payload: form }, {
      onSuccess: () => { setForm(emptyForm); setEditingId(null); },
      onError: (error: any) => setFormError(error?.message || '保存资源失败，请稍后再试'),
    });
  };

  const edit = (item: ResourceEntry) => {
    setEditingId(item.id);
    setForm({ category: item.category, channel: item.channel, title: item.title, description: item.description || '', imageUrl: item.image_url || '', actionType: item.action_type, actionValue: item.action_value || '', enabled: item.enabled, sortOrder: item.sort_order });
  };

  return <div className="flex flex-col gap-6">
    <div className="flex items-center justify-between"><div><h2 className="text-xl font-bold text-textMain">资源入口</h2><p className="mt-1 text-xs text-textMuted">管理使用交流、支持作者及未来扩展入口</p></div><button onClick={() => refetch()} className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#d4dbea] bg-white text-[#34425b]" disabled={isFetching}><RefreshCw size={16} className={isFetching ? 'animate-spin text-primary' : ''} /></button></div>
    <div className="rounded-xl border border-borderBase bg-white p-5">
      <div className="mb-4 flex items-center gap-2"><Plus size={18} className="text-primary" /><h3 className="font-bold">{editingId ? '编辑资源' : '新增资源'}</h3></div>
      <div className="grid gap-3 md:grid-cols-2">
        <select className="h-10 rounded-md border border-borderBase px-3 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option value="community">使用交流</option><option value="support">支持作者</option></select>
        <input className="h-10 rounded-md border border-borderBase px-3 text-sm" placeholder="渠道标识，如 wechat_group" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} />
        <input className="h-10 rounded-md border border-borderBase px-3 text-sm" placeholder="标题" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input className="h-10 rounded-md border border-borderBase px-3 text-sm" placeholder="副标题" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className="h-10 rounded-md border border-borderBase px-3 text-sm md:col-span-2" placeholder="二维码图片 URL" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
        <input className="h-10 rounded-md border border-borderBase px-3 text-sm" placeholder="排序，数字越小越靠前" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
      </div>
      {formError && <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</div>}
      <div className="mt-4 flex gap-2"><button onClick={submit} disabled={mutation.isPending} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white">{mutation.isPending ? '保存中...' : editingId ? '保存修改' : '新增资源'}</button>{editingId && <button onClick={() => { setEditingId(null); setForm(emptyForm); setFormError(''); }} className="rounded-md border border-borderBase px-4 py-2 text-sm">取消</button>}</div>
    </div>
    <div className="overflow-hidden rounded-xl border border-borderBase bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-textMuted"><tr><th className="px-4 py-3">分类</th><th className="px-4 py-3">名称</th><th className="px-4 py-3">渠道</th><th className="px-4 py-3">状态</th><th className="px-4 py-3">操作</th></tr></thead><tbody>{isLoading ? <tr><td className="px-4 py-8 text-center" colSpan={5}>加载中...</td></tr> : data.map((item) => <tr key={item.id} className="border-t border-borderBase"><td className="px-4 py-3">{item.category === 'community' ? '使用交流' : '支持作者'}</td><td className="px-4 py-3 font-semibold">{item.title}<div className="text-xs text-textMuted">{item.description}</div></td><td className="px-4 py-3 font-mono text-xs">{item.channel}</td><td className="px-4 py-3">{item.enabled ? '已启用' : '已停用'}</td><td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => edit(item)} className="rounded border border-borderBase px-3 py-1">编辑</button><button onClick={() => mutation.mutate({ method: 'DELETE', id: item.id, payload: {} })} className="rounded border border-red-200 px-3 py-1 text-red-600"><Trash2 size={14} /></button></div></td></tr>)}</tbody></table></div>
  </div>;
}
