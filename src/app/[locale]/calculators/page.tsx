import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { CalculatorTabs } from '@/components/calculators';
import type { CalculatorType } from '@/types';

interface CalculatorsPageProps {
  params: { locale: string };
  searchParams?: { tab?: string };
}

const CALCULATOR_TABS: readonly CalculatorType[] = [
  'heater',
  'filter',
  'salinity',
];

function resolveDefaultTab(tab?: string): CalculatorType {
  return CALCULATOR_TABS.includes(tab as CalculatorType)
    ? (tab as CalculatorType)
    : 'heater';
}

export async function generateMetadata({
  params,
}: {
  params: CalculatorsPageProps['params'];
}): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'calculators' });

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'website',
    },
  };
}

export default async function CalculatorsPage({
  params,
  searchParams,
}: CalculatorsPageProps) {
  const { locale } = params;
  setRequestLocale(locale);

  const t = await getTranslations('calculators');
  const defaultTab = resolveDefaultTab(searchParams?.tab);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-sand-900 dark:text-sand-100 mb-2">
          {t('pageTitle')}
        </h1>
        <p className="text-lg text-sand-600 dark:text-sand-400">
          {t('pageSubtitle')}
        </p>
      </div>

      <CalculatorTabs defaultTab={defaultTab} />
    </div>
  );
}
