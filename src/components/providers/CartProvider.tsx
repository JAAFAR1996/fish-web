'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';

import type {
  CartContextValue,
  CartItemWithProduct,
  LocalStorageCartItem,
  Product,
  SavedForLaterItem,
} from '@/types';

import { getProductsWithFlashSales } from '@/lib/data/products';
import { getEffectiveUnitPrice } from '@/lib/marketing/flash-sales-helpers';
import {
  addToCartAction,
  clearCartAction,
  removeFromCartAction,
  syncGuestCartAction,
  updateQuantityAction,
} from '@/lib/cart/cart-actions';
import {
  addGuestCartItem,
  clearGuestCart,
  getGuestCart,
  getGuestSavedItems,
  moveGuestItemToSaved,
  moveGuestSavedToCart,
  removeGuestCartItem,
  saveGuestSavedItems,
  updateGuestCartQuantity,
} from '@/lib/cart/cart-storage';
import {
  calculateShipping,
  calculateSubtotal,
  calculateTotal,
  getTotalItemCount,
} from '@/lib/cart/cart-utils';
import { MAX_QUANTITY } from '@/lib/cart/constants';
import { useAuth } from './SupabaseAuthProvider';
import { SidebarCart } from '@/components/cart/sidebar-cart';
import { trackEvent } from '@/components/analytics/plausible-analytics';

const CartContext = createContext<CartContextValue | null>(null);

type Props = {
  children: ReactNode;
};

function mapStorageItemsToProducts(
  storageItems: LocalStorageCartItem[],
  products: Product[]
): CartItemWithProduct[] {
  return storageItems
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return null;
      const unitPrice = getEffectiveUnitPrice(product);
      return {
        id: `guest-${product.id}`,
        cart_id: 'guest',
        product_id: product.id,
        quantity: item.quantity,
        unit_price: unitPrice,
        created_at: new Date(item.addedAt).toISOString(),
        updated_at: new Date(item.addedAt).toISOString(),
        product,
      } as CartItemWithProduct;
    })
    .filter((value): value is CartItemWithProduct => value !== null);
}

function mapSavedItemsToProducts(
  savedItems: SavedForLaterItem[],
  products: Product[]
): CartItemWithProduct[] {
  return savedItems
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return null;
      const unitPrice = getEffectiveUnitPrice(product);
      return {
        id: `saved-${product.id}`,
        cart_id: 'guest-saved',
        product_id: product.id,
        quantity: item.quantity,
        unit_price: unitPrice,
        created_at: new Date(item.addedAt).toISOString(),
        updated_at: new Date(item.addedAt).toISOString(),
        product,
      } as CartItemWithProduct;
    })
    .filter((value): value is CartItemWithProduct => value !== null);
}

