'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

import { gsap } from '@/hooks/useGSAP';
import { FEATURES } from '@/lib/config/features';

type FishSwimToCartProps = {
  trigger: number | string | boolean;
  originRef: RefObject<HTMLElement>;
  cartRef?: RefObject<HTMLElement>;
  onComplete?: () => void;
  color?: string;
};

const FishSvg = ({ color = '#00d9ff' }: { color?: string }) => (
  <svg viewBox="0 0 64 32" className="h-12 w-12 drop-shadow-lg" fill="none">
    <path
      d="M60 16c0 6-7 12-20 12-10 0-18-6-18-12S30 4 40 4c13 0 20 6 20 12Z"
      fill={color}
      opacity={0.8}
    />
    <path d="M12 4 6 10l-4-2v16l4-2 6 6V4Z" fill={color} opacity={0.7} />
    <circle cx="46" cy="14" r="2.4" fill="#0b1724" />
  </svg>
);

export function FishSwimToCart({
  trigger,
  originRef,
  cartRef,
  onComplete,
  color,
}: FishSwimToCartProps) {
  const [mounted, setMounted] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const fishRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !FEATURES.fishSwimToCart) return;
    if (!originRef.current || !fishRef.current || typeof window === 'undefined') return;

    const fallbackCart =
      cartRef?.current ??
      (document.querySelector('[data-cart-target]') as HTMLElement | null);
    const originRect = originRef.current.getBoundingClientRect();
    const targetRect = fallbackCart?.getBoundingClientRect();
    if (!targetRect) return;

    gsap.registerPlugin(MotionPathPlugin);
    gsap.set(fishRef.current, {
      position: 'fixed',
      left: originRect.left + originRect.width / 2,
      top: originRect.top + originRect.height / 2,
      scale: 0.5,
      opacity: 0,
      transformOrigin: '50% 50%',
    });

    const tl = gsap.timeline({
      defaults: { ease: 'power2.out' },
      onComplete: () => onComplete?.(),
    });

    tl.to(fishRef.current, {
      opacity: 1,
      scale: 0.9,
      duration: 0.2,
    }).to(fishRef.current, {
      duration: 1.1,
      ease: 'power3.inOut',
      motionPath: {
        path: [
          { x: originRect.left + originRect.width / 2, y: originRect.top + originRect.height / 2 },
          { x: targetRect.left + targetRect.width / 2, y: targetRect.top + targetRect.height / 2 },
        ],
        curviness: 1.4,
      },
      rotate: 25,
    }).to(
      fishRef.current,
      {
        opacity: 0,
        scale: 0.4,
        duration: 0.3,
        ease: 'power1.inOut',
      },
      '-=0.2',
    );

    return () => {
      tl.kill();
    };
  }, [cartRef, mounted, onComplete, originRef, trigger]);

  if (!mounted || !FEATURES.fishSwimToCart) return null;

  return createPortal(
    <div ref={overlayRef} className="pointer-events-none fixed inset-0 z-[80]">
      <div ref={fishRef} className="drop-shadow-xl">
        <FishSvg color={color} />
      </div>
    </div>,
    document.body,
  );
}
