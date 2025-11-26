'use client';

import Image from 'next/image';
import type { AuthUser } from '@server/auth';
import { useLocale, useTranslations } from 'next-intl';
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
import { ProductForm } from '@/components/admin/product-form';
import {
  deleteProductAction,
  fetchAdminProducts,
} from '@/lib/admin/product-actions';
import type { Locale, Product } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface ProductsSectionProps {
  admin: AuthUser;
  className?: string;
}

export function ProductsSection({ admin, className }: ProductsSectionProps) {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const locale = useLocale() as Locale;
  void admin;
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [deletePending, startDelete] = useTransition();
  const [refreshPending, startRefresh] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const normalizeKey = (key: string) =>
    key.startsWith('admin.') ? key.slice('admin.'.length) : key;

  const loadProducts = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const list = await fetchAdminProducts();
      setProducts(list);
    } catch (err) {
      console.error('Failed to load admin products', err);
      setError('errors.productCreateFailed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const handleCreate = () => {
    setEditingProduct(null);
    setFormOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  const handleDeleteConfirm = (productId: string) => {
    setDeleteProductId(productId);
  };

  const handleDelete = () => {
    if (!deleteProductId) return;

    startDelete(async () => {
      const response = await deleteProductAction(deleteProductId);
      if (!response.success) {
        if (response.error) {
          setError(normalizeKey(response.error));
        } else {
          setError('errors.productDeleteFailed');
        }
      } else {
        await loadProducts();
      }
      setDeleteProductId(null);
    });
  };

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        key: 'thumbnail',
        header: t('products.images'),
        render: (product) => (
          <div className="relative h-12 w-12 overflow-hidden rounded-md border border-border/80">
            {product.thumbnail ? (
              <Image
                src={product.thumbnail}
                alt={product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <Icon name="image-off" className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ),
      },
      {
        key: 'name',
        header: t('products.productDetails'),
        accessor: (product) => product.name,
        sortable: true,
      },
      {
        key: 'brand',
        header: t('products.brand'),
        accessor: (product) => product.brand,
        sortable: true,
      },
      {
        key: 'category',
        header: t('products.category'),
        accessor: (product) => product.category,
        sortable: true,
      },
      {
        key: 'price',
        header: t('products.pricing'),
        accessor: (product) => product.price,
        render: (product) => formatCurrency(product.price, locale),
        sortable: true,
      },
      {
        key: 'stock',
        header: t('inventory.updateStock'),
        accessor: (product) => product.stock,
        sortable: true,
      },
      {
        key: 'status',
        header: t('inventory.lowStockAlert'),
        render: (product) => {
          if (product.stock <= 0) {
            return <Badge variant="destructive">{t('inventory.outOfStock')}</Badge>;
          }
          if (product.stock <= product.lowStockThreshold) {
            return <Badge variant="warning">{t('inventory.lowStockAlert')}</Badge>;
          }
          return <Badge variant="success">{t('inventory.stockUpdated')}</Badge>;
        },
      },
      {
        key: 'actions',
        header: '',
        render: (product) => (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(event) => {
                event.stopPropagation();
                handleEdit(product);
              }}
            >
              <Icon name="edit" className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-destructive"
              onClick={(event) => {
                event.stopPropagation();
                handleDeleteConfirm(product.id);
              }}
            >
              <Icon name="trash" className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [locale, t],
  );

  return (
    <section className={className}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{t('products.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('products.productDetails')}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('common.search')}
            className="w-full sm:w-72"
          />
          <Button type="button" onClick={handleCreate}>
            <Icon name="plus" className="me-2 h-4 w-4" />
            {t('products.addProduct')}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {t(error as Parameters<typeof t>[0])}
        </div>
      )}

      {isLoading || refreshPending ? (
        <div className="flex min-h-[240px] items-center justify-center text-sm text-muted-foreground">
          {tCommon('loading')}
        </div>
      ) : (
        <div className="mt-6">
          <AdminDataTable
            data={products}
            columns={columns}
            searchQuery={searchQuery}
            pagination
            itemsPerPage={20}
            onRowClick={handleEdit}
          />
        </div>
      )}

      <Modal
        open={isFormOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditingProduct(null);
          }
        }}
        title={editingProduct ? t('products.editProduct') : t('products.addProduct')}
        size="xl"
      >
        <ModalBody>
          <ProductForm
            existingProduct={editingProduct}
            onCancel={() => {
              setFormOpen(false);
              setEditingProduct(null);
            }}
            onSuccess={() => {
              startRefresh(async () => {
                await loadProducts();
                setFormOpen(false);
                setEditingProduct(null);
              });
            }}
          />
        </ModalBody>
      </Modal>

      <Modal
        open={Boolean(deleteProductId)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteProductId(null);
          }
        }}
        title={t('products.deleteProduct')}
        description={t('products.deleteConfirm')}
        size="sm"
      >
        <ModalBody>
          <p className="text-sm text-muted-foreground">
            {t('products.deleteConfirm')}
          </p>
        </ModalBody>
        <ModalFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setDeleteProductId(null)}
            disabled={deletePending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deletePending}
          >
            {deletePending && <Icon name="loader-2" className="me-2 h-4 w-4 animate-spin" />}
            {t('common.delete')}
          </Button>
        </ModalFooter>
      </Modal>
    </section>
  );
}
