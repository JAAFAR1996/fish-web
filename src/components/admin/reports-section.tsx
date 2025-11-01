'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { User } from '@supabase/supabase-js';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Button, Card, CardContent, CardHeader, CardTitle, Icon } from '@/components/ui';
import { getBestSellersReportAction, getSalesReportAction } from '@/lib/admin/reports-actions';
import { CHART_COLORS } from '@/lib/admin/constants';
import type { BestSellerData, Locale, SalesReportData } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface ReportsSectionProps {
  admin: User;
  className?: string;
}

type DateRange = '7d' | '30d' | '90d';

const RANGE_TO_DAYS: Record<DateRange, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

export function ReportsSection({ admin, className }: ReportsSectionProps) {
  void admin;
  const t = useTranslations('admin');
  const locale = useLocale() as Locale;
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [salesData, setSalesData] = useState<SalesReportData[]>([]);
  const [bestSellers, setBestSellers] = useState<BestSellerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const days = RANGE_TO_DAYS[dateRange];
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    const startIso = start.toISOString();
    const endIso = end.toISOString();

    const [salesResult, sellersResult] = await Promise.all([
      getSalesReportAction(startIso, endIso, 'day'),
      getBestSellersReportAction(10),
    ]);

    if (!salesResult.ok || !sellersResult.ok) {
      const errors = [];
      if (!salesResult.ok) errors.push('sales report');
      if (!sellersResult.ok) errors.push('best sellers');
      setError(`Failed to load: ${errors.join(', ')}`);
      setSalesData([]);
      setBestSellers([]);
    } else {
      setSalesData(salesResult.data);
      setBestSellers(sellersResult.data);
    }

    setIsLoading(false);
  }, [dateRange]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const revenueFormatter = useCallback(
    (value: number) => formatCurrency(value, locale),
    [locale],
  );

  const salesChart = useMemo(
    () => (
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={salesData} margin={{ left: 12, right: 12 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis tickFormatter={(value) => revenueFormatter(value as number)} />
          <Tooltip
            formatter={(value: number) => [revenueFormatter(value), t('reports.revenueChart')]}
          />
          <Legend />
          <Line type="monotone" dataKey="revenue" stroke={CHART_COLORS[0]} strokeWidth={2} />
          <Line type="monotone" dataKey="orders" stroke={CHART_COLORS[1]} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    ),
    [revenueFormatter, salesData, t],
  );

  const bestSellerChart = useMemo(
    () => (
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={bestSellers} margin={{ left: 12, right: 12 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="product_name" />
          <YAxis tickFormatter={(value) => revenueFormatter(value as number)} />
          <Tooltip
            formatter={(value: number, key: string) => [revenueFormatter(value), key]}
          />
          <Legend />
          <Bar dataKey="total_revenue" fill={CHART_COLORS[2]} />
        </BarChart>
      </ResponsiveContainer>
    ),
    [bestSellers, revenueFormatter],
  );

  return (
    <section className={className}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">{t('reports.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('reports.salesReport')}</p>
        </div>
        <div className="flex items-center gap-2">
          {(Object.keys(RANGE_TO_DAYS) as DateRange[]).map((range) => {
            const label =
              range === '7d'
                ? t('reports.last7Days')
                : range === '30d'
                  ? t('reports.last30Days')
                  : t('reports.last90Days');
            return (
              <Button
                key={range}
                type="button"
                variant={dateRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateRange(range as DateRange)}
              >
                {label}
              </Button>
            );
          })}
          <Button
            type="button"
            variant="outline"
            onClick={() => startTransition(async () => loadReports())}
            disabled={pending}
          >
            <Icon name="refresh-cw" className="mr-2 h-4 w-4" />
            {t('common.refresh')}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          <div className="flex items-center gap-2">
            <Icon name="alert-triangle" className="h-4 w-4" />
            <span className="font-medium">Error loading reports</span>
          </div>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-[240px] items-center justify-center text-sm text-muted-foreground">
          {t('reports.salesReport')}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="border border-border/70">
            <CardHeader>
              <CardTitle>{t('reports.revenueChart')}</CardTitle>
            </CardHeader>
            <CardContent className="h-[340px] p-0">
              {salesChart}
            </CardContent>
          </Card>

          <Card className="border border-border/70">
            <CardHeader>
              <CardTitle>{t('reports.bestSellers')}</CardTitle>
            </CardHeader>
            <CardContent className="h-[340px] p-0">
              {bestSellerChart}
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}
