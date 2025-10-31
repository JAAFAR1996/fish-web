'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { User } from '@supabase/supabase-js';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react';

import {
  Badge,
  Button,
  Icon,
  Input,
  Modal,
  ModalBody,
  ModalFooter,
} from '@/components/ui';
import { AdminDataTable, type ColumnDef } from '@/components/admin/admin-data-table';
import { OrderStatusForm } from '@/components/admin/order-status-form';
import { getOrdersForAdmin } from '@/lib/admin/order-actions';
import type { Locale, Order, OrderStatus } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface OrdersSectionProps {
  admin: User;
  className?: string;
}

export function OrdersSection({ admin, className }: OrdersSectionProps) {
  void admin;
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const locale = useLocale() as Locale;
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshPending, startRefresh] = useTransition();

  const normalizeKey = (key: string) =>
    key.startsWith('admin.') ? key.slice('admin.'.length) : key;

  const loadOrders = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await getOrdersForAdmin(
        statusFilter === 'all' ? undefined : { status: statusFilter },
      );
      setOrders(data);
    } catch (err) {
      console.error('Failed to load admin orders', err);
      setError('orders.errors.updateFailed');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const handleStatusUpdate = (order: Order) => {
    setSelectedOrder(order);
    setStatusModalOpen(true);
  };

  const handlePrint = (order: Order) => {
    console.info('Printing invoice for order', order.id);
    window.print();
  };

  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        key: 'order_number',
        header: t('orders.orderDetails'),
        accessor: (order) => order.order_number,
        sortable: true,
      },
      {
        key: 'customer',
        header: t('users.userDetails'),
        accessor: (order) => order.guest_email ?? order.user_id ?? '',
        render: (order) => order.guest_email ?? order.user_id ?? t('users.viewUser'),
      },
      {
        key: 'created_at',
        header: t('orders.createdAt'),
        accessor: (order) => new Date(order.created_at).getTime(),
        render: (order) => new Date(order.created_at).toLocaleDateString(locale),
        sortable: true,
      },
      {
        key: 'total',
        header: t('orders.total'),
        accessor: (order) => order.total,
        render: (order) => formatCurrency(order.total, locale),
        sortable: true,
      },
      {
        key: 'status',
        header: t('orders.updateStatus'),
        render: (order) => {
          const variant =
            order.status === 'pending'
              ? 'warning'
              : order.status === 'confirmed'
                ? 'info'
                : order.status === 'shipped'
                  ? 'info'
                  : order.status === 'delivered'
                    ? 'success'
                    : 'destructive';
          return (
            <Badge variant={variant as any}>
              {t(`orders.statusLabels.${order.status}` as Parameters<typeof t>[0])}
            </Badge>
          );
        },
      },
      {
        key: 'actions',
        header: '',
        render: (order) => (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(event) => {
                event.stopPropagation();
                handleStatusUpdate(order);
              }}
            >
              <Icon name="pen" className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(event) => {
                event.stopPropagation();
                handlePrint(order);
              }}
            >
              <Icon name="printer" className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [locale, t, tCommon],
  );

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) {
      return orders;
    }

    const term = searchQuery.toLowerCase();
    return orders.filter((order) =>
      [order.order_number, order.guest_email, order.user_id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [orders, searchQuery]);

  return (
    <section className={className}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{t('orders.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('orders.orderDetails')}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('common.search')}
            className="w-full sm:w-60"
          />
          <select
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-aqua-500 focus:outline-none focus:ring-2 focus:ring-aqua-200"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as OrderStatus | 'all')}
          >
            <option value="all">{t('orders.allOrders')}</option>
            <option value="pending">{t('orders.statusLabels.pending')}</option>
            <option value="confirmed">{t('orders.statusLabels.confirmed')}</option>
            <option value="shipped">{t('orders.statusLabels.shipped')}</option>
            <option value="delivered">{t('orders.statusLabels.delivered')}</option>
            <option value="cancelled">{t('orders.statusLabels.cancelled')}</option>
          </select>
          <Button
            type="button"
            variant="outline"
            onClick={() => startRefresh(async () => {
              await loadOrders();
            })}
            disabled={refreshPending}
          >
            <Icon name="refresh-cw" className="mr-2 h-4 w-4" />
            {t('common.refresh')}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {t(normalizeKey(error) as Parameters<typeof t>[0])}
        </div>
      )}

      {isLoading || refreshPending ? (
        <div className="flex min-h-[240px] items-center justify-center text-sm text-muted-foreground">
          {tCommon('loading')}
        </div>
      ) : (
        <div className="mt-6">
          <AdminDataTable
            data={filteredOrders}
            columns={columns}
            searchQuery={searchQuery}
            pagination
            itemsPerPage={20}
            onRowClick={handleStatusUpdate}
          />
        </div>
      )}

      <Modal
        open={statusModalOpen}
        onOpenChange={(open) => {
          setStatusModalOpen(open);
          if (!open) {
            setSelectedOrder(null);
          }
        }}
        title={t('orders.updateStatus')}
        size="md"
      >
        <ModalBody>
          {selectedOrder && (
            <OrderStatusForm
              order={selectedOrder}
              onCancel={() => setStatusModalOpen(false)}
              onSuccess={() => {
                startRefresh(async () => {
                  await loadOrders();
                  setStatusModalOpen(false);
                  setSelectedOrder(null);
                });
              }}
            />
          )}
        </ModalBody>
        {!selectedOrder && (
          <ModalFooter>
            <Button type="button" onClick={() => setStatusModalOpen(false)}>
              {t('common.close') ?? 'Close'}
            </Button>
          </ModalFooter>
        )}
      </Modal>
    </section>
  );
}
