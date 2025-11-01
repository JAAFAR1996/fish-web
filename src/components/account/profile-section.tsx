'use client';

import { FormEvent, useState, useTransition } from 'react';
import type { User } from '@supabase/supabase-js';
import { useTranslations } from 'next-intl';

import { Button, Input } from '@/components/ui';
import type { FormStatus, UserProfile } from '@/types';
import { updateProfile } from '@/lib/auth/actions';

interface ProfileSectionProps {
  user: User;
  profile: UserProfile | null;
}

export function ProfileSection({ user, profile }: ProfileSectionProps) {
  const t = useTranslations('account.profile');
  const tAuth = useTranslations('auth');

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [username, setUsername] = useState(profile?.username ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const translateKey = (key?: string | null) => {
    if (!key) return '';
    if (key.startsWith('auth.')) {
      return tAuth(key.slice('auth.'.length));
    }
    return key;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      setStatus('loading');
      const result = await updateProfile({
        fullName: fullName.trim(),
        username: username.trim() || null,
        phone: phone.trim() || null,
      });

      if (!result.success) {
        setStatus('error');
        setMessage(translateKey(result.error));
        return;
      }

      setStatus('success');
      setMessage(t('saved'));
    });
  };

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold">{t('title')}</h2>
        {message && (
          <div
            className={`rounded-md border px-4 py-3 text-sm ${
              status === 'success'
                ? 'border-aqua-500/50 bg-aqua-500/10 text-aqua-700 dark:text-aqua-200'
                : 'border-destructive/50 bg-destructive/10 text-destructive'
            }`}
          >
            {message}
          </div>
        )}
      </header>

      <form className="grid grid-cols-1 gap-6 md:grid-cols-2" onSubmit={handleSubmit}>
        <Input
          label={t('fullName')}
          placeholder={t('fullName')}
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          autoComplete="name"
          disabled={isPending}
          wrapperClassName="md:col-span-1"
          required
        />

        <Input
          label={t('username')}
          placeholder="aquarist"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          disabled={isPending}
        />

        <Input
          label={t('email')}
          value={user.email ?? ''}
          disabled
          wrapperClassName="md:col-span-1"
        />

        <Input
          label={t('phone')}
          placeholder="+9647XXXXXXXXX"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          autoComplete="tel"
          disabled={isPending}
        />

        <div className="md:col-span-2 flex justify-end">
          <Button
            type="submit"
            variant="primary"
            loading={isPending}
          >
            {isPending ? t('saving') : t('save')}
          </Button>
        </div>
      </form>
    </section>
  );
}
