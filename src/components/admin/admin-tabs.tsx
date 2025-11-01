'use client';

import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { useTranslations } from 'next-intl';

import {
  Icon,
  type IconName,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import type { AdminDashboardTab, AdminStats } from '@/types';
import { DashboardSection } from '@/components/admin/dashboard-section';
import { ProductsSection } from '@/components/admin/products-section';
import { OrdersSection } from '@/components/admin/orders-section';
import { InventorySection } from '@/components/admin/inventory-section';
import { ReportsSection } from '@/components/admin/reports-section';
import { UsersSection } from '@/components/admin/users-section';

interface AdminTabsProps {
  admin: User;
  stats: AdminStats;
  defaultTab?: AdminDashboardTab;
}

const TABS: Array<{ value: AdminDashboardTab; icon: IconName; label: string }> = [
  { value: 'dashboard', icon: 'gauge', label: 'dashboard.title' },
  { value: 'products', icon: 'package', label: 'products.title' },
  { value: 'orders', icon: 'cart', label: 'orders.title' },
  { value: 'inventory', icon: 'list', label: 'inventory.title' },
  { value: 'reports', icon: 'activity', label: 'reports.title' },
  { value: 'users', icon: 'users', label: 'users.title' },
];

export function AdminTabs({ admin, stats, defaultTab = 'dashboard' }: AdminTabsProps) {
  const t = useTranslations('admin');
  const [activeTab, setActiveTab] = useState<AdminDashboardTab>(defaultTab);

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as AdminDashboardTab)}
      className="flex flex-col gap-6"
    >
      <TabsList className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {TABS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
            <Icon name={tab.icon} className="h-4 w-4" />
            <span>{t(tab.label as Parameters<typeof t>[0])}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="dashboard">
        <DashboardSection stats={stats} />
      </TabsContent>

      <TabsContent value="products">
        <ProductsSection admin={admin} className="space-y-6" />
      </TabsContent>

      <TabsContent value="orders">
        <OrdersSection admin={admin} className="space-y-6" />
      </TabsContent>

      <TabsContent value="inventory">
        <InventorySection admin={admin} className="space-y-6" />
      </TabsContent>

      <TabsContent value="reports">
        <ReportsSection admin={admin} className="space-y-6" />
      </TabsContent>

      <TabsContent value="users">
        <UsersSection admin={admin} className="space-y-6" />
      </TabsContent>
    </Tabs>
  );
}
