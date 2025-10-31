'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Icon,
} from '@/components/ui';
import type { AdminStats, Locale } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface DashboardSectionProps {
  stats: AdminStats;
  className?: string;
}

const STAT_CARDS: Array<{
  key: keyof AdminStats;
  icon: string;
  variant: 'info' | 'success' | 'warning' | 'destructive' | 'default';
}> = [
  { key: 'totalOrders', icon: 'shopping-bag', variant: 'info' },
  { key: 'totalRevenue', icon: 'coins', variant: 'success' },
  { key: 'totalCustomers', icon: 'users', variant: 'info' },
  { key: 'totalProducts', icon: 'package', variant: 'info' },
  { key: 'pendingOrders', icon: 'clock', variant: 'warning' },
  { key: 'lowStockProducts', icon: 'alert-triangle', variant: 'warning' },
  { key: 'pendingReviews', icon: 'message-circle', variant: 'warning' },
  { key: 'activeFlashSales', icon: 'zap', variant: 'success' },
];

export function DashboardSection({ stats, className }: DashboardSectionProps) {
  const t = useTranslations('admin');
  const locale = useLocale();
  const revenueDisplay = formatCurrency(stats.totalRevenue, locale as Locale);

  return (
    <section className={className}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STAT_CARDS.map((card) => {
          const value = stats[card.key];
          const label = t(`dashboard.stats.${card.key}` as Parameters<typeof t>[0]);
          const displayValue =
            card.key === 'totalRevenue' ? revenueDisplay : value.toLocaleString();

          return (
            <Card key={card.key} className="border border-border/60 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {displayValue}
                  </p>
                </div>
                <Badge variant={card.variant}>{card.variant}</Badge>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>{t('dashboard.quickActions')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button asChild variant="outline" className="justify-start gap-2">
              <Link href="#products">
                <Icon name="plus" className="h-4 w-4" />
                {t('products.addProduct')}
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start gap-2">
              <Link href="#orders">
                <Icon name="truck" className="h-4 w-4" />
                {t('orders.updateStatus')}
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start gap-2">
              <Link href="#inventory">
                <Icon name="package-search" className="h-4 w-4" />
                {t('inventory.lowStockAlert')}
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start gap-2">
              <Link href="#reports">
                <Icon name="bar-chart-3" className="h-4 w-4" />
                {t('reports.salesReport')}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>{t('dashboard.lowStockAlert')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('inventory.lowStockAlert')}
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
