'use client';

import { FormEvent, useState, useTransition, useEffect } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { useTranslations } from 'next-intl';

import { PasswordInput } from '@/components/auth';
import { Button, Card, CardContent, CardHeader, CardTitle, Checkbox } from '@/components/ui';
import { useAuth } from '@/components/providers/SupabaseAuthProvider';
import { updatePassword, deleteAccount } from '@/lib/auth/actions';
import { updateNotificationPreferencesAction } from '@/lib/notifications/notification-actions';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import type { FormStatus, NotificationPreferences } from '@/types';

interface SettingsSectionProps {
  user: User;
  session: Session | null;
}

export function SettingsSection({ user }: SettingsSectionProps) {
  const t = useTranslations('account.settings');
  const tAuth = useTranslations('auth');
  const { signOut } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<FormStatus>('idle');
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    email_order_updates: true,
    email_shipping_updates: true,
    email_stock_alerts: true,
    email_marketing: false,
    inapp_notifications_enabled: true,
  });
  const [savingPrefs, setSavingPrefs] = useState<FormStatus>('idle');
  const [prefsMessage, setPrefsMessage] = useState<string | null>(null);
  const [isPendingPassword, startPasswordTransition] = useTransition();
  const [isPendingPrefs, startPrefsTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  // Fetch current preferences from profiles
  useEffect(() => {
    const fetchPreferences = async () => {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('email_order_updates, email_shipping_updates, email_stock_alerts, email_marketing, inapp_notifications_enabled')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setNotificationPrefs({
          email_order_updates: data.email_order_updates ?? true,
          email_shipping_updates: data.email_shipping_updates ?? true,
          email_stock_alerts: data.email_stock_alerts ?? true,
          email_marketing: data.email_marketing ?? false,
          inapp_notifications_enabled: data.inapp_notifications_enabled ?? true,
        });
      }
    };

    fetchPreferences();
  }, [user.id]);

  const handlePasswordChange = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordStatus('error');
      setPasswordMessage(tAuth('validation.passwordMismatch'));
      return;
    }

    startPasswordTransition(async () => {
      setPasswordStatus('loading');
      const result = await updatePassword({ newPassword });
      if (!result.success) {
        setPasswordStatus('error');
        setPasswordMessage(tAuth(result.error.replace('auth.', '')));
        return;
      }
      setPasswordStatus('success');
      setPasswordMessage(t('passwordUpdated'));
      setNewPassword('');
      setConfirmPassword('');
    });
  };

  const handleDeleteAccount = () => {
    if (!window.confirm(t('deleteAccountConfirm'))) return;
    startDeleteTransition(async () => {
      const result = await deleteAccount();
      if (result.success) {
        window.location.href = '/';
      }
    });
  };

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t('changePassword')}</CardTitle>
        </CardHeader>
        <CardContent>
          {passwordMessage && (
            <div
              className={`mb-4 rounded-md border px-4 py-3 text-sm ${
                passwordStatus === 'success'
                  ? 'border-aqua-500/50 bg-aqua-500/10 text-aqua-700 dark:text-aqua-200'
                  : 'border-destructive/50 bg-destructive/10 text-destructive'
              }`}
            >
              {passwordMessage}
            </div>
          )}
          <form className="space-y-4" onSubmit={handlePasswordChange}>
            <PasswordInput
              label={t('newPassword')}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              disabled={isPendingPassword}
              helperText={tAuth('validation.passwordMin')}
            />
            <PasswordInput
              label={t('confirmNewPassword')}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={isPendingPassword}
            />
            <Button
              type="submit"
              variant="primary"
              loading={isPendingPassword}
            >
              {t('updatePassword')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('notificationPreferences')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {prefsMessage && (
            <div
              className={`mb-4 rounded-md border px-4 py-3 text-sm ${
                savingPrefs === 'success'
                  ? 'border-aqua-500/50 bg-aqua-500/10 text-aqua-700 dark:text-aqua-200'
                  : 'border-destructive/50 bg-destructive/10 text-destructive'
              }`}
            >
              {prefsMessage}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Checkbox
              id="emailOrderUpdates"
              checked={notificationPrefs.email_order_updates}
              onCheckedChange={(checked) =>
                setNotificationPrefs((prev) => ({
                  ...prev,
                  email_order_updates: Boolean(checked),
                }))
              }
              disabled={isPendingPrefs}
            />
            <label htmlFor="emailOrderUpdates" className="text-sm text-foreground">
              {t('emailOrderUpdates')}
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="emailShippingUpdates"
              checked={notificationPrefs.email_shipping_updates}
              onCheckedChange={(checked) =>
                setNotificationPrefs((prev) => ({
                  ...prev,
                  email_shipping_updates: Boolean(checked),
                }))
              }
              disabled={isPendingPrefs}
            />
            <label htmlFor="emailShippingUpdates" className="text-sm text-foreground">
              {t('emailShippingUpdates')}
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="emailStockAlerts"
              checked={notificationPrefs.email_stock_alerts}
              onCheckedChange={(checked) =>
                setNotificationPrefs((prev) => ({
                  ...prev,
                  email_stock_alerts: Boolean(checked),
                }))
              }
              disabled={isPendingPrefs}
            />
            <label htmlFor="emailStockAlerts" className="text-sm text-foreground">
              {t('emailStockAlerts')}
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="emailMarketing"
              checked={notificationPrefs.email_marketing}
              onCheckedChange={(checked) =>
                setNotificationPrefs((prev) => ({
                  ...prev,
                  email_marketing: Boolean(checked),
                }))
              }
              disabled={isPendingPrefs}
            />
            <label htmlFor="emailMarketing" className="text-sm text-foreground">
              {t('emailMarketing')}
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="inappNotifications"
              checked={notificationPrefs.inapp_notifications_enabled}
              onCheckedChange={(checked) =>
                setNotificationPrefs((prev) => ({
                  ...prev,
                  inapp_notifications_enabled: Boolean(checked),
                }))
              }
              disabled={isPendingPrefs}
            />
            <label htmlFor="inappNotifications" className="text-sm text-foreground">
              {t('inappNotifications')}
            </label>
          </div>

          <Button
            type="button"
            variant="outline"
            loading={isPendingPrefs}
            onClick={() => {
              setPrefsMessage(null);
              startPrefsTransition(async () => {
                setSavingPrefs('loading');
                const result = await updateNotificationPreferencesAction(notificationPrefs);
                if (result.success) {
                  setSavingPrefs('success');
                  setPrefsMessage(t('preferencesSaved'));
                } else {
                  setSavingPrefs('error');
                  setPrefsMessage(result.error || 'Error saving preferences');
                }
              });
            }}
          >
            {t('savePreferences')}
          </Button>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 border-destructive/40 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive">{t('dangerZone')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>{t('signOutDescription')}</p>
            <p>{t('deleteAccountWarning')}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="ghost"
              onClick={() => signOut()}
            >
              {t('signOut')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteAccount}
              loading={isDeleting}
            >
              {t('deleteAccount')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
