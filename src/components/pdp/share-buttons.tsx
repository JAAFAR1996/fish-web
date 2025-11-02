'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Icon,
} from '@/components/ui';
import { cn, getWhatsAppShareUrl } from '@/lib/utils';
import type { Locale, Product } from '@/types';

export interface ShareButtonsProps {
  product: Pick<Product, 'slug' | 'name' | 'brand'> & {
    description?: string;
  };
  locale: Locale;
  variant?: 'button' | 'dropdown';
  className?: string;
  phoneNumber?: string;
}

function openWindow(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function ShareButtons({
  product,
  locale,
  variant = 'dropdown',
  className,
  phoneNumber,
}: ShareButtonsProps) {
  const t = useTranslations('pdp.share');
  const [copied, setCopied] = useState(false);

  const sharePath = `/${locale}/products/${product.slug}`;
  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return sharePath;
    }
    const { origin } = window.location;
    return `${origin}${sharePath}`;
  }, [sharePath]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleWhatsAppShare = () => {
    const url = getWhatsAppShareUrl(
      product,
      locale,
      phoneNumber,
      shareUrl
    );
    openWindow(url);
  };

  const handleFacebookShare = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      shareUrl
    )}`;
    openWindow(url);
  };

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
      shareUrl
    )}&text=${encodeURIComponent(product.name)}`;
    openWindow(url);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: shareUrl,
        });
        return;
      } catch {
        // fall back to copy
      }
    }
    handleCopy();
  };

  if (variant === 'button') {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn('inline-flex items-center gap-2', className)}
        onClick={handleNativeShare}
      >
        <Icon name="share" size="sm" />
        {copied ? t('linkCopied') : t('title')}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn('inline-flex items-center gap-2', className)}
        >
          <Icon name="share" size="sm" />
          {t('title')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[220px]">
        <DropdownMenuItem onSelect={handleCopy}>
          <Icon name="copy" size="sm" className="me-2 text-muted-foreground" />
          {copied ? t('linkCopied') : t('copyLink')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleWhatsAppShare}>
          <Icon name="whatsapp" size="sm" className="me-2 text-emerald-500" />
          {t('whatsapp')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleFacebookShare}>
          <Icon name="facebook" size="sm" className="me-2 text-sky-600" />
          {t('facebook')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleTwitterShare}>
          <Icon name="twitter" size="sm" className="me-2 text-sky-500" />
          {t('twitter')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
