'use client';

import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';
import { FEATURES } from '@/lib/config/features';
import { prefersReducedMotion } from '@/lib/config/motion-tokens';
import { LottieIcon, LOTTIE_ANIMATIONS } from '@/components/animations';

export interface EmptyCartLottieProps {
  variant?: 'sidebar' | 'full';
  className?: string;
}

export function EmptyCartLottie({ variant = 'full', className }: EmptyCartLottieProps) {
  const reducedMotion = prefersReducedMotion();
  const useLottie = typeof window !== 'undefined' && FEATURES.lottie && !reducedMotion;
  const size = variant === 'sidebar' ? 120 : 200;

  if (!useLottie) {
    return (
      <Icon
        name="cart"
        className={className}
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className={cn('lottie-container', className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <LottieIcon
        animationUrl={LOTTIE_ANIMATIONS.emptyAquarium}
        fallbackIcon="cart"
        size={size}
        loop
        autoplay
        className="lottie-fade-in loaded"
        ariaHidden
      />
    </div>
  );
}
