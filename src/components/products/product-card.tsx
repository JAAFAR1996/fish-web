'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  Icon,
  ProductQuickView,
  StarRating,
  StockIndicator,
} from '@/components/ui';
import { FlashSaleBadge } from '@/components/marketing/flash-sale-badge';
import { Link } from '@/i18n/navigation';
import {
  cn,
  formatCompatibility,
  formatCurrency,
  formatProductSpec,
  getDiscountPercentage,
  getProductBadges,
  isLowStock,
  isOutOfStock,
  mergeRefs,
} from '@/lib/utils';
import { highlightSearchTerms } from '@/lib/search/highlight-utils';
import { isFlashSaleActive } from '@/lib/marketing/flash-sales-helpers';
import type { FlashSale, Locale, Product, ProductBadge } from '@/types';
import { useWishlist } from '@/components/providers/WishlistProvider';
import { NotifyMeButton } from '@/components/wishlist';
import { ShineEffect } from '@/components/effects';
import { useGSAP, gsap, PRESETS, EASING_GSAP, ScrollTrigger } from '@/hooks/useGSAP';
import { use3DTilt } from '@/hooks/use3DTilt';
import { FEATURES } from '@/lib/config/features';
import { prefersReducedMotion } from '@/lib/config/motion-tokens';
import { LOTTIE_ANIMATIONS, type LottieRefCurrentProps } from '@/components/animations';
import { willChangeManager } from '@/lib/utils/performance';

const LottieIcon = dynamic(
  () => import('@/components/animations').then((mod) => ({ default: mod.LottieIcon })),
  { ssr: false }
);

type BadgeVariant = 'info' | 'success' | 'destructive' | 'warning';

const BADGE_VARIANT_MAP: Record<ProductBadge, BadgeVariant> = {
  new: 'info',
  bestSeller: 'success',
  outOfStock: 'destructive',
  discount: 'warning',
};

export type ProductCardProps = {
  product: Product;
  flashSale?: FlashSale | null;
  onAddToCart: (product: Product) => Promise<void> | void;
  className?: string;
  priority?: boolean;
  primaryCtaLabelKey?: string;
  searchQuery?: string;
  averageRating?: number;
  reviewCountOverride?: number;
  glassHover?: boolean;
  tilt3D?: boolean;
  shineEffect?: boolean;
};

