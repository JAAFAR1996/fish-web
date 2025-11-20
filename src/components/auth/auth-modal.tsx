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

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab, isOpen]);

  const handleSuccess = () => {
    window.dispatchEvent(new Event('auth-change'));
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
            setActiveTab(value as AuthTab);
          }}
          className="flex flex-col gap-6 p-6"
        >
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="signin">{t('tabs.signin')}</TabsTrigger>
            <TabsTrigger value="signup">{t('tabs.signup')}</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <EmailSigninForm
              onSuccess={handleSuccess}
              onSwitchToSignup={() => setActiveTab('signup')}
            />
          </TabsContent>

          <TabsContent value="signup">
            <EmailSignupForm
              onSuccess={handleSuccess}
              onSwitchToSignin={() => setActiveTab('signin')}
            />
          </TabsContent>
        </Tabs>
      </ModalBody>
    </Modal>
  );
}
