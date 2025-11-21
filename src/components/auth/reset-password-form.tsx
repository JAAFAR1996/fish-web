'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import type { Route } from 'next';
import { Button } from '@/components/ui/button';
import { resetPasswordAction } from '@/lib/auth/password-reset-actions';
import { PasswordInput } from './password-input';
import { defaultLocale } from '@/i18n/routing';

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale() || defaultLocale;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const homePath: Route = `/${locale}` as Route;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Validate passwords
    if (password.length < 8) {
      setError(t('auth.errors.passwordTooShort'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.errors.passwordMismatch'));
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('token', token);
      formData.append('password', password);

      const result = await resetPasswordAction(formData);

      if (result.success) {
        // Redirect to the localized home page so users can sign in again
        router.push(homePath);
      } else {
        setError(t(result.message || 'auth.errors.generic'));
      }
    } catch {
      setError(t('auth.errors.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-red-600 dark:text-red-400 mr-3">{error}</p>
          </div>
        </div>
      )}

      {/* New Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
          {t('auth.passwordReset.newPassword')}
        </label>
        <PasswordInput
          id="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('auth.passwordReset.enterPassword')}
          required
          minLength={8}
          disabled={isLoading}
          autoComplete="new-password"
        />
        <p className="text-xs text-muted-foreground mt-1">
          {t('auth.passwordReset.passwordRequirements')}
        </p>
      </div>

      {/* Confirm Password */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
          {t('auth.passwordReset.confirmPassword')}
        </label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={t('auth.passwordReset.reenterPassword')}
          required
          minLength={8}
          disabled={isLoading}
          autoComplete="new-password"
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={isLoading || !password || !confirmPassword}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {t('auth.passwordReset.resetting')}
          </>
        ) : (
          t('auth.passwordReset.resetPassword')
        )}
      </Button>

      {/* Back to Sign In */}
      <div className="text-center pt-4">
        <Link href={homePath} className="text-sm text-aqua-600 dark:text-aqua-400 hover:underline">
          {t('auth.passwordReset.backToSignIn')}
        </Link>
      </div>
    </form>
  );
}
