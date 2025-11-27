'use client';

import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Link } from '@/i18n/navigation';
import type { Product } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { FEATURES } from '@/lib/config/features';

type BundleRecommendationProps = {
  baseProduct: Product;
  relatedProducts: Product[];
  discount?: number;
  onAddBundle?: (products: Product[]) => void;
};

export function BundleRecommendation({
  baseProduct,
  relatedProducts,
  discount = 0.1,
  onAddBundle,
}: BundleRecommendationProps) {
  const bundle = useMemo(
    () => [baseProduct, ...relatedProducts.slice(0, 3)],
    [baseProduct, relatedProducts],
  );

  if (!FEATURES.bundleRecommendations) return null;

  const total = bundle.reduce((sum, item) => sum + item.price, 0);
  const discounted = total * (1 - discount);

  return (
    <Card className="space-y-4 border bg-background/80 p-5 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Works perfectly with
          </p>
          <h3 className="text-xl font-semibold">Bundle & Save</h3>
        </div>
        <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700">
          -{Math.round(discount * 100)}%
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        {bundle.map((product) => (
          <Link key={product.id} href={`/products/${product.slug}`}>
            <div className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
              <Icon name="plus" size="xs" className="text-muted-foreground" />
              {product.name}
            </div>
          </Link>
        ))}
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Total: <strong className="text-foreground">{formatCurrency(total, 'en')}</strong>
        </span>
        <span className="text-foreground">
          Bundle price: <strong>{formatCurrency(discounted, 'en')}</strong>
        </span>
      </div>
      <Button onClick={() => onAddBundle?.(bundle)} className="water-ripple">
        <Icon name="cart" size="sm" className="me-2" />
        Add entire bundle
      </Button>
    </Card>
  );
}
