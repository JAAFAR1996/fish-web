import type { LocalStorageWishlistItem } from '@/types';

import { MAX_WISHLIST_ITEMS, WISHLIST_STORAGE_KEY } from './constants';

function isBrowser() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

export function getGuestWishlist(): LocalStorageWishlistItem[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is LocalStorageWishlistItem => {
      return (
        item &&
        typeof item.productId === 'string' &&
        typeof item.addedAt === 'number'
      );
    });
  } catch (error) {
    console.error('Failed to parse guest wishlist from storage', error);
    return [];
  }
}

export function saveGuestWishlist(items: LocalStorageWishlistItem[]): void {
  if (!isBrowser()) {
    return;
  }

  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save guest wishlist to storage', error);
  }
}

export function addGuestWishlistItem(productId: string): LocalStorageWishlistItem[] {
  const items = getGuestWishlist();

  if (items.some((item) => item.productId === productId)) {
    return items;
  }

  if (items.length >= MAX_WISHLIST_ITEMS) {
    return items;
  }

  const updated = [
    {
      productId,
      addedAt: Date.now(),
    },
    ...items,
  ];

  saveGuestWishlist(updated);
  return updated;
}

export function removeGuestWishlistItem(productId: string): LocalStorageWishlistItem[] {
  const items = getGuestWishlist();
  const updated = items.filter((item) => item.productId !== productId);
  saveGuestWishlist(updated);
  return updated;
}

export function toggleGuestWishlistItem(productId: string): {
  items: LocalStorageWishlistItem[];
  added: boolean;
} {
  const items = getGuestWishlist();
  const exists = items.some((item) => item.productId === productId);

  if (exists) {
    const updated = items.filter((item) => item.productId !== productId);
    saveGuestWishlist(updated);
    return { items: updated, added: false };
  }

  if (items.length >= MAX_WISHLIST_ITEMS) {
    return { items, added: false };
  }

  const updated = [
    {
      productId,
      addedAt: Date.now(),
    },
    ...items,
  ];

  saveGuestWishlist(updated);
  return { items: updated, added: true };
}

export function clearGuestWishlist(): void {
  if (!isBrowser()) {
    return;
  }

  try {
    localStorage.removeItem(WISHLIST_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear guest wishlist from storage', error);
  }
}

export function isInGuestWishlist(productId: string): boolean {
  const items = getGuestWishlist();
  return items.some((item) => item.productId === productId);
}
