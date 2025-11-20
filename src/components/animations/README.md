# Animations

Utilities and components for rendering lightweight Lottie animations with graceful fallbacks.

## Overview

- **`LottieIcon`** mirrors the API of the Lucide-based `Icon` component while swapping the glyph for a Lottie animation when animation flags are enabled.
- **`useLottieJson`** fetches animation JSON from a CDN (with timeout, retry, and localStorage caching) and degrades to optional local data.
- All animations are gated behind `FEATURES.lottie` and respect `prefers-reduced-motion`.
- Every integration has a multi-level fallback: Lottie CDN → optional local JSON → Lucide icon.

## Available animations

```ts
import { LOTTIE_ANIMATIONS } from '@/components/animations';

LOTTIE_ANIMATIONS.fishLoader     // Jelly fish preloader (1.5 KB)
LOTTIE_ANIMATIONS.heartLike      // Heart like micro-interaction
LOTTIE_ANIMATIONS.emptyAquarium  // Aquarium empty state
```

Use `getLottieUrl('fishLoader')` if you prefer helper access.

## Usage examples

```tsx
import { LottieIcon, LOTTIE_ANIMATIONS } from '@/components/animations';

// Loading spinner
<LottieIcon
  animationUrl={LOTTIE_ANIMATIONS.fishLoader}
  fallbackIcon="loader"
  size="sm"
  loop
  autoplay
  speed={1.2}
/>;

// Wishlist heart micro-interaction
<LottieIcon
  animationUrl={LOTTIE_ANIMATIONS.heartLike}
  fallbackIcon="heart"
  size="sm"
  loop={false}
  autoplay={isWishlisted}
/>;

// Empty cart illustration
import { EmptyCartLottie } from '@/components/cart';
<EmptyCartLottie variant="full" />;
```

## Adding a new animation

1. Find an animation on [LottieFiles](https://lottiefiles.com/) and save it to your workspace.
2. In the Handoff & Embed panel, enable **Asset Link** and copy the CDN JSON URL.
3. Append the URL (or local JSON import) to `LOTTIE_ANIMATIONS` in `constants.ts`.
4. Consume it via `LottieIcon` or a custom component, always providing a Lucide fallback icon.

## Performance & accessibility

- Animations are lazy-loaded via `dynamic()` to avoid impacting initial bundles.
- `useLottieJson` caches successful downloads in `localStorage` for offline resiliency.
- `prefers-reduced-motion` automatically falls back to the Lucide icon.
- Set `aria-hidden="true"` for decorative animations and rely on surrounding text for context.

## Troubleshooting

- **Animation never appears**: confirm `NEXT_PUBLIC_ENABLE_LOTTIE=true` and no network blocks. The Lucide icon fallback should appear otherwise.
- **Stale CDN data**: clear `localStorage` or bump the `cacheKey`.
- **Need different speed**: pass `speed` to `LottieIcon`; it applies after mount.
- **Animations in SSR output**: all components are client-only (`use client`) and the imports default to Lucide icons during SSR.

## Licensing

All bundled animation URLs reference assets published under the LottieFiles Simple License (free for commercial use with optional attribution). See individual animation pages for authorship details.

