'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { AuthUser } from '@server/auth';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Icon,
} from '@/components/ui';
import type { LoyaltyPointsSummary, ReferralStats, UserProfile } from '@/types';

import { ProfileSection } from './profile-section';
import { OrdersSection } from './orders-section';
import { WishlistSection } from './wishlist-section';
import { AddressesSection } from './addresses-section';
import { SettingsSection } from './settings-section';
import { LoyaltyPointsSection } from './loyalty-points-section';
import { ReferralsSection } from './referrals-section';

type AccountTabValue =
  | 'profile'
  | 'orders'
  | 'wishlist'
  | 'addresses'
  | 'loyalty'
  | 'referrals'
  | 'settings';

interface AccountTabsProps {
  user: AuthUser;
  session: { user: AuthUser | null } | null;
  profile: UserProfile | null;
  loyaltySummary: LoyaltyPointsSummary | null;
  referralStats: ReferralStats | null;
  referralCode: string | null;
  defaultTab?: AccountTabValue;
}

const TABS: Array<{
  value: AccountTabValue;
  icon: string;
  labelKey: string;
}> = [
  { value: 'profile', icon: 'user', labelKey: 'tabs.profile' },
  { value: 'orders', icon: 'package', labelKey: 'tabs.orders' },
  { value: 'wishlist', icon: 'heart', labelKey: 'tabs.wishlist' },
  { value: 'addresses', icon: 'truck', labelKey: 'tabs.addresses' },
  { value: 'loyalty', icon: 'sparkles', labelKey: 'tabs.loyalty' },
  { value: 'referrals', icon: 'users', labelKey: 'tabs.referrals' },
  { value: 'settings', icon: 'settings', labelKey: 'tabs.settings' },
];

export function AccountTabs({
  user,
  session,
  profile,
  loyaltySummary,
  referralStats,
  referralCode,
  defaultTab = 'profile',
}: AccountTabsProps) {
  const [activeTab, setActiveTab] = useState<AccountTabValue>(defaultTab);
  const t = useTranslations('account');

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as AccountTabValue)}
      className="flex flex-col gap-6"
    >
      <TabsList className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-7">
        {TABS.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="flex items-center gap-2"
          >
            <Icon name={tab.icon as any} size="sm" />
            <span>{t(tab.labelKey as Parameters<typeof t>[0])}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="profile">
        <ProfileSection user={user} profile={profile} />
      </TabsContent>

      <TabsContent value="orders">
        <OrdersSection user={user} />
      </TabsContent>

      <TabsContent value="wishlist">
        <WishlistSection user={user} />
      </TabsContent>

      <TabsContent value="addresses">
        <AddressesSection user={user} />
      </TabsContent>

      <TabsContent value="loyalty">
        <LoyaltyPointsSection summary={loyaltySummary} />
      </TabsContent>

      <TabsContent value="referrals">
        <ReferralsSection stats={referralStats} referralCode={referralCode} />
      </TabsContent>

      <TabsContent value="settings">
        <SettingsSection user={user} session={session} />
      </TabsContent>
    </Tabs>
  );
}
