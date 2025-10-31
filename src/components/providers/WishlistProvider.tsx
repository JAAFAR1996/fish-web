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
  LocalStorageWishlistItem,
  Product,
  WishlistContextValue,
  WishlistItemWithProduct,
} from '@/types';

import { getProductsWithFlashSales } from '@/lib/data/products';
import {
  addGuestWishlistItem,
  clearGuestWishlist,
  getGuestWishlist,
  removeGuestWishlistItem,
} from '@/lib/wishlist/wishlist-storage';
import { MAX_WISHLIST_ITEMS } from '@/lib/wishlist/constants';
import {
  addToWishlistAction,
  clearWishlistAction,
  removeFromWishlistAction,
  syncGuestWishlistAction,
} from '@/lib/wishlist/wishlist-actions';
import { useAuth } from './SupabaseAuthProvider';
import { useCart } from './CartProvider';

const WishlistContext = createContext<WishlistContextValue | null>(null);

type Props = {
  children: ReactNode;
};

function mapStorageItemsToProducts(
  storageItems: LocalStorageWishlistItem[],
  products: Product[],
  userId: string | null
): WishlistItemWithProduct[] {
  const productMap = new Map(products.map((product) => [product.id, product]));

  return storageItems
    .map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        return null;
      }

      return {
        id: `${userId ?? 'guest'}-${product.id}`,
        user_id: userId ?? 'guest',
        product_id: product.id,
        created_at: new Date(item.addedAt).toISOString(),
        product,
      } as WishlistItemWithProduct;
    })
    .filter((value): value is WishlistItemWithProduct => value !== null);
}

function mapSupabaseItemsToProducts(
  wishlist: Array<{
    id: string;
    user_id: string;
    product_id: string;
    created_at: string;
  }>,
  products: Product[]
): WishlistItemWithProduct[] {
  const productMap = new Map(products.map((product) => [product.id, product]));

  return wishlist
    .map((item) => {
      const product = productMap.get(item.product_id);
      if (!product) {
        return null;
      }

      return {
        ...item,
        product,
      } as WishlistItemWithProduct;
    })
    .filter((value): value is WishlistItemWithProduct => value !== null);
}

export function WishlistProvider({ children }: Props) {
  const { user, supabase } = useAuth();
  const { addItem: addToCart } = useCart();
  const router = useRouter();

  const [items, setItems] = useState<WishlistItemWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    const wishlist = getGuestWishlist();
    const mapped = mapStorageItemsToProducts(wishlist, products, null);
    setItems(mapped);
  }, [loadProducts]);

  const loadUserData = useCallback(async () => {
    if (!user || !supabase) {
      return;
    }

    const { data, error } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load wishlist', error);
      setItems([]);
      return;
    }

    const products = await loadProducts();
    const mapped = mapSupabaseItemsToProducts(data ?? [], products);
    setItems(mapped);
  }, [loadProducts, supabase, user]);

  const loadWishlist = useCallback(async () => {
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
    loadWishlist();
  }, [loadWishlist]);

  useEffect(() => {
    const previousUserId = previousUserIdRef.current;
    const currentUserId = user?.id ?? null;

    if (!previousUserId && currentUserId) {
      const syncGuestWishlist = async () => {
        const wishlist = getGuestWishlist();
        if (wishlist.length) {
          await syncGuestWishlistAction(wishlist);
          clearGuestWishlist();
        }
        await loadWishlist();
        router.refresh();
      };

      syncGuestWishlist();
    } else if (previousUserId && !currentUserId) {
      loadWishlist();
      router.refresh();
    }

    previousUserIdRef.current = currentUserId;
  }, [loadWishlist, router, user]);

  const isInWishlist = useCallback(
    (productId: string) => items.some((item) => item.product_id === productId),
    [items]
  );

  const addItem = useCallback(
    async (product: Product) => {
      if (items.length >= MAX_WISHLIST_ITEMS) {
        console.warn('Wishlist limit reached');
        return;
      }

      if (user) {
        await addToWishlistAction(product.id);
        setItems((prev) => {
          if (prev.some((item) => item.product_id === product.id)) {
            return prev;
          }

          return [
            {
              id: `temp-${product.id}`,
              user_id: user.id,
              product_id: product.id,
              created_at: new Date().toISOString(),
              product,
            },
            ...prev,
          ];
        });

        loadUserData().catch((error) => {
          console.error('Failed to refresh wishlist after add', error);
        });
        return;
      }

      const updated = addGuestWishlistItem(product.id);
      const products = await loadProducts();
      const mapped = mapStorageItemsToProducts(updated, products, null);
      setItems(mapped);
    },
    [items, loadProducts, loadUserData, user]
  );

  const removeItem = useCallback(
    async (productId: string) => {
      if (user) {
        await removeFromWishlistAction(productId);
        setItems((prev) => prev.filter((item) => item.product_id !== productId));
        return;
      }

      const updated = removeGuestWishlistItem(productId);
      const products = await loadProducts();
      const mapped = mapStorageItemsToProducts(updated, products, null);
      setItems(mapped);
    },
    [loadProducts, user]
  );

  const toggleItem = useCallback(
    async (product: Product) => {
      if (isInWishlist(product.id)) {
        await removeItem(product.id);
      } else {
        await addItem(product);
      }
    },
    [addItem, isInWishlist, removeItem]
  );

  const clearWishlist = useCallback(async () => {
    if (user) {
      await clearWishlistAction();
      setItems([]);
      return;
    }

    clearGuestWishlist();
    setItems([]);
  }, [user]);

  const moveToCart = useCallback(
    async (productId: string) => {
      const item = items.find((wishlistItem) => wishlistItem.product_id === productId);
      if (!item) {
        return;
      }

      await addToCart(item.product, 1);
      await removeItem(productId);
    },
    [addToCart, items, removeItem]
  );

  const value = useMemo<WishlistContextValue>(() => ({
    items,
    itemCount: items.length,
    isLoading,
    addItem,
    removeItem,
    toggleItem,
    isInWishlist,
    clearWishlist,
    moveToCart,
  }), [addItem, clearWishlist, isInWishlist, isLoading, items, moveToCart, removeItem, toggleItem]);

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
