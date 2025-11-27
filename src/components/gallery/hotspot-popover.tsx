"use client";

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';

import { Button } from '@/components/ui';
import type { Product } from '@/types';
import { cn, formatCurrency } from '@/lib/utils';
import { useCart } from '@/components/providers/CartProvider';
import { useTranslations } from 'next-intl';

interface HotspotPopoverProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  anchorEl: HTMLElement | null;
  locale: 'ar' | 'en';
  className?: string;
}

export function HotspotPopover({ product, isOpen, onClose, anchorEl, locale, className }: HotspotPopoverProps) {
  const [isAdding, setIsAdding] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const { addItem } = useCart();
  const tGallery = useTranslations('gallery.actions');
  const tProduct = useTranslations('product.actions');

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      const target = e.target as Node;
      if (ref.current && !ref.current.contains(target) && anchorEl && !anchorEl.contains(target)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', onDocClick);
      return () => document.removeEventListener('mousedown', onDocClick);
    }
  }, [isOpen, onClose, anchorEl]);

  if (!isOpen || !anchorEl) return null;

  const rect = anchorEl.getBoundingClientRect();
  const top = rect.bottom + window.scrollY + 8;
  const left = rect.left + window.scrollX - 160 + rect.width / 2; // center 320px

  return (
    <div
      ref={ref}
      className={cn('fixed z-50 w-80 rounded-lg border border-border bg-background p-3 shadow-xl', className)}
      style={{ top, left }}
    >
      <div className="flex items-start gap-3">
        <div className="relative h-20 w-20 overflow-hidden rounded bg-muted">
          <Image src={product.thumbnail || product.images[0] || '/images/placeholder.png'} alt={product.name} fill sizes="80px" className="object-cover" />
        </div>
        <div className="flex-1">
          <h4 className="line-clamp-2 text-sm font-semibold text-foreground">{product.name}</h4>
          <p className="mt-1 text-xs text-muted-foreground">{product.brand}</p>
          <p className="mt-2 text-sm font-semibold text-foreground">{formatCurrency(product.price, locale)}</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="primary"
          className="flex-1"
          disabled={isAdding || product.stock <= 0}
          onClick={async () => {
            setIsAdding(true);
            try {
              await addItem(product, 1);
              onClose();
            } finally {
              setIsAdding(false);
            }
          }}
>
          {isAdding ? tGallery('addingToCart', { current: 1, total: 1 }) : tProduct('addToCart')}
        </Button>
        <Button type="button" size="sm" variant="outline" className="flex-1" onClick={onClose}>
          {tProduct('viewDetails')}
        </Button>
      </div>
    </div>
  );
}
