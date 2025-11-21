import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

import { AuthPageContent } from '@/components/auth/AuthPageContent';

type PageProps = {
  params: { locale: string };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'auth' });
  return {
    title: t('modal.title'),
    description: t('modal.subtitle'),
  };
}

export default async function AuthPage({ params }: PageProps) {
  setRequestLocale(params.locale);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <AuthPageContent />
    </div>
  );
}
