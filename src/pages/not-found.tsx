import { Link } from '@tanstack/react-router';
import { ShieldAlert } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f7fb] p-6 text-center">
      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 border border-red-100">
        <ShieldAlert size={36} />
      </div>
      <h1 className="text-4xl font-extrabold text-textMain tracking-tight mb-2">404</h1>
      <h2 className="text-xl font-bold text-textMain mb-2">页面未找到</h2>
      <p className="text-[#66738a] max-w-sm mb-6 text-sm">
        您访问的的页面地址可能输入有误或该页面已被删除。
      </p>
      <Link
        to="/dashboard"
        className="bg-primary text-white hover:bg-primary-hover border border-transparent shadow-sm inline-flex items-center justify-center gap-1.5 h-9.5 px-5 rounded-md font-semibold text-sm transition-all decoration-none active:scale-95"
      >
        返回控制台
      </Link>
    </div>
  );
}
