'use client';

import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';

import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui';
import { cn, formatCurrency } from '@/lib/utils';
import type { BundleWithProducts, Locale } from '@/types';

interface BundleCardProps {
  bundle: BundleWithProducts;
  className?: string;
  onAddToCart?: (bundle: BundleWithProducts) => Promise<void> | void;
  onViewDetails?: (bundle: BundleWithProducts) => void;
  locale?: Locale;
}

const MAX_PRODUCTS_TO_DISPLAY = 4;

export function BundleCard({
  bundle,
  className,
  onAddToCart,
  onViewDetails,
  locale: localeProp,
}: BundleCardProps) {
  const currentLocale = useLocale() as Locale;
  const locale = localeProp ?? currentLocale;
  const t = useTranslations('marketing.bundles');

  const totalValue = formatCurrency(bundle.totalOriginalPrice, locale);
  const bundlePrice = formatCurrency(bundle.bundle_price, locale);
  const savings = formatCurrency(bundle.savings, locale);

  const productsToDisplay = bundle.products.slice(0, MAX_PRODUCTS_TO_DISPLAY);
  const remainingCount = Math.max(0, bundle.products.length - productsToDisplay.length);

  return (
    <Card className={cn('flex h-full flex-col', className)}>
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
          <span>{t('bundleDeal')}</span>
          <span>{t('items', { count: bundle.product_ids.length })}</span>
        </div>
        <h3 className="text-xl font-semibold text-foreground">{bundle.name}</h3>
        {bundle.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {bundle.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('bundleIncludes')}
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {productsToDisplay.map((product) => (
              <li key={product.id} className="flex items-center gap-3">
                <div className="relative h-10 w-10 overflow-hidden rounded-md bg-muted">
                  <Image
                    src={product.thumbnail || product.images[0] || '/images/placeholder.png'}
                    alt={product.name}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <span className="flex-1 text-sm font-medium text-foreground line-clamp-1">
                  {product.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(product.originalPrice ?? product.price, locale)}
                </span>
              </li>
            ))}
          </ul>
          {remainingCount > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              + {t('items', { count: remainingCount })}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 rounded-lg bg-muted/40 p-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase text-muted-foreground">{t('totalValue')}</p>
            <p className="font-medium text-muted-foreground">{totalValue}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">{t('bundlePrice')}</p>
            <p className="text-lg font-semibold text-foreground">{bundlePrice}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">{t('youSave')}</p>
            <p className="font-semibold text-emerald-600 dark:text-emerald-400">{savings}</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-muted-foreground">
          {t('saveWithBundle', { amount: savings })}
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {onViewDetails && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => onViewDetails(bundle)}
            >
              {t('viewBundle')}
            </Button>
          )}
          {onAddToCart && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => onAddToCart(bundle)}
            >
              {t('addBundleToCart')}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
