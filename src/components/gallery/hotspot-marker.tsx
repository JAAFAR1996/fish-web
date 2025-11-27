"use client";
import type { Hotspot } from '@/types';
import { cn } from '@/lib/utils';

interface HotspotMarkerProps {
  hotspot: Pick<Hotspot, 'x' | 'y'>;
  index: number;
  productName?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

export function HotspotMarker({ hotspot, index, productName, onClick, className }: HotspotMarkerProps) {
  return (
    <button
      type="button"
      aria-label={`Product ${index + 1}: ${productName ?? ''}`}
      onClick={onClick}
      className={cn(
        'absolute z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-aqua-500 text-xs font-bold text-white shadow-md transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'animate-pulse-slow',
        className,
      )}
      style={{ top: `${hotspot.y}%`, left: `${hotspot.x}%` }}
    >
      {index + 1}
    </button>
  );
}
