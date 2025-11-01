import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { AdminTabs } from '@/components/admin/admin-tabs';
import { requireAdmin } from '@/lib/auth/utils';
import { getAdminStats } from '@/lib/admin/reports-utils';
import type { AdminDashboardTab } from '@/types';
import { logWarn } from '@/lib/logger';

interface AdminDashboardPageProps {
  params: { locale: string };
  searchParams?: { tab?: string };
}

const TAB_VALUES: AdminDashboardTab[] = [
  'dashboard',
  'products',
  'orders',
  'inventory',
  'reports',
  'users',
];

export async function generateMetadata({ params }: AdminDashboardPageProps): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'admin' });

  return {
    title: t('dashboard.title'),
    description: 'Manage products, orders, inventory, and customers from the admin dashboard.',
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function AdminDashboardPage({ params, searchParams }: AdminDashboardPageProps) {
  const { locale } = params;
  setRequestLocale(locale);

  try {
    const admin = await requireAdmin();
    const stats = await getAdminStats();

    const requestedTab = searchParams?.tab as AdminDashboardTab | undefined;
    const defaultTab = requestedTab && TAB_VALUES.includes(requestedTab) ? requestedTab : 'dashboard';

    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {admin.email ?? admin.id}
          </p>
        </header>

        <AdminTabs admin={admin} stats={stats} defaultTab={defaultTab} />
      </div>
    );
  } catch (error) {
    const requestHeaders = headers();
    const requestId =
      requestHeaders.get('x-request-id') ??
      requestHeaders.get('x-vercel-id') ??
      null;

    logWarn('Admin access denied', {
      requestId,
    });
    redirect('/');
  }
}
