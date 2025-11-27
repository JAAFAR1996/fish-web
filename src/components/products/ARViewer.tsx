'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { FEATURES } from '@/lib/config/features';

type ARViewerProps = {
  modelUrl: string;
  className?: string;
};

export function ARViewer({ modelUrl, className }: ARViewerProps) {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const hasXR = typeof navigator !== 'undefined' && 'xr' in navigator;
    setSupported(hasXR);
  }, []);

  if (!FEATURES.arViewer) return null;

  const button = (
    <Button
      variant="outline"
      size="sm"
      className={className}
      onClick={() => window.open(modelUrl, '_blank')}
    >
      <Icon name="maximize" size="sm" className="me-2" />
      View in Your Home
    </Button>
  );

  if (!supported) return button;

  return (
    <a href={modelUrl} rel="ar" className="inline-flex">
      {button}
    </a>
  );
}
