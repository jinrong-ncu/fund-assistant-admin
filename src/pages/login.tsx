import React from 'react';
import { Shield } from 'lucide-react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useAuth } from '../lib/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().trim().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码'),
});
type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { redirect?: string };
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'jinrong.liu@email.ncu.edu.cn', password: '' },
  });

  async function onSubmit(values: LoginValues) {
    try {
      await login(values.email, values.password);
      // Redirect to the saved URL or the dashboard home page
      navigate({ to: search.redirect || '/dashboard' });
    } catch (err: unknown) {
      setError('root', { message: err instanceof Error ? err.message : '登录失败，请检查邮箱或密码' });
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f7fafc] to-[#e8edf5] p-6">
      <section className="w-full max-w-95 bg-white border border-[#d8deea] rounded-xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-primary-light border border-primary-border rounded-lg text-primary flex items-center justify-center">
            <Shield size={28} />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-textMain mb-6">估值助手后台</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#5f6b7d]">
            邮箱
            <input
              className="bg-white border border-[#cfd7e6] rounded-md h-9.5 px-3 text-textMain text-sm outline-none transition-all focus:border-primary focus:ring-3 focus:ring-primary/15"
              {...register('email')}
              placeholder="请输入邮箱"
              required
            />
          </label>
          {errors.email && <p className="text-xs text-red-600 font-medium -mt-2">{errors.email.message}</p>}
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#5f6b7d]">
            密码
            <input
              className="bg-white border border-[#cfd7e6] rounded-md h-9.5 px-3 text-textMain text-sm outline-none transition-all focus:border-primary focus:ring-3 focus:ring-primary/15"
              {...register('password')}
              type="password"
              autoComplete="current-password"
              placeholder="请输入密码"
              required
            />
          </label>
          {errors.password && <p className="text-xs text-red-600 font-medium -mt-2">{errors.password.message}</p>}
          {errors.root && <p className="text-xs text-red-600 font-medium my-1">{errors.root.message}</p>}
          <button
            className="w-full bg-primary text-white hover:bg-primary-hover border border-transparent shadow-sm shadow-primary/10 inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-md font-semibold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer mt-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? '登录中...' : '登录'}
          </button>
        </form>
      </section>
    </main>
  );
}