export function ProductCard({
  product,
  flashSale: flashSaleOverride,
  onAddToCart,
  className,
  priority = false,
  primaryCtaLabelKey,
  searchQuery,
  averageRating,
  reviewCountOverride,
  glassHover = false,
  tilt3D = false,
  shineEffect = false,
}: ProductCardProps) {
  const locale = useLocale() as Locale;
  const tProduct = useTranslations('product');
  const tActions = useTranslations('product.actions');
  const tWishlistActions = useTranslations('wishlist.actions');
  const tBadges = useTranslations('product.badges');
  const tSpecs = useTranslations('product.specs');
  const tA11y = useTranslations('product.a11y');
  const tFlashSales = useTranslations('marketing.flashSales');
  const { toggleItem, isInWishlist: wishlistContains } = useWishlist();

  const flashSale = flashSaleOverride ?? product.flashSale ?? null;
  const hasFlashSale = flashSale ? isFlashSaleActive(flashSale) : false;

  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isGlassHovering, setIsGlassHovering] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const heartLottieRef = useRef<LottieRefCurrentProps | null>(null);
  const reducedMotion = prefersReducedMotion();
  const { ref: tiltRef, style: tiltStyle, isActive: isTilting } = use3DTilt({
    maxRotation: 12,
    perspective: 1000,
    scale: 1.02,
    speed: 300,
    easing: EASING_GSAP.power2Out,
    resetOnLeave: true,
  });
  const cardMergedRef = useMemo(
    () => (tilt3D ? mergeRefs(cardRef, tiltRef) : cardRef),
    [tilt3D, tiltRef],
  );
  const { contextSafe } = useGSAP(
    (ctx) => {
      const imageEl = imageRef.current;
      if (!imageEl) {
        return;
      }

      ctx.add(() => {
        const trigger = ScrollTrigger.create({
          trigger: imageEl,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
          onUpdate: (self) => {
            const offset = (self.progress - 0.5) * 20;
            gsap.set(imageEl, { y: offset });
          },
          onRefresh: () => {
            gsap.set(imageEl, { y: 0 });
          },
        });

        willChangeManager.add(imageEl, ['transform']);

        return () => {
          trigger.kill();
          willChangeManager.remove(imageEl);
          gsap.set(imageEl, { y: 0 });
        };
      });
    },
    { scope: cardRef, dependencies: [product.id] },
  );
  const safeContext = useMemo(
    () => contextSafe ?? ((fn: (...args: unknown[]) => unknown) => fn),
    [contextSafe],
  );

  const isWishlisted = wishlistContains(product.id);
  const isWishlistPrimaryAction =
    primaryCtaLabelKey === 'wishlist.actions.moveToCart';
  const primaryCtaLabel = isWishlistPrimaryAction
    ? tWishlistActions('moveToCart')
    : tActions('addToCart');

  const currentPriceValue = hasFlashSale ? flashSale!.flash_price : product.price;
  const originalPriceValue = hasFlashSale ? flashSale!.original_price : product.originalPrice;
  const price = formatCurrency(currentPriceValue, locale);
  const originalPrice =
    originalPriceValue != null
      ? formatCurrency(originalPriceValue, locale)
      : null;
  const discountPercentage = getDiscountPercentage(
    originalPriceValue ?? null,
    currentPriceValue
  );
  const flashSaleSavings = hasFlashSale && originalPriceValue != null
    ? originalPriceValue - currentPriceValue
    : 0;
  const flashSaleSavingsText = flashSaleSavings > 0
    ? formatCurrency(flashSaleSavings, locale)
    : null;

  const compatibilityText = useMemo(() => {
    const formatted = formatCompatibility(
      product.specifications.compatibility.minTankSize,
      product.specifications.compatibility.maxTankSize,
      locale,
      {
        upTo: (value) => tSpecs('compatibilityUpTo', { value }),
        range: (min, max) => tSpecs('compatibilityRange', { min, max }),
        from: (value) => tSpecs('compatibilityFrom', { value }),
      }
    );
    return formatted || product.specifications.compatibility.displayText;
  }, [locale, product.specifications.compatibility, tSpecs]);

  const badges = useMemo(() => {
    const baseBadges = getProductBadges(product);

    if (!hasFlashSale) {
      return baseBadges;
    }

    const withFlashSale = baseBadges.includes('discount')
      ? baseBadges
      : [...baseBadges, 'discount'];

    return withFlashSale.slice(0, 2);
  }, [product, hasFlashSale]);

  const specs = useMemo(() => {
    const entries: Array<{ label: string; value: string }> = [];

    if (product.specifications.flow != null) {
      entries.push({
        label: tSpecs('flow'),
        value: formatProductSpec(
          product.specifications.flow,
          tSpecs('flowUnit'),
          locale
        ),
      });
    }

    if (product.specifications.power != null) {
      entries.push({
        label: tSpecs('power'),
        value: formatProductSpec(
          product.specifications.power,
          tSpecs('powerUnit'),
          locale
        ),
      });
    }

    if (compatibilityText) {
      entries.push({
        label: tSpecs('compatibility'),
        value: compatibilityText,
      });
    }

    return entries.slice(0, 2);
  }, [compatibilityText, locale, product.specifications, tSpecs]);

  const handleWishlistToggle = async () => {
    const wasWishlisted = isWishlisted;
    await toggleItem(product);

    if (FEATURES.lottie && heartLottieRef.current) {
      heartLottieRef.current.goToAndPlay(0, true);
      const targetFrame = wasWishlisted ? 0 : 60;
      heartLottieRef.current.goToAndStop(targetFrame, true);
    }
  };

  const handleAddToCart = async () => {
    try {
      setIsAddingToCart(true);
      await onAddToCart(product);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const animateHoverIn = useCallback(() => {
    if (!FEATURES.gsap || reducedMotion) {
      return;
    }

    const cardEl = cardRef.current;
    if (!cardEl) {
      return;
    }

    const imageEl = imageRef.current;
    willChangeManager.add(cardEl, ['transform', 'opacity']);
    if (imageEl) {
      willChangeManager.add(imageEl, ['transform']);
    }
    const ctaButtons = ctaRef.current
      ? Array.from(ctaRef.current.querySelectorAll('button'))
      : [];

    gsap.killTweensOf([cardEl, ...(imageEl ? [imageEl] : []), ...ctaButtons]);

    gsap.to(cardEl, {
      scale: 1.02,
      y: -4,
      duration: PRESETS.hover.duration / 1000,
      ease: 'elastic.out(1, 0.5)',
    });

    if (imageEl) {
      gsap.to(imageEl, {
        scale: 1.05,
        duration: PRESETS.hover.duration / 1000,
        ease: EASING_GSAP.power2Out,
      });
    }

    if (ctaButtons.length) {
      gsap.to(ctaButtons, {
        scale: 1.05,
        duration: 0.2,
        ease: 'bounce.out',
        stagger: 0.05,
      });
    }
  }, [reducedMotion]);

  const animateHoverOut = useCallback(() => {
    if (!FEATURES.gsap || reducedMotion) {
      return;
    }

    const cardEl = cardRef.current;
    if (!cardEl) {
      return;
    }

    const imageEl = imageRef.current;
    willChangeManager.auto(cardEl, ['transform', 'opacity'], 300);
    if (imageEl) {
      willChangeManager.auto(imageEl, ['transform'], 300);
    }
    const ctaButtons = ctaRef.current
      ? Array.from(ctaRef.current.querySelectorAll('button'))
      : [];

    gsap.killTweensOf([cardEl, ...(imageEl ? [imageEl] : []), ...ctaButtons]);

    gsap.to(cardEl, {
      scale: 1,
      y: 0,
      duration: PRESETS.hover.duration / 1000,
      ease: EASING_GSAP.power2Out,
    });

    if (imageEl) {
      gsap.to(imageEl, {
        scale: 1,
        duration: PRESETS.hover.duration / 1000,
        ease: EASING_GSAP.power2Out,
      });
    }

    if (ctaButtons.length) {
      gsap.to(ctaButtons, {
        scale: 1,
        duration: 0.2,
        ease: EASING_GSAP.power2Out,
      });
    }
  }, [reducedMotion]);

  const handleMouseEnterEffects = useCallback(() => {
    if (!FEATURES.gsap) {
      return;
    }

    safeContext(animateHoverIn)();
  }, [animateHoverIn, safeContext]);

  const handleMouseLeaveEffects = useCallback(() => {
    if (!FEATURES.gsap) {
      return;
    }

    safeContext(animateHoverOut)();
  }, [animateHoverOut, safeContext]);

  return (
    <>
      <Card
        ref={cardMergedRef}
        hoverable
        className={cn(
          'group relative transition-colors',
          glassHover &&
            'glass-hover glass-hover-scale motion-safe:transition-all duration-300 hover:!border-white/30',
          glassHover && isGlassHovering && 'glass-shimmer glass-shadow',
          tilt3D && 'tilt-3d-container',
          tilt3D && isTilting && 'tilt-3d-active',
          shineEffect && 'shine-effect-enabled',
          FEATURES.gsap && 'gsap-hover-active',
          className
        )}
        style={{
          ...(tilt3D ? tiltStyle : {}),
          ...(glassHover && isGlassHovering
            ? { willChange: 'transform, backdrop-filter' }
            : undefined),
        }}
        onMouseEnter={() => {
          handleMouseEnterEffects();
          if (glassHover) {
            setIsGlassHovering(true);
          }
        }}
        onMouseLeave={() => {
          handleMouseLeaveEffects();
          if (glassHover) {
            setIsGlassHovering(false);
          }
        }}
      >
        {shineEffect && tilt3D && isTilting && (
          <ShineEffect opacity={0.2} size={500} blur={80} speed={0.2} />
        )}
        <div className="relative overflow-hidden">
          <Link
            href={`/products/${encodeURIComponent(product.slug)}`}
            aria-label={tA11y('productImage', { productName: product.name })}
            className="block"
          >
            <div
              ref={imageRef}
              className={cn(
                'relative aspect-square bg-muted transition-all duration-300 parallax-image',
                FEATURES.gsap && 'parallax-image-active'
              )}
            >
              {glassHover && (
                <div
                  className={cn(
                    'pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300',
                    isGlassHovering && 'opacity-100 glass-overlay'
                  )}
                />
              )}
              <Image
                src={
                  product.thumbnail ||
                  product.images[0] ||
                  '/images/placeholder.png'
                }
                alt={tA11y('productImage', { productName: product.name })}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                loading={priority ? 'eager' : 'lazy'}
                fetchPriority={priority ? 'high' : 'auto'}
                className={cn(
                  'object-cover transition-transform duration-300',
                  !FEATURES.gsap && 'group-hover:scale-105',
                  glassHover && isGlassHovering && 'blur-sm'
                )}
                priority={priority}
              />
            </div>
          </Link>

          <div className="pointer-events-none absolute top-3 start-3 flex flex-col gap-1">
            {badges.map((badge) => (
              <Badge
                key={badge}
                variant={BADGE_VARIANT_MAP[badge]}
                className="pointer-events-auto w-fit"
              >
                {badge === 'discount'
                  ? tBadges('discount', { percent: discountPercentage })
                  : tBadges(badge)}
              </Badge>
            ))}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              'absolute top-3 end-3 z-10 rounded-full p-2 transition-colors',
              isWishlisted ? 'text-coral-500' : 'text-muted-foreground hover:text-coral-500',
              (!FEATURES.lottie && isWishlisted) && 'motion-safe:animate-heart-beat'
            )}
            onClick={handleWishlistToggle}
            aria-pressed={isWishlisted}
            aria-label={
              isWishlisted
                ? tProduct('actions.removeFromWishlist')
                : tProduct('actions.addToWishlist')
            }
          >
            {FEATURES.lottie ? (
              <LottieIcon
                animationUrl={LOTTIE_ANIMATIONS.heartLike}
                fallbackIcon="heart"
                size="sm"
                loop={false}
                autoplay={false}
                lottieRef={heartLottieRef}
                className="lottie-fade-in loaded"
                ariaHidden
              />
            ) : (
              <Icon
                name="heart"
                size="sm"
                fill={isWishlisted ? 'currentColor' : 'none'}
                strokeWidth={isWishlisted ? 0 : 1.5}
              />
            )}
          </Button>
        </div>

        <CardContent
          className={cn(
            'flex flex-1 flex-col gap-3 p-4',
            glassHover && isGlassHovering && 'glass-text-emphasis'
          )}
        >
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {searchQuery
                ? highlightSearchTerms(product.brand, searchQuery)
                : product.brand}
            </span>
            <Link
              href={`/products/${product.slug}`}
              className="text-base font-semibold text-foreground transition-colors hover:text-aqua-500 line-clamp-2"
            >
              {searchQuery
                ? highlightSearchTerms(product.name, searchQuery)
                : product.name}
            </Link>
          </div>

          {searchQuery && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-3">
              {highlightSearchTerms(product.description, searchQuery)}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            {specs.map((spec) => (
              <span key={spec.label} className="flex items-center gap-1">
                <span className="font-medium text-foreground">{spec.label}:</span>
                <span>{spec.value}</span>
              </span>
            ))}
          </div>

          {/* TODO: Replace static `product.rating`/`reviewCount` with live review summary when PLP batch query lands. */}
          <StarRating
            rating={averageRating ?? product.rating}
            reviewCount={reviewCountOverride ?? product.reviewCount}
            size="sm"
          />

          {hasFlashSale && flashSale && (
            <FlashSaleBadge flashSale={flashSale} />
          )}

          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-2">
              <span
                className={cn(
                  'text-lg font-bold',
                  hasFlashSale ? 'text-destructive' : 'text-foreground'
                )}
              >
                {price}
              </span>
              {originalPrice && discountPercentage > 0 && (
                <span className="text-sm text-muted-foreground line-through">
                  {originalPrice}
                </span>
              )}
            </div>
            {hasFlashSale && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-destructive/80">
                <span className="font-semibold uppercase tracking-wide">
                  {tFlashSales('flashPrice')}
                </span>
                {flashSaleSavingsText && (
                  <span>{tFlashSales('save', { amount: flashSaleSavingsText })}</span>
                )}
              </div>
            )}
          </div>

          {isLowStock(product) && (
            <StockIndicator
              stock={product.stock}
              lowStockThreshold={product.lowStockThreshold}
            />
          )}
        </CardContent>

        <div ref={ctaRef}>
          <CardFooter className="flex flex-col gap-2 p-4 pt-0 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => setIsQuickViewOpen(true)}
              aria-label={tA11y('quickViewButton', { productName: product.name })}
            >
              <Icon name="eye" size="sm" className="me-2" />
              {tActions('quickView')}
            </Button>

           {isOutOfStock(product) ? (
              <NotifyMeButton
                product={product}
                variant="button"
                size="sm"
                className="w-full sm:w-auto"
              />
            ) : (
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="w-full sm:w-auto"
                onClick={handleAddToCart}
                loading={isAddingToCart}
                disabled={isAddingToCart}
                aria-label={
                  isWishlistPrimaryAction
                    ? `${tWishlistActions('moveToCart')} - ${product.name}`
                    : tA11y('addToCartButton', { productName: product.name })
                }
              >
                {!isAddingToCart && <Icon name="cart" size="sm" className="me-2" />}
                {primaryCtaLabel}
              </Button>
            )}
          </CardFooter>
        </div>
      </Card>

      {isQuickViewOpen && (
        <ProductQuickView
          product={product}
          isOpen={isQuickViewOpen}
          onClose={() => setIsQuickViewOpen(false)}
          onAddToCart={onAddToCart}
        />
      )}
    </>
  );
}
