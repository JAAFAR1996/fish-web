import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export const metadata: Metadata = {
  title: 'نسيت كلمة المرور',
  description: 'استرجاع كلمة المرور لحسابك في FISH WEB',
  robots: 'noindex, nofollow',
};

export default async function ForgotPasswordPage() {
  const t = await getTranslations();

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <div className="bg-background border border-border rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-aqua-100 dark:bg-aqua-900/30 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-aqua-600 dark:text-aqua-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {t('auth.passwordReset.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('auth.passwordReset.description')}
          </p>
        </div>

        {/* Form */}
        <ForgotPasswordForm />

        {/* Back to Sign In */}
        <div className="mt-6 text-center">
          <Link
            href="/ar/auth/signin"
            className="text-sm text-aqua-600 dark:text-aqua-400 hover:underline inline-flex items-center gap-2"
          >
            <svg
              className="w-4 h-4 rotate-180"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            {t('auth.passwordReset.backToSignIn')}
          </Link>
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p className="mb-2">{t('auth.passwordReset.helpText')}</p>
        <p>
          {t('auth.passwordReset.needHelp')}{' '}
          <a
            href="mailto:support@fishweb.iq"
            className="text-aqua-600 dark:text-aqua-400 hover:underline"
          >
            {t('auth.passwordReset.contactSupport')}
          </a>
        </p>
      </div>
    </div>
  );
}
