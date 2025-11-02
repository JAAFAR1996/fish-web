'use client';

import { FormEvent, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';

import { Button, Input } from '@/components/ui';
import { PasswordInput } from './password-input';
import { signInWithEmail } from '@/lib/auth/actions';
import { validateSignin } from '@/lib/auth/validation';
import type { FormStatus, ValidationResult } from '@/types';
import { cn } from '@/lib/utils';

interface EmailSigninFormProps {
  onSuccess: () => void;
  onSwitchToSignup: () => void;
}

type ValidationErrors = ValidationResult['errors'];

export function EmailSigninForm({
  onSuccess,
  onSwitchToSignup,
}: EmailSigninFormProps) {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<FormStatus>('idle');
  const [isPending, startTransition] = useTransition();

  const translateKey = (key?: string | null) => {
    if (!key) return '';
    if (key.startsWith('auth.')) {
      return t(key.slice('auth.'.length));
    }
    return t(key);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setStatus('idle');

    const validation = validateSignin({ email, password });
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      setFormError('auth.errors.validation');
      return;
    }

    setFieldErrors({});
    startTransition(async () => {
      setStatus('loading');
      const result = await signInWithEmail({
        email,
        password,
        next: window.location.pathname,
      });

      if (!result.success) {
        setStatus('error');
        const error = typeof result.error === 'string' ? result.error : String(result.error);
        setFormError(error);
        return;
      }

      setStatus('success');
      setFormError(null);
      onSuccess();
    });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {formError && status !== 'success' && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {translateKey(formError)}
        </div>
      )}

      <Input
        type="email"
        label={t('signin.email')}
        placeholder="you@example.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        autoComplete="email"
        disabled={isPending}
        error={
          fieldErrors.email ? translateKey(fieldErrors.email) : undefined
        }
      />

      <div className="space-y-2">
        <PasswordInput
          label={t('signin.password')}
          placeholder="••••••••"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          disabled={isPending}
          error={
            fieldErrors.password
              ? translateKey(fieldErrors.password)
              : undefined
          }
        />
        <button
          type="button"
          className="text-sm text-aqua-600 transition-colors hover:text-aqua-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          disabled
        >
          {t('signin.forgotPassword')}
        </button>
      </div>

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        loading={isPending}
      >
        {t('signin.submit')}
      </Button>

      <div className="text-sm text-muted-foreground">
        {t('signin.noAccount')}{' '}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className={cn(
            'font-medium text-aqua-600 transition-colors hover:text-aqua-500',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
          )}
        >
          {t('signin.signupLink')}
        </button>
      </div>
    </form>
  );
}
