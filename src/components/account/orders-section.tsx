'use client';

import type { User } from '@supabase/supabase-js';
import { useTranslations } from 'next-intl';

import { Button, Icon, Badge } from '@/components/ui';
import { Link } from '@/i18n/navigation';

interface OrdersSectionProps {
  user: User;
}

export function OrdersSection(_props: OrdersSectionProps) {
  const t = useTranslations('account.orders');

  return (
    <section className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border/70 bg-muted/40 px-6 py-12 text-center">
      <Badge variant="info" className="bg-aqua-500/10 text-aqua-600 dark:text-aqua-200">
        {t('comingSoon')}
      </Badge>
      <Icon name="package" size="lg" className="text-muted-foreground" />
      <div className="space-y-1">
        <h3 className="text-xl font-semibold">{t('title')}</h3>
        <p className="text-sm text-muted-foreground">{t('noOrders')}</p>
      </div>
      <Button asChild variant="primary">
        <Link href="/products">{t('startShopping')}</Link>
      </Button>
    </section>
  );
}
