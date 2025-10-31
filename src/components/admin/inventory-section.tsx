'use client';

import type { User } from '@supabase/supabase-js';
import { useLocale, useTranslations } from 'next-intl';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Icon,
} from '@/components/ui';
import { AdminDataTable, type ColumnDef } from '@/components/admin/admin-data-table';
import {
  fetchAdminProducts,
  updateProductStockAction,
} from '@/lib/admin/product-actions';
import type { Locale, Product } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface InventorySectionProps {
  admin: User;
  className?: string;
}

export function InventorySection({ admin, className }: InventorySectionProps) {
  void admin;
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const locale = useLocale() as Locale;
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const loadProducts = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const list = await fetchAdminProducts();
      setProducts(list);
    } catch (err) {
      console.error('Failed to load inventory', err);
      setError('errors.stockUpdateFailed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const lowStockProducts = useMemo(
    () =>
      products
        .filter((product) => product.stock <= product.lowStockThreshold)
        .sort((a, b) => a.stock - b.stock),
    [products],
  );

  const handleRestock = (product: Product) => {
    const input = window.prompt(
      t('inventory.updateStock'),
      String(Math.max(product.lowStockThreshold, product.stock)),
    );
    if (!input) return;

    const newStock = Number(input);
    if (!Number.isFinite(newStock) || newStock < 0) {
      window.alert(t('errors.stockUpdateFailed'));
      return;
    }

    startTransition(async () => {
      const response = await updateProductStockAction(product.id, newStock);
      if (!response.success) {
        window.alert(t('errors.stockUpdateFailed'));
      }
      await loadProducts();
    });
  };

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        key: 'name',
        header: t('products.productDetails'),
        accessor: (product) => product.name,
        sortable: true,
      },
      {
        key: 'category',
        header: t('products.category'),
        accessor: (product) => product.category,
      },
      {
        key: 'price',
        header: t('products.pricing'),
        render: (product) => formatCurrency(product.price, locale),
      },
      {
        key: 'stock',
        header: t('inventory.updateStock'),
        accessor: (product) => product.stock,
        sortable: true,
      },
      {
        key: 'threshold',
        header: t('inventory.lowStockAlert'),
        accessor: (product) => product.lowStockThreshold,
      },
      {
        key: 'actions',
        header: '',
        render: (product) => (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={(event) => {
              event.stopPropagation();
              handleRestock(product);
            }}
          >
            <Icon name="package-plus" className="mr-2 h-4 w-4" />
            {t('inventory.restockProduct')}
          </Button>
        ),
      },
    ],
    [handleRestock, locale, t],
  );

  return (
    <section className={className}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{t('inventory.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('inventory.lowStockAlert')}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => startTransition(async () => {
            await loadProducts();
          })}
          disabled={pending}
        >
          <Icon name="refresh-cw" className="mr-2 h-4 w-4" />
          {t('common.refresh')}
        </Button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {t(error as Parameters<typeof t>[0])}
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
          {tCommon('loading')}
        </div>
      ) : lowStockProducts.length === 0 ? (
        <Card className="mt-6 border border-border/70">
          <CardHeader>
            <CardTitle>{t('inventory.stockHistory')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('inventory.stockUpdated')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6">
          <AdminDataTable
            data={lowStockProducts}
            columns={columns}
            pagination
            itemsPerPage={10}
          />
        </div>
      )}
    </section>
  );
}
