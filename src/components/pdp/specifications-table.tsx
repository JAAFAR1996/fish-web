import { getTranslations } from 'next-intl/server';

import { cn, formatProductSpec } from '@/lib/utils';
import type { Locale, Product } from '@/types';

export interface SpecificationsTableProps {
  product: Product;
  locale: Locale;
  className?: string;
}

const numberFormatterCache = new Map<string, Intl.NumberFormat>();

function formatNumber(value: number, locale: Locale) {
  const key = `${locale}-spec`;
  if (!numberFormatterCache.has(key)) {
    numberFormatterCache.set(
      key,
      new Intl.NumberFormat(locale === 'ar' ? 'ar-IQ' : 'en-US', {
        maximumFractionDigits: 1,
      })
    );
  }

  return numberFormatterCache.get(key)!.format(value);
}

function safeTranslate(
  translate: (key: string, values?: Record<string, unknown>) => string,
  key: string,
  fallback: string
) {
  try {
    return translate(key);
  } catch {
    return fallback;
  }
}

export async function SpecificationsTable({
  product,
  locale,
  className,
}: SpecificationsTableProps) {
  const t = await getTranslations('pdp.specs');
  const tCategories = await getTranslations('categories');
  const tSubcategories = await getTranslations('subcategories');

  const categoryLabel = safeTranslate(
    tCategories,
    `${product.category}.title`,
    product.category
  );

  const subcategoryLabel = safeTranslate(
    tSubcategories,
    `${product.category}.${product.subcategory}`,
    product.subcategory
  );

  const rows: Array<{ label: string; value: string }> = [
    {
      label: t('brand'),
      value: product.brand,
    },
    {
      label: t('category'),
      value: categoryLabel,
    },
    {
      label: t('subcategory'),
      value: subcategoryLabel,
    },
    {
      label: t('sku'),
      value: product.id,
    },
  ];

  if (product.specifications.flow != null) {
    rows.push({
      label: t('flow', { defaultMessage: 'Flow Rate' }),
      value: formatProductSpec(
        product.specifications.flow,
        'L/h',
        locale
      ),
    });
  }

  if (product.specifications.power != null) {
    rows.push({
      label: t('powerConsumption', { defaultMessage: 'Power Consumption' }),
      value: formatProductSpec(
        product.specifications.power,
        'W',
        locale
      ),
    });
  }

  const { compatibility } = product.specifications;
  if (compatibility.displayText) {
    rows.push({
      label: t('compatibility', { defaultMessage: 'Compatibility' }),
      value: compatibility.displayText,
    });
  }

  if (compatibility.minTankSize || compatibility.maxTankSize) {
    rows.push({
      label: t('tankSize'),
      value: t(
        compatibility.minTankSize && compatibility.maxTankSize
          ? 'tankSizeValue'
          : compatibility.minTankSize
            ? 'tankSizeMin'
            : 'tankSizeMax',
        {
          min: compatibility.minTankSize
            ? formatNumber(compatibility.minTankSize, locale)
            : undefined,
          max: compatibility.maxTankSize
            ? formatNumber(compatibility.maxTankSize, locale)
            : undefined,
        }
      ),
    });
  }

  if (product.specifications.dimensions) {
    const { length, width, height } = product.specifications.dimensions;
    rows.push({
      label: t('dimensions'),
      value: t('dimensionsValue', {
        length: formatNumber(length, locale),
        width: formatNumber(width, locale),
        height: formatNumber(height, locale),
      }),
    });
  }

  if (product.specifications.weight != null) {
    rows.push({
      label: t('weight'),
      value: t('weightValue', {
        weight: formatNumber(product.specifications.weight, locale),
      }),
    });
  }

  const filteredRows = rows.filter((row) => row.value);

  return (
    <section
      className={cn(
        'overflow-hidden rounded-lg border border-border bg-card shadow-sm',
        className
      )}
      aria-labelledby="product-specifications"
    >
      <div className="border-b border-border bg-muted/60 px-4 py-3">
        <h3 id="product-specifications" className="text-base font-semibold">
          {t('title')}
        </h3>
      </div>
      <dl className="divide-y divide-border">
        {filteredRows.map(({ label, value }) => (
          <div
            key={`${label}-${value}`}
            className="grid grid-cols-1 gap-2 px-4 py-3 text-sm sm:grid-cols-[200px_1fr]"
          >
            <dt className="font-medium text-foreground">{label}</dt>
            <dd className="text-muted-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
