import { Metadata, type Route } from 'next';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';

import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { verifyResetTokenAction } from '@/lib/auth/password-reset-actions';
import { defaultLocale, routing } from '@/i18n/routing';

type Locale = (typeof routing.locales)[number];

export const metadata: Metadata = {
  title: 'إعادة تعيين كلمة المرور',
  description: 'إنشاء كلمة مرور جديدة لحسابك',
  robots: 'noindex, nofollow',
};

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { token?: string };
}) {
  const t = await getTranslations();
  const locale = routing.locales.includes(params.locale as Locale)
    ? (params.locale as Locale)
    : defaultLocale;
  const forgotPasswordHref: Route = `/${locale}/auth/forgot-password` as Route;
  const token = searchParams.token;

  // Verify token on server side
  if (!token) {
    redirect(forgotPasswordHref);
  }

  const verification = await verifyResetTokenAction(token);

  if (!verification.valid) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md">
        <div className="bg-background border border-border rounded-2xl shadow-lg p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {t('auth.passwordReset.invalidToken')}
            </h1>
            <p className="text-muted-foreground mb-6">
              {t('auth.passwordReset.tokenExpired')}
            </p>
            <Link
              href={forgotPasswordHref}
              className="inline-flex items-center justify-center px-6 py-3 bg-aqua-600 text-white rounded-lg hover:bg-aqua-700 transition-colors"
            >
              {t('auth.passwordReset.requestNewLink')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {t('auth.passwordReset.createNewPassword')}
          </h1>
          <p className="text-muted-foreground">{t('auth.passwordReset.enterNewPassword')}</p>
        </div>

        {/* Form */}
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}
