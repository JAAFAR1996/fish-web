'use client';

import dynamic from 'next/dynamic';

const OfflineIndicator = dynamic(() =>
  import('./offline-indicator').then((mod) => mod.OfflineIndicator),
  { ssr: false }
);

const InstallPrompt = dynamic(() =>
  import('./install-prompt').then((mod) => mod.InstallPrompt),
  { ssr: false }
);

const UpdatePrompt = dynamic(() =>
  import('./update-prompt').then((mod) => mod.UpdatePrompt),
  { ssr: false }
);

export function PwaPrompts() {
  return (
    <>
      <OfflineIndicator />
      <InstallPrompt />
      <UpdatePrompt />
    </>
  );
}
