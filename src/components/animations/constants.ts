export const LOTTIE_ANIMATIONS = {
  fishLoader: 'https://lottie.host/ead41bb3-086e-4db5-8d26-4dd98ec6053c/aXoaZFySUH.json',
  heartLike: 'https://lottie.host/3b2f8ec7-6f4e-4285-9301-9a5e4cb1124c/4HtA0xgIii.json',
  emptyAquarium: 'https://lottie.host/f77175df-b70c-4385-9612-3b0c88aad176/1bgP4h9Hkn.json',
} as const;

export type LottieAnimationKey = keyof typeof LOTTIE_ANIMATIONS;

export const getLottieUrl = (key: LottieAnimationKey): string => LOTTIE_ANIMATIONS[key];

