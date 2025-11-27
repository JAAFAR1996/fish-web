'use client';

import { useEffect, useState } from 'react';

import { Button, Icon } from '@/components/ui';
import { BubbleTrail } from '@/components/effects/BubbleTrail';
import { FEATURES } from '@/lib/config/features';

const STORAGE_KEY = 'ui-bubble-trail';

const getInitial = (): boolean => {
  if (typeof window === 'undefined') return true;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'off') return false;
  if (saved === 'on') return true;
  return true;
};

type BubbleTrailToggleProps = {
  showToggle?: boolean;
};

export function BubbleTrailToggle({ showToggle = true }: BubbleTrailToggleProps) {
  const [enabled, setEnabled] = useState<boolean>(getInitial());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
  }, [enabled]);

  useEffect(() => {
    const sync = () => setEnabled(getInitial());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  if (!FEATURES.bubbleTrail) return null;

  return (
    <>
      {showToggle && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-sm">
          <div className="flex items-center gap-2 text-foreground">
            <Icon name="sparkles" size="sm" aria-hidden />
            <span>Bubble trail</span>
          </div>
          <Button
            size="sm"
            variant={enabled ? 'primary' : 'ghost'}
            className="h-8 px-3"
            onClick={() => setEnabled((prev) => !prev)}
          >
            {enabled ? 'On' : 'Off'}
          </Button>
        </div>
      )}
      <BubbleTrail enabled={enabled} />
    </>
  );
}
