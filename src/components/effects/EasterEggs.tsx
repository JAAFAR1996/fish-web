'use client';

import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';

import { FEATURES } from '@/lib/config/features';

type EasterEggsProps = {
  logoRef?: React.RefObject<HTMLElement>;
  searchInputSelector?: string;
  secretKeyword?: string;
  onSecretFound?: () => void;
};

export function EasterEggs({
  logoRef,
  searchInputSelector = 'input[type="search"]',
  secretKeyword = 'fish',
  onSecretFound,
}: EasterEggsProps) {
  const clickCountRef = useRef(0);
  const [goldFishVisible, setGoldFishVisible] = useState(false);

  useEffect(() => {
    if (!FEATURES.easterEggs) return;
    const logo = logoRef?.current;
    if (!logo) return;

    const handleClick = () => {
      clickCountRef.current += 1;
      if (clickCountRef.current >= 5) {
        setGoldFishVisible(true);
        confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
        clickCountRef.current = 0;
        setTimeout(() => setGoldFishVisible(false), 3000);
      }
    };

    logo.addEventListener('click', handleClick);
    return () => logo.removeEventListener('click', handleClick);
  }, [logoRef]);

  useEffect(() => {
    if (!FEATURES.easterEggs) return;
    const input = document.querySelector(searchInputSelector) as HTMLInputElement | null;
    if (!input) return;
    const handleInput = () => {
      if (input.value.toLowerCase().includes(secretKeyword.toLowerCase())) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
        onSecretFound?.();
      }
    };
    input.addEventListener('input', handleInput);
    return () => input.removeEventListener('input', handleInput);
  }, [onSecretFound, searchInputSelector, secretKeyword]);

  if (!FEATURES.easterEggs || !goldFishVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[120]">
      <div className="fish-swim absolute left-10 top-1/2 text-6xl">🐟</div>
    </div>
  );
}
