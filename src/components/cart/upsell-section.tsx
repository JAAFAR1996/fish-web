'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { Carousel } from '@/components/home/carousel';
import { ProductCard } from '@/components/products';
import type { CartItemWithProduct, Product } from '@/types';
import { getComplementaryProducts } from '@/lib/data/products';
import { cn } from '@/lib/utils';
import { useCart } from '@/components/providers/CartProvider';

export type UpsellSectionProps = {
  cartItems: CartItemWithProduct[];
  maxProducts?: number;
  className?: string;
};

export function UpsellSection({
  cartItems,
  maxProducts = 6,
  className,
}: UpsellSectionProps) {
  const t = useTranslations('cart.upsell');
  const { addItem } = useCart();
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const cartProductIds = useMemo(
    () => new Set(cartItems.map((item) => item.product_id)),
    [cartItems]
  );

  useEffect(() => {
    let isMounted = true;

    const fetchRecommendations = async () => {
      setIsLoading(true);
      const collected: Record<string, Product> = {};

      for (const item of cartItems) {
        const complementary = await getComplementaryProducts(item.product, 6);
        for (const product of complementary) {
          if (cartProductIds.has(product.id)) continue;
          collected[product.id] = product;
        }
      }

      const list = Object.values(collected)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, maxProducts);

      if (isMounted) {
        setRecommendations(list);
        setIsLoading(false);
      }
    };

    if (cartItems.length === 0) {
      setRecommendations([]);
      setIsLoading(false);
      return;
    }

    fetchRecommendations();

    return () => {
      isMounted = false;
    };
  }, [cartItems, cartProductIds, maxProducts]);

  if (isLoading || recommendations.length === 0) {
    return null;
  }

  return (
    <section
      className={cn(
        'border-t border-border/60 pt-8',
        className
      )}
    >
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          {t('title')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>
      <Carousel
        itemsPerView={{ base: 1, sm: 2, md: 3, lg: 4 }}
        gap={20}
        showDots={false}
      >
        {recommendations.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={async () => addItem(product, 1)}
          />
        ))}
      </Carousel>
    </section>
  );
}
