import type {
  LocalStorageCart,
  LocalStorageCartItem,
  SavedForLaterItem,
} from '@/types';

import {
  SAVED_ITEMS_KEY,
  STORAGE_KEY,
} from './constants';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function getDefaultCart(): LocalStorageCart {
  return {
    items: [],
    updatedAt: Date.now(),
  };
}

export function getGuestCart(): LocalStorageCart {
  if (!isBrowser()) {
    return getDefaultCart();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getDefaultCart();
    }

    const parsed = JSON.parse(raw) as LocalStorageCart;
    if (
      !parsed ||
      !Array.isArray(parsed.items) ||
      typeof parsed.updatedAt !== 'number'
    ) {
      return getDefaultCart();
    }

    return parsed;
  } catch {
    return getDefaultCart();
  }
}

export function saveGuestCart(cart: LocalStorageCart): void {
  if (!isBrowser()) return;
  try {
    const payload = {
      ...cart,
      updatedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore localStorage errors
  }
}

export function addGuestCartItem(
  productId: string,
  quantity: number
): LocalStorageCart {
  const cart = getGuestCart();
  const existing = cart.items.find((item) => item.productId === productId);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.items.push({
      productId,
      quantity,
      addedAt: Date.now(),
    });
  }

  saveGuestCart(cart);
  return cart;
}

export function removeGuestCartItem(productId: string): LocalStorageCart {
  const cart = getGuestCart();
  cart.items = cart.items.filter((item) => item.productId !== productId);
  saveGuestCart(cart);
  return cart;
}

export function updateGuestCartQuantity(
  productId: string,
  quantity: number
): LocalStorageCart {
  const cart = getGuestCart();
  const target = cart.items.find((item) => item.productId === productId);

  if (!target) {
    return cart;
  }

  if (quantity <= 0) {
    return removeGuestCartItem(productId);
  }

  target.quantity = quantity;
  saveGuestCart(cart);
  return cart;
}

export function clearGuestCart(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore localStorage errors
  }
}

export function getGuestSavedItems(): SavedForLaterItem[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = localStorage.getItem(SAVED_ITEMS_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as SavedForLaterItem[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

export function saveGuestSavedItems(items: SavedForLaterItem[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(items));
  } catch {
    // ignore localStorage errors
  }
}

export function moveGuestItemToSaved(productId: string): {
  cart: LocalStorageCart;
  savedItems: SavedForLaterItem[];
} {
  const cart = getGuestCart();
  const savedItems = getGuestSavedItems();

  const target = cart.items.find((item) => item.productId === productId);
  if (!target) {
    return { cart, savedItems };
  }

  cart.items = cart.items.filter((item) => item.productId !== productId);
  savedItems.push({
    productId: target.productId,
    quantity: target.quantity,
    addedAt: Date.now(),
  });

  saveGuestCart(cart);
  saveGuestSavedItems(savedItems);

  return { cart, savedItems };
}

export function moveGuestSavedToCart(
  productId: string,
  quantity: number
): {
  cart: LocalStorageCart;
  savedItems: SavedForLaterItem[];
} {
  const cart = getGuestCart();
  let savedItems = getGuestSavedItems();

  const target = savedItems.find((item) => item.productId === productId);
  if (!target) {
    // add as new item if not found in saved items
    cart.items.push({
      productId,
      quantity,
      addedAt: Date.now(),
    });
  } else {
    cart.items.push({
      productId: target.productId,
      quantity: target.quantity,
      addedAt: Date.now(),
    });
    savedItems = savedItems.filter((item) => item.productId !== productId);
  }

  saveGuestCart(cart);
  saveGuestSavedItems(savedItems);

  return { cart, savedItems };
}
