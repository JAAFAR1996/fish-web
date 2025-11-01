import { useTranslations } from 'next-intl';

import { Button, Icon } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export interface EmptyWishlistProps {
  className?: string;
}

export function EmptyWishlist({ className }: EmptyWishlistProps) {
  const t = useTranslations('wishlist.empty');

  return (
    <div
      className={cn(
        'flex min-h-[320px] flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-muted-foreground/40 bg-muted/30 p-8 text-center',
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon name="heart" size="lg" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">
          {t('title')}
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          {t('description')}
        </p>
      </div>
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <Button variant="ghost" asChild>
          <Link href="/products">{t('browseProducts')}</Link>
        </Button>
        <Button variant="primary" asChild>
          <Link href="/products">
            {t('startShopping')}
            <Icon name="arrow-right" size="sm" className="ms-2" flipRtl />
          </Link>
        </Button>
      </div>
    </div>
  );
}
