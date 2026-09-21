'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { TransactionRow } from '@/types';

const transactionSchema = z.object({
  trade_date: z.string().min(1, '请选择交易日期'),
  transaction_type: z.enum(['buy', 'sell']),
  amount: z.number().min(0, '交易金额不能小于0'),
  cost_amount: z.number().min(0, '成本金额不能小于0'),
  shares: z.number().min(0, '份额不能小于0'),
  nav: z.number().min(0, '估值净值不能小于0'),
  is_buy_point: z.boolean(),
  remark: z.string().optional(),
  reason: z.string().min(2, '请输入修改原因（必填，用于操作审计）'),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface TransactionEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: TransactionRow | null;
  loading?: boolean;
  onSubmit: (values: TransactionFormValues) => Promise<void>;
}

export function TransactionEditDialog({
  open,
  onOpenChange,
  transaction,
  loading = false,
  onSubmit,
}: TransactionEditDialogProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      trade_date: '',
      transaction_type: 'buy',
      amount: 0,
      cost_amount: 0,
      shares: 0,
      nav: 1,
      is_buy_point: false,
      remark: '',
      reason: '',
    },
  });

  useEffect(() => {
    if (transaction) {
      reset({
        trade_date: transaction.trade_date,
        transaction_type: transaction.transaction_type,
        amount: Number(transaction.amount) || 0,
        cost_amount: Number(transaction.cost_amount) || 0,
        shares: Number(transaction.shares) || 0,
        nav: Number(transaction.nav) || 1,
        is_buy_point: Boolean(transaction.is_buy_point),
        remark: transaction.remark || '',
        reason: '',
      });
    }
  }, [transaction, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>编辑交易流水</DialogTitle>
            <DialogDescription className="text-xs">
              基金代码: <strong className="text-foreground">{transaction?.fund_code}</strong> · 修改后系统将自动重新计算持仓汇总
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="trade_date" className="text-xs">交易日期</Label>
                <Input
                  id="trade_date"
                  type="date"
                  className="h-8 text-xs"
                  {...register('trade_date')}
                />
                {errors.trade_date && (
                  <p className="text-[11px] text-destructive">{errors.trade_date.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="transaction_type" className="text-xs">交易类型</Label>
                <Select
                  value={watch('transaction_type')}
                  onValueChange={(val) => setValue('transaction_type', val as 'buy' | 'sell')}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">买入</SelectItem>
                    <SelectItem value="sell">卖出</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="amount" className="text-xs">交易金额 (元)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  className="h-8 text-xs tabular-nums"
                  {...register('amount', { valueAsNumber: true })}
                />
                {errors.amount && (
                  <p className="text-[11px] text-destructive">{errors.amount.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="cost_amount" className="text-xs">成本金额 (元)</Label>
                <Input
                  id="cost_amount"
                  type="number"
                  step="0.01"
                  className="h-8 text-xs tabular-nums"
                  {...register('cost_amount', { valueAsNumber: true })}
                />
                {errors.cost_amount && (
                  <p className="text-[11px] text-destructive">{errors.cost_amount.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="shares" className="text-xs">持有份额</Label>
                <Input
                  id="shares"
                  type="number"
                  step="0.01"
                  className="h-8 text-xs tabular-nums"
                  {...register('shares', { valueAsNumber: true })}
                />
                {errors.shares && (
                  <p className="text-[11px] text-destructive">{errors.shares.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="nav" className="text-xs">交易净值</Label>
                <Input
                  id="nav"
                  type="number"
                  step="0.0001"
                  className="h-8 text-xs tabular-nums"
                  {...register('nav', { valueAsNumber: true })}
                />
                {errors.nav && (
                  <p className="text-[11px] text-destructive">{errors.nav.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="remark" className="text-xs">流水备注</Label>
              <Input
                id="remark"
                placeholder="用户或后台备注说明"
                className="h-8 text-xs"
                {...register('remark')}
              />
            </div>

            <div className="space-y-1 pt-1">
              <Label htmlFor="reason" className="text-xs font-semibold text-foreground">
                修改原因 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reason"
                rows={2}
                placeholder="请输入流水修改原因（写入操作审计日志，必填）"
                className="text-xs"
                {...register('reason')}
              />
              {errors.reason && (
                <p className="text-[11px] text-destructive">{errors.reason.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? '正在保存...' : '保存修改'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
