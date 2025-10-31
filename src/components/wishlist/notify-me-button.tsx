'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button, Icon } from '@/components/ui';
import type { Product } from '@/types';
import { cn } from '@/lib/utils';

import { NotifyMeModal } from './notify-me-modal';

export interface NotifyMeButtonProps {
  product: Product;
  variant?: 'button' | 'link';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function NotifyMeButton({
  product,
  variant = 'button',
  size = 'md',
  className,
}: NotifyMeButtonProps) {
  const t = useTranslations('wishlist.stock');
  const [isOpen, setIsOpen] = useState(false);

  if (variant === 'link') {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={cn(
            'inline-flex items-center gap-1 text-sm font-medium text-aqua-600 transition-colors hover:text-aqua-500',
            className
          )}
        >
          <Icon name="bell" size="sm" aria-hidden="true" />
          <span>{t('notifyMe')}</span>
        </button>
        <NotifyMeModal
          product={product}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={size}
        className={cn('items-center justify-center gap-2', className)}
        onClick={() => setIsOpen(true)}
      >
        <Icon name="bell" size="sm" aria-hidden="true" />
        {t('notifyMe')}
      </Button>
      <NotifyMeModal
        product={product}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
