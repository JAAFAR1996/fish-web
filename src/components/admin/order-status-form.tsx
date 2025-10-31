'use client';

import { useTranslations } from 'next-intl';
import {
  useState,
  useTransition,
} from 'react';

import { Button, Input } from '@/components/ui';
import { updateOrderStatusAction } from '@/lib/admin/order-actions';
import { validateOrderUpdate } from '@/lib/admin/validation';
import type { Order, OrderStatus, OrderUpdateData } from '@/types';

interface OrderStatusFormProps {
  order: Order;
  onSuccess: () => void;
  onCancel: () => void;
}

const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export function OrderStatusForm({ order, onSuccess, onCancel }: OrderStatusFormProps) {
  const t = useTranslations('admin');
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number ?? '');
  const [carrier, setCarrier] = useState(order.carrier ?? '');
  const [notes, setNotes] = useState(order.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const translateKey = (key: string) => {
    const normalized = key.startsWith('admin.') ? key.slice('admin.'.length) : key;
    return t(normalized as Parameters<typeof t>[0]);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setFeedback(null);

    const payload: OrderUpdateData = {
      status,
      tracking_number: trackingNumber || null,
      carrier: carrier || null,
      notes: notes || null,
    };

    const validation = validateOrderUpdate(payload);
    if (!validation.valid) {
      setErrors(validation.errors);
      setFeedback('orders.errors.updateFailed');
      return;
    }

    startTransition(async () => {
      const response = await updateOrderStatusAction(order.id, payload);

      if (!response.success) {
        setFeedback(response.error ? response.error : 'orders.errors.updateFailed');
        return;
      }

      onSuccess();
    });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="order-status">
            {t('orders.updateStatus')}
          </label>
          <select
            id="order-status"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-aqua-500 focus:outline-none focus:ring-2 focus:ring-aqua-200"
            value={status}
            onChange={(event) => setStatus(event.target.value as OrderStatus)}
          >
            {STATUSES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.status && (
            <p className="text-xs text-destructive">{translateKey(errors.status)}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="tracking-number">
            {t('orders.trackingNumber')}
          </label>
          <Input
            id="tracking-number"
            value={trackingNumber}
            onChange={(event) => setTrackingNumber(event.target.value)}
            placeholder="0000000000"
          />
          {errors.tracking_number && (
            <p className="text-xs text-destructive">
              {translateKey(errors.tracking_number)}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="carrier">
            {t('orders.carrier')}
          </label>
          <Input
            id="carrier"
            value={carrier}
            onChange={(event) => setCarrier(event.target.value)}
            placeholder="DHL / Aramex"
          />
          {errors.carrier && (
            <p className="text-xs text-destructive">{translateKey(errors.carrier)}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="notes">
            {t('orders.notes') ?? 'Notes'}
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={t('orders.notes') ?? 'Notes'}
            className="min-h-[120px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm transition focus:border-aqua-500 focus:outline-none focus:ring-2 focus:ring-aqua-200"
            rows={4}
          />
        </div>
      </div>

      {feedback && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {translateKey(feedback)}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isPending}>
          {t('orders.updateStatus')}
        </Button>
      </div>
    </form>
  );
}
