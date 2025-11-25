import { getTranslations } from 'next-intl/server';

import { Icon } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

export interface ProductBreadcrumbProps {
  product: Product;
  className?: string;
}

export async function ProductBreadcrumb({
  product,
  className,
}: ProductBreadcrumbProps) {
  const t = await getTranslations('pdp.breadcrumb');
  const tCategories = await getTranslations('categories');

  const categoryLabel = (() => {
    try {
      return tCategories(`${product.category}.title`);
    } catch {
      return product.category;
    }
  })();

  const items = [
    {
      label: t('home'),
      href: '/',
      current: false,
    },
    {
      label: t('products'),
      href: '/products',
      current: false,
    },
    {
      label: categoryLabel,
      href: `/products?category=${product.category}`,
      current: false,
    },
    {
      label: product.name,
      href: '',
      current: true,
    },
  ];

  return (
    <nav
      aria-label="breadcrumb"
      className={cn(
        'hidden items-center gap-2 text-sm text-muted-foreground sm:flex',
        className
      )}
      dir="auto"
    >
      <ol className="flex items-center gap-2 rtl:flex-row-reverse rtl:space-x-reverse">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li
              key={`${item.label}-${index}`}
              className="flex items-center gap-2 rtl:flex-row-reverse rtl:space-x-reverse"
            >
              {item.current || isLast ? (
                <span
                  className="max-w-[220px] truncate font-medium text-foreground"
                  aria-current="page"
                >
                  <bdi>{item.label}</bdi>
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-aqua-500"
                >
                  <bdi>{item.label}</bdi>
                </Link>
              )}
              {!isLast && (
                <Icon
                  name="chevron-right"
                  size="xs"
                  className="text-muted-foreground"
                  flipRtl
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
