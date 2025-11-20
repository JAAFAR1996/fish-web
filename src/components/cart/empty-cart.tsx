'use client';

import { useTranslations } from 'next-intl';

import { Button, Icon } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { FEATURES } from '@/lib/config/features';
import { EmptyCartLottie } from './EmptyCartLottie';

export type EmptyCartProps = {
  savedItemsCount?: number;
  variant?: 'sidebar' | 'full';
  className?: string;
};

export function EmptyCart({
  savedItemsCount = 0,
  variant = 'full',
  className,
}: EmptyCartProps) {
  const t = useTranslations('cart.empty');

  if (variant === 'sidebar') {
    return (
      <div
        className={cn(
          'flex min-h-[220px] flex-col items-center justify-center gap-3 text-center',
          className
        )}
      >
        {FEATURES.lottie ? (
          <EmptyCartLottie variant="sidebar" />
        ) : (
          <Icon name="cart" size="lg" className="text-muted-foreground" />
        )}
        <p className="text-sm font-medium text-foreground">{t('title')}</p>
        <p className="text-xs text-muted-foreground">{t('description')}</p>
        <Button
          type="button"
          size="sm"
          variant="primary"
          asChild
          className="mt-2"
        >
          <Link href="/products">{t('startShopping')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex min-h-[320px] flex-col items-center justify-center gap-4 text-center',
        className
      )}
    >
      {FEATURES.lottie ? (
        <EmptyCartLottie variant="full" />
      ) : (
        <Icon name="cart" size="xl" className="text-muted-foreground" />
      )}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">
          {t('title')}
        </h2>
        <p className="text-base text-muted-foreground">
          {t('description')}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button type="button" variant="primary" size="lg" asChild>
          <Link href="/products">
            <Icon name="arrow-right" size="sm" className="me-2" flipRtl />
            {t('startShopping')}
          </Link>
        </Button>
        <Button type="button" variant="outline" size="lg" asChild>
          <Link href="#saved-items">
            <Icon name="bookmark" size="sm" className="me-2" />
            {t('viewSaved')}
          </Link>
        </Button>
      </div>
      {savedItemsCount > 0 && (
        <p className="text-sm text-muted-foreground">
          {t('savedItems', { count: savedItemsCount })}
        </p>
      )}
    </div>
  );
}
