"use client";

import { useEffect, useState } from 'react';

import type { Product } from '@/types';
import {
  cacheProductsForOffline,
  getOfflineProducts,
} from './offline-storage';

interface UseOfflineProductsOptions {
  initialFetchFailed?: boolean;
}

const isOfflineModeEnabled =
  process.env.NEXT_PUBLIC_OFFLINE_MODE_ENABLED !== 'false';

export function useOfflineProducts(
  initialProducts: Product[],
  options: UseOfflineProductsOptions = {},
): Product[] {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  useEffect(() => {
    if (!isOfflineModeEnabled) return;
    if (typeof window === 'undefined') return;
    if (options.initialFetchFailed) return;
    if (!initialProducts.length) return;

    cacheProductsForOffline(initialProducts).catch((error) => {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Failed to cache products for offline use', error);
      }
    });
  }, [initialProducts, options.initialFetchFailed]);

  useEffect(() => {
    if (!isOfflineModeEnabled) return;
    if (typeof window === 'undefined') return;

    let isMounted = true;

    const loadOfflineProducts = async () => {
      try {
        const cached = await getOfflineProducts();
        if (isMounted && cached.length > 0) {
          setProducts(cached);
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Failed to load offline products', error);
        }
      }
    };

    const shouldLoadOffline =
      options.initialFetchFailed ||
      initialProducts.length === 0 ||
      (typeof navigator !== 'undefined' && navigator.onLine === false);

    if (shouldLoadOffline) {
      loadOfflineProducts();
    }

    const handleOffline = () => {
      loadOfflineProducts();
    };

    window.addEventListener('offline', handleOffline);

    return () => {
      isMounted = false;
      window.removeEventListener('offline', handleOffline);
    };
  }, [initialProducts.length, options.initialFetchFailed]);

  return products;
}
