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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { formatDateTime } from '@/lib/formatters';
import type { FeedbackRow } from '@/types';

const feedbackProcessSchema = z.object({
  status: z.enum(['open', 'processing', 'resolved', 'ignored']),
  priority: z.enum(['low', 'normal', 'high']),
  admin_note: z.string().max(500, '备注不能超过500字').optional(),
});

type FeedbackProcessValues = z.infer<typeof feedbackProcessSchema>;

interface FeedbackProcessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feedback: FeedbackRow | null;
  loading?: boolean;
  onSubmit: (values: FeedbackProcessValues) => Promise<void>;
}

export function FeedbackProcessDialog({
  open,
  onOpenChange,
  feedback,
  loading = false,
  onSubmit,
}: FeedbackProcessDialogProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FeedbackProcessValues>({
    resolver: zodResolver(feedbackProcessSchema),
    defaultValues: {
      status: 'open',
      priority: 'normal',
      admin_note: '',
    },
  });

  const noteValue = watch('admin_note') || '';

  useEffect(() => {
    if (feedback) {
      reset({
        status: feedback.status,
        priority: feedback.priority,
        admin_note: feedback.admin_note || '',
      });
    }
  }, [feedback, reset]);

  if (!feedback) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>处理用户反馈工单</DialogTitle>
            <DialogDescription className="text-xs">
              更新处理状态、优先级并记录管理员内部说明
            </DialogDescription>
          </DialogHeader>

          {/* User Feedback Detail Overview Box */}
          <div className="my-3 space-y-3 rounded-md border border-border bg-muted/30 p-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={feedback.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {(feedback.nickname || '用').slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-semibold text-foreground">
                  {feedback.nickname || '微信用户'}
                </span>
                <span className="bg-muted px-1.5 py-0.5 rounded font-mono text-[10px] text-muted-foreground">
                  {feedback.category}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {formatDateTime(feedback.created_at)}
              </span>
            </div>

            <div className="rounded bg-background p-2.5 text-foreground leading-relaxed border border-border/50">
              {feedback.content}
            </div>
          </div>

          <div className="grid gap-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="status" className="text-xs">
                  处理状态 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch('status')}
                  onValueChange={(val) =>
                    setValue('status', val as FeedbackProcessValues['status'])
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">待处理 (Open)</SelectItem>
                    <SelectItem value="processing">处理中 (Processing)</SelectItem>
                    <SelectItem value="resolved">已解决 (Resolved)</SelectItem>
                    <SelectItem value="ignored">已忽略 (Ignored)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="priority" className="text-xs">
                  优先级 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch('priority')}
                  onValueChange={(val) =>
                    setValue('priority', val as FeedbackProcessValues['priority'])
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">低优先级</SelectItem>
                    <SelectItem value="normal">普通优先级</SelectItem>
                    <SelectItem value="high">高优先级</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="admin_note" className="text-xs">
                  处理备注与回复记录
                </Label>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {noteValue.length} / 500
                </span>
              </div>
              <Textarea
                id="admin_note"
                rows={3}
                placeholder="记录内部定位排查结果、修复版本计划或回复给用户的处理意见（最多500字）"
                className="text-xs"
                {...register('admin_note')}
              />
              {errors.admin_note && (
                <p className="text-[11px] text-destructive">{errors.admin_note.message}</p>
              )}
            </div>
          </div>

          <DialogFooter className="mt-2">
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
              {loading ? '正在保存...' : '保存流转'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
