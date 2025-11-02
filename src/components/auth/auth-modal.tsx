'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import {
  Modal,
  ModalBody,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import type { AuthTab } from '@/types';
import { EmailSigninForm } from './email-signin-form';
import { EmailSignupForm } from './email-signup-form';
import { PhoneSigninForm } from './phone-signin-form';
import { GoogleSigninButton } from './google-signin-button';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: AuthTab;
}

export function AuthModal({
  isOpen,
  onClose,
  defaultTab = 'signin',
}: AuthModalProps) {
  const t = useTranslations('auth');
  const [activeTab, setActiveTab] = useState<AuthTab>(defaultTab);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab, isOpen]);

  const translateKey = (key?: string | null) => {
    if (!key) return '';
    if (key.startsWith('auth.')) {
      return t(key.slice('auth.'.length));
    }
    return t(key);
  };

  const handleSuccess = () => {
    setGlobalError(null);
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t('modal.title')}
      description={t('modal.subtitle')}
      size="md"
    >
      <ModalBody className="p-0">
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setGlobalError(null);
            setActiveTab(value as AuthTab);
          }}
          className="flex flex-col gap-6 p-6"
        >
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="signin">{t('tabs.signin')}</TabsTrigger>
            <TabsTrigger value="signup">{t('tabs.signup')}</TabsTrigger>
            <TabsTrigger value="phone">{t('tabs.phone')}</TabsTrigger>
          </TabsList>

          {globalError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {translateKey(globalError)}
            </div>
          )}

          <TabsContent value="signin">
            <div className="space-y-6">
              <EmailSigninForm
                onSuccess={handleSuccess}
                onSwitchToSignup={() => setActiveTab('signup')}
              />
              <div className="relative">
                <div className="absolute inset-0 border-t border-border" />
                <span className="relative mx-auto flex w-fit bg-background px-3 text-xs uppercase tracking-wide text-muted-foreground">
                  {t('signin.orContinueWith')}
                </span>
              </div>
              <GoogleSigninButton
                mode="signin"
                onError={(error) => setGlobalError(error)}
              />
            </div>
          </TabsContent>

          <TabsContent value="signup">
            <div className="space-y-6">
              <EmailSignupForm
                onSuccess={handleSuccess}
                onSwitchToSignin={() => setActiveTab('signin')}
              />
              <div className="relative">
                <div className="absolute inset-0 border-t border-border" />
                <span className="relative mx-auto flex w-fit bg-background px-3 text-xs uppercase tracking-wide text-muted-foreground">
                  {t('signin.orContinueWith')}
                </span>
              </div>
              <GoogleSigninButton
                mode="signup"
                onError={(error) => setGlobalError(error)}
              />
            </div>
          </TabsContent>

          <TabsContent value="phone">
            <PhoneSigninForm onSuccess={handleSuccess} />
          </TabsContent>
        </Tabs>
      </ModalBody>
    </Modal>
  );
}