export function CartProvider({ children }: Props) {
  const { user, supabase } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<CartItemWithProduct[]>([]);
  const [savedItems, setSavedItems] = useState<CartItemWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const productsRef = useRef<Product[] | null>(null);
  const previousUserIdRef = useRef<string | null>(null);

  const loadProducts = useCallback(async () => {
    if (productsRef.current) {
      return productsRef.current;
    }
    const products = await getProductsWithFlashSales();
    productsRef.current = products;
    return products;
  }, []);

  const loadGuestData = useCallback(async () => {
    const products = await loadProducts();
    const guestCart = getGuestCart();
    const guestSaved = getGuestSavedItems();

    setItems(mapStorageItemsToProducts(guestCart.items, products));
    setSavedItems(mapSavedItemsToProducts(guestSaved, products));
  }, [loadProducts]);

  const loadUserData = useCallback(async () => {
    if (!user || !supabase) return;

    const products = await loadProducts();
    const { data: cart, error } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      console.error('Failed to load user cart', error);
    }

    if (!cart) {
      setItems([]);
      setSavedItems([]);
      return;
    }

    const { data: cartItems, error: itemsError } = await supabase
      .from('cart_items')
      .select('id, cart_id, product_id, quantity, unit_price, created_at, updated_at')
      .eq('cart_id', cart.id);

    if (itemsError) {
      console.error('Failed to load cart items', itemsError);
      setItems([]);
      setSavedItems([]);
      return;
    }

    const pendingPriceSync: Array<{ productId: string; quantity: number }> = [];

    const mappedItems = (cartItems ?? [])
      .map((item) => {
        const product = products.find((p) => p.id === item.product_id);
        if (!product) return null;
        const nextUnitPrice = getEffectiveUnitPrice(product);

        if (item.unit_price !== nextUnitPrice) {
          pendingPriceSync.push({
            productId: item.product_id,
            quantity: item.quantity,
          });
        }

        return {
          ...item,
          unit_price: nextUnitPrice,
          product,
        } as CartItemWithProduct;
      })
      .filter((value): value is CartItemWithProduct => value !== null);

    setItems(mappedItems);
    setSavedItems([]);

    if (pendingPriceSync.length > 0) {
      try {
        await Promise.all(
          pendingPriceSync.map(({ productId, quantity }) =>
            updateQuantityAction(productId, quantity)
          )
        );
      } catch (error) {
        console.error('Failed to sync cart item pricing', error);
      }
    }
  }, [loadProducts, supabase, user]);

  const loadCart = useCallback(async () => {
    setIsLoading(true);
    try {
      if (user) {
        await loadUserData();
      } else {
        await loadGuestData();
      }
    } finally {
      setIsLoading(false);
    }
  }, [loadGuestData, loadUserData, user]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  useEffect(() => {
    const previousUserId = previousUserIdRef.current;
    const currentUserId = user?.id ?? null;

    if (!previousUserId && currentUserId) {
      const guestCart = getGuestCart();
      const guestSaved = getGuestSavedItems();

      const syncAndLoad = async () => {
        if (guestCart.items.length > 0) {
          const response = await syncGuestCartAction(guestCart.items);
          if (response.success) {
            clearGuestCart();
          }
        }

        await loadCart();

        if (guestSaved.length > 0) {
          const products = await loadProducts();
          setSavedItems(mapSavedItemsToProducts(guestSaved, products));
        }

        router.refresh();
      };

      syncAndLoad();
    } else if (previousUserId && !currentUserId) {
      loadCart();
      router.refresh();
    }

    previousUserIdRef.current = currentUserId;
  }, [loadCart, loadProducts, router, user]);

  const addItem = useCallback(
    async (product: Product, quantity: number = 1) => {
      const unitPrice = getEffectiveUnitPrice(product);
      const maxAllowed = Math.min(product.stock, MAX_QUANTITY);

      if (maxAllowed <= 0) {
        return;
      }

      if (user) {
        const optimisticItems = [...items];
        const existing = optimisticItems.find(
          (item) => item.product_id === product.id
        );
        const currentQuantity = existing ? existing.quantity : 0;
        const quantityToAdd = Math.min(quantity, Math.max(maxAllowed - currentQuantity, 0));
        const finalQuantity = Math.min(currentQuantity + quantityToAdd, maxAllowed);

        if (existing) {
          existing.quantity = finalQuantity;
          existing.unit_price = unitPrice;
          existing.updated_at = new Date().toISOString();
        } else {
          optimisticItems.push({
            id: `optimistic-${product.id}`,
            cart_id: 'optimistic',
            product_id: product.id,
            quantity: finalQuantity,
            unit_price: unitPrice,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            product,
          });
        }
        setItems(optimisticItems);
        setIsSidebarOpen(true);

        const response = quantityToAdd > 0
          ? await addToCartAction(product.id, quantityToAdd)
          : { success: true };

        await loadCart();

        if (response.success && quantityToAdd > 0) {
          trackEvent('Add to Cart', {
            product: product.name,
            price: unitPrice,
            quantity: quantityToAdd,
          });
        }
        return;
      }

      const guestCart = getGuestCart();
      const existingItem = guestCart.items.find(
        (entry) => entry.productId === product.id
      );

      const desiredQuantity =
        (existingItem?.quantity ?? 0) + quantity;
      const finalQuantity = Math.min(desiredQuantity, maxAllowed);
      const quantityToAdd = finalQuantity - (existingItem?.quantity ?? 0);

      if (quantityToAdd <= 0) {
        return;
      }

      let updatedCart;
      if (existingItem) {
        updatedCart = updateGuestCartQuantity(product.id, finalQuantity);
      } else {
        updatedCart = addGuestCartItem(product.id, finalQuantity);
      }

      const products = await loadProducts();
      setItems(mapStorageItemsToProducts(updatedCart.items, products));
      setIsSidebarOpen(true);
      trackEvent('Add to Cart', {
        product: product.name,
        price: unitPrice,
        quantity: quantityToAdd,
      });
    },
    [items, loadCart, loadProducts, user]
  );

  const removeItem = useCallback(
    async (productId: string) => {
      if (user) {
        const optimisticItems = items.filter(
          (item) => item.product_id !== productId
        );
        setItems(optimisticItems);
        const response = await removeFromCartAction(productId);
        await loadCart();
        return;
      }

      const updatedCart = removeGuestCartItem(productId);
      const products = await loadProducts();
      setItems(mapStorageItemsToProducts(updatedCart.items, products));
    },
    [items, loadCart, loadProducts, user]
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (user) {
        const optimisticItems = items.map((item) =>
          item.product_id === productId
            ? { ...item, quantity }
            : item
        );
        setItems(optimisticItems);
        const response = await updateQuantityAction(productId, quantity);
        await loadCart();
        return;
      }

      const updatedCart = updateGuestCartQuantity(productId, quantity);
      const products = await loadProducts();
      setItems(mapStorageItemsToProducts(updatedCart.items, products));
    },
    [items, loadCart, loadProducts, user]
  );

  const saveForLater = useCallback(
    async (productId: string) => {
      if (user) {
        // Phase 11: store in memory until wishlist integration.
        const item = items.find((i) => i.product_id === productId);
        if (!item) return;
        setItems((prev) =>
          prev.filter((cartItem) => cartItem.product_id !== productId)
        );
        setSavedItems((prev) => [...prev, item]);
        return;
      }

      const { cart, savedItems: guestSaved } = moveGuestItemToSaved(productId);
      const products = await loadProducts();
      setItems(mapStorageItemsToProducts(cart.items, products));
      setSavedItems(mapSavedItemsToProducts(guestSaved, products));
    },
    [items, loadProducts, user]
  );

  const moveToCart = useCallback(
    async (productId: string) => {
      if (user) {
        const item = savedItems.find((i) => i.product_id === productId);
        if (!item) return;
        setSavedItems((prev) =>
          prev.filter((savedItem) => savedItem.product_id !== productId)
        );
        await addItem(item.product, item.quantity);
        return;
      }

      const { cart, savedItems: guestSaved } = moveGuestSavedToCart(
        productId,
        1
      );
      const products = await loadProducts();
      setItems(mapStorageItemsToProducts(cart.items, products));
      setSavedItems(mapSavedItemsToProducts(guestSaved, products));
    },
    [addItem, loadProducts, savedItems, user]
  );

  const removeSavedItem = useCallback(
    async (productId: string) => {
      if (user) {
        setSavedItems((prev) =>
          prev.filter((item) => item.product_id !== productId)
        );
        return;
      }

      const saved = getGuestSavedItems().filter(
        (item) => item.productId !== productId
      );
      saveGuestSavedItems(saved);
      const products = await loadProducts();
      setSavedItems(mapSavedItemsToProducts(saved, products));
    },
    [loadProducts, user]
  );

  const clearCartState = useCallback(() => {
    setItems([]);
    setSavedItems([]);
  }, []);

  const clearCart = useCallback(async () => {
    if (user) {
      const response = await clearCartAction();
      await loadCart();
      if (!response.success) {
        return;
      }
      return;
    }

    clearGuestCart();
    clearCartState();
  }, [clearCartState, loadCart, user]);

  const subtotal = useMemo(() => calculateSubtotal(items), [items]);
  const shipping = useMemo(() => calculateShipping(subtotal), [subtotal]);
  const total = useMemo(
    () => calculateTotal(subtotal, shipping),
    [shipping, subtotal]
  );
  const itemCount = useMemo(() => getTotalItemCount(items), [items]);

  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      savedItems,
      itemCount,
      subtotal,
      shipping,
      total,
      isLoading,
      addItem,
      removeItem,
      updateQuantity,
      saveForLater,
      moveToCart,
      removeSavedItem,
      clearCart,
      openSidebar,
      closeSidebar,
      isSidebarOpen,
    }),
    [
      addItem,
      clearCart,
      closeSidebar,
      isLoading,
      isSidebarOpen,
      itemCount,
      items,
      moveToCart,
      openSidebar,
      removeItem,
      saveForLater,
      savedItems,
      removeSavedItem,
      shipping,
      subtotal,
      total,
      updateQuantity,
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <SidebarCart />
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
