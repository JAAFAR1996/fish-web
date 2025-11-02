'use client';

import { FormEvent, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';

import { Button, Input } from '@/components/ui';
import { PasswordInput } from './password-input';
import { signUpWithEmail } from '@/lib/auth/actions';
import { validateSignup } from '@/lib/auth/validation';
import type { FormStatus, ValidationResult } from '@/types';

interface EmailSignupFormProps {
  onSuccess: () => void;
  onSwitchToSignin: () => void;
}

type ValidationErrors = ValidationResult['errors'];

export function EmailSignupForm({
  onSuccess,
  onSwitchToSignin,
}: EmailSignupFormProps) {
  const t = useTranslations('auth');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

    const validation = validateSignup({
      fullName,
      email,
      password,
      confirmPassword,
    });

    if (!validation.valid) {
      setFieldErrors(validation.errors);
      setFormError('auth.errors.validation');
      return;
    }

    setFieldErrors({});

    startTransition(async () => {
      setStatus('loading');
      const result = await signUpWithEmail({
        fullName,
        email,
        password,
        confirmPassword,
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
        label={t('signup.fullName')}
        placeholder={t('signup.fullName')}
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
        autoComplete="name"
        disabled={isPending}
        error={
          fieldErrors.fullName
            ? translateKey(fieldErrors.fullName)
            : undefined
        }
      />

      <Input
        type="email"
        label={t('signup.email')}
        placeholder="you@example.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        autoComplete="email"
        disabled={isPending}
        error={
          fieldErrors.email ? translateKey(fieldErrors.email) : undefined
        }
      />

      <PasswordInput
        label={t('signup.password')}
        placeholder="••••••••"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoComplete="new-password"
        disabled={isPending}
        helperText={t('signup.passwordHelper')}
        error={
          fieldErrors.password
            ? translateKey(fieldErrors.password)
            : undefined
        }
      />

      <PasswordInput
        label={t('signup.confirmPassword')}
        placeholder="••••••••"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        autoComplete="new-password"
        disabled={isPending}
        error={
          fieldErrors.confirmPassword
            ? translateKey(fieldErrors.confirmPassword)
            : undefined
        }
      />

      <p className="text-xs text-muted-foreground">
        {t.rich('signup.terms', {
          termsLink: (chunks) => (
            <span className="font-medium text-aqua-600">{chunks}</span>
          ),
          privacyLink: (chunks) => (
            <span className="font-medium text-aqua-600">{chunks}</span>
          ),
        })}
      </p>

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        loading={isPending}
      >
        {t('signup.submit')}
      </Button>

      <div className="text-sm text-muted-foreground">
        {t('signup.haveAccount')}{' '}
        <button
          type="button"
          onClick={onSwitchToSignin}
          className="font-medium text-aqua-600 transition-colors hover:text-aqua-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {t('signup.signinLink')}
        </button>
      </div>
    </form>
  );
}
