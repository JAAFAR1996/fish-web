import { STORAGE_BUCKET } from './constants';

export const extractPathFromUrl = (url: string): string | null => {
  const marker = `${STORAGE_BUCKET}/`;
  const index = url.indexOf(marker);

  if (index === -1) {
    return null;
  }

  return url.slice(index + marker.length);
};