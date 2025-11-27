'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { cn, formatCurrency } from '@/lib/utils';
import type { Product } from '@/types';

type ProductOfTheWeekProps = {
  product: Product;
  className?: string;
};

export function ProductOfTheWeek({ product, className }: ProductOfTheWeekProps) {
  const tProduct = useTranslations('product');
  const price = formatCurrency(product.price, 'en');

  return (
    <Card
      className={cn(
        'relative overflow-hidden border bg-background/80 p-10 shadow-2xl md:p-16',
        className,
      )}
    >
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {tProduct('productOfWeek')}
          </p>
          <h2 className="text-4xl font-bold md:text-5xl">{product.name}</h2>
          <p className="text-lg text-muted-foreground">{product.description}</p>
          <div className="flex items-center gap-4">
            <span className="text-3xl font-semibold">{price}</span>
            {product.ecoFriendly && (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-600">
                {tProduct('ecoFriendly')}
              </span>
            )}
          </div>
          <Link href={`/products/${product.slug}`}>
            <Button size="lg" className="water-ripple">
              {tProduct('actions.addToCart')}
            </Button>
          </Link>
        </div>
        <div className="relative h-[360px] overflow-hidden rounded-3xl bg-muted">
          <Image
            src={product.images?.[0] || product.thumbnail}
            alt={product.name}
            fill
            className="object-cover slow-zoom"
            priority
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-background/40 via-transparent to-background/20" />
        </div>
      </div>
    </Card>
  );
}
