"use client";

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { Button, Icon } from '@/components/ui';
import type { GallerySetupWithProducts, Locale } from '@/types';
import { useCart } from '@/components/providers/CartProvider';

interface ShopThisSetupButtonProps {
  setup: GallerySetupWithProducts;
  variant?: 'button' | 'floating';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ShopThisSetupButton({ setup, variant = 'button', size = 'md', className }: ShopThisSetupButtonProps) {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const locale = useLocale() as Locale;
  const t = useTranslations('gallery.actions');

  const uniqueProducts = Array.from(new Set(setup.products.map((p) => p.id)))
    .map((id) => setup.products.find((p) => p.id === id)!)
    .filter(Boolean);

  const handleAdd = async () => {
    setIsAdding(true);
    setProgress({ current: 0, total: uniqueProducts.length });
    try {
      for (let i = 0; i < uniqueProducts.length; i++) {
        const product = uniqueProducts[i]!;
        if (product.stock > 0) {
          await addItem(product, 1);
        }
        setProgress({ current: i + 1, total: uniqueProducts.length });
      }
    } finally {
      setIsAdding(false);
    }
  };

  const label = isAdding
    ? t('addingToCart', { current: progress.current, total: progress.total })
    : `${t('shopThisSetup')} (${uniqueProducts.length})`;

  if (variant === 'floating') {
    return (
      <button
        type="button"
        onClick={handleAdd}
        disabled={isAdding}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-aqua-500 text-white shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={label}
        title={label}
      >
        <Icon name="shopping-cart" className={isAdding ? 'animate-pulse-slow' : ''} />
      </button>
    );
  }

  return (
    <Button type="button" variant="primary" size={size} className={className} onClick={handleAdd} disabled={isAdding}>
      <Icon name="shopping-cart" className="mr-2 h-4 w-4" /> {label}
    </Button>
  );
}
