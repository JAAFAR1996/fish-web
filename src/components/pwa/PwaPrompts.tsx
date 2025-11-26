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
  const showInstallPrompt =
    process.env.NEXT_PUBLIC_PWA_AUTO_PROMPT === 'true' &&
    process.env.NEXT_PUBLIC_SHOW_INSTALL_PROMPT !== 'false';

  return (
    <>
      <OfflineIndicator />
      {showInstallPrompt && <InstallPrompt />}
      <UpdatePrompt />
    </>
  );
}
