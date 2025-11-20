'use client';

import { Icon } from '@/components/ui';
import { cn } from '@/lib/utils';

export function AquariumLoader({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'aquarium-fallback flex h-full w-full flex-col items-center justify-center gap-4 rounded-2xl',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label="Loading 3D aquarium scene"
    >
      <div className="flex items-end gap-2">
        <span
          className="h-3 w-3 rounded-full bg-aqua-400 animate-bubble-float"
          style={{ animationDelay: '0s' }}
        />
        <span
          className="h-4 w-4 rounded-full bg-ocean-400 animate-bubble-float"
          style={{ animationDelay: '0.2s' }}
        />
        <span
          className="h-5 w-5 rounded-full bg-coral-400 animate-bubble-float"
          style={{ animationDelay: '0.4s' }}
        />
      </div>
      <Icon
        name='loader'
        size='lg'
        className='text-aqua-600 dark:text-aqua-300 motion-safe:animate-spin'
        aria-hidden='true'
      />
      <p className="text-sm text-muted-foreground">Loading aquarium...</p>
    </div>
  );
}
