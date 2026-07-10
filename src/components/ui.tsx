import React from 'react';
import { X } from 'lucide-react';

export function Button({ className = '', variant = 'default', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' | 'ghost' | 'destructive' }) {
  const variants = {
    default: 'bg-primary text-white hover:bg-primary-hover',
    outline: 'border border-borderBase bg-white text-textMain hover:bg-slate-50',
    ghost: 'text-textMuted hover:bg-slate-100 hover:text-textMain',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
  };
  return <button className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${className}`} {...props} />;
}

export function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`h-9.5 w-full rounded-md border border-borderBase bg-white px-3 text-sm text-textMain outline-none transition focus:border-primary focus:ring-3 focus:ring-primary/15 ${className}`} {...props} />;
}

export function Card({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-xl border border-borderBase bg-white shadow-sm ${className}`} {...props} />;
}

export function Badge({ children, variant = 'default', className = '' }: { children: React.ReactNode; variant?: 'default' | 'success' | 'muted' | 'danger'; className?: string }) {
  const styles = { default: 'bg-primary-light text-primary', success: 'bg-emerald-50 text-emerald-700', muted: 'bg-slate-100 text-slate-600', danger: 'bg-red-50 text-red-700' };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles[variant]} ${className}`}>{children}</span>;
}

export function Dialog({ open, onClose, children, className = '' }: { open: boolean; onClose: () => void; children: React.ReactNode; className?: string }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <div className={`relative max-h-[90vh] w-full overflow-auto rounded-xl border border-borderBase bg-white shadow-2xl ${className}`}>
      <button onClick={onClose} className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-textMuted hover:bg-slate-100" aria-label="关闭"><X size={18} /></button>
      {children}
    </div>
  </div>;
}

export function Tabs({ items, value, onChange }: { items: Array<{ value: string; label: string }>; value: string; onChange: (value: string) => void }) {
  return <div className="flex gap-1 border-b border-borderBase px-5">{items.map((item) => <button key={item.value} onClick={() => onChange(item.value)} className={`border-b-2 px-3 py-3 text-sm font-semibold transition ${value === item.value ? 'border-primary text-primary' : 'border-transparent text-textMuted hover:text-textMain'}`}>{item.label}</button>)}</div>;
}

export function Avatar({ src, children, className = '' }: { src?: string; children: React.ReactNode; className?: string }) {
  return <div className={`grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-light text-sm font-extrabold text-primary ${className}`}>{src ? <img src={src} alt="" className="h-full w-full object-cover" /> : children}</div>;
}
