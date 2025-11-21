'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AuthTab } from '@/types';
import { EmailSigninForm } from './email-signin-form';
import { EmailSignupForm } from './email-signup-form';

export function AuthPageContent() {
  const t = useTranslations('auth');
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');

  const handleSwitch = (tab: AuthTab) => setActiveTab(tab);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-foreground">{t('modal.title')}</h1>
        <p className="text-muted-foreground">{t('modal.subtitle')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AuthTab)} className="w-full">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="signin">{t('tabs.signin')}</TabsTrigger>
          <TabsTrigger value="signup">{t('tabs.signup')}</TabsTrigger>
        </TabsList>

        <TabsContent value="signin" className="mt-6">
          <EmailSigninForm
            onSuccess={() => undefined}
            onSwitchToSignup={() => handleSwitch('signup')}
          />
        </TabsContent>

        <TabsContent value="signup" className="mt-6">
          <EmailSignupForm
            onSuccess={() => handleSwitch('signin')}
            onSwitchToSignin={() => handleSwitch('signin')}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
