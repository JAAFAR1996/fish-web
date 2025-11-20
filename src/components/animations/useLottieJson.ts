'use client';

import { useEffect, useRef, useState } from 'react';

import { FEATURES } from '@/lib/config/features';

export type UseLottieJsonOptions = {
  retries?: number;
  timeoutMs?: number;
  cacheKey?: string;
  fallbackData?: Record<string, unknown>;
};

export type UseLottieJsonReturn = {
  data: Record<string, unknown> | null;
  error: Error | null;
  loading: boolean;
  isFromCache: boolean;
};

class LottieTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LottieTimeoutError';
  }
}

const fetchWithTimeout = async (url: string, timeoutMs: number): Promise<Response> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    if ((error as Error).name === 'AbortError') {
      throw new LottieTimeoutError(`Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  }
};

const readCache = (cacheKey?: string): Record<string, unknown> | null => {
  if (!cacheKey || typeof window === 'undefined') {
    return null;
  }

  try {
    const cached = window.localStorage.getItem(cacheKey);
    return cached ? (JSON.parse(cached) as Record<string, unknown>) : null;
  } catch (error) {
    if (FEATURES.debugAnimations) {
      // eslint-disable-next-line no-console
      console.warn('[Lottie] Failed to read cache', error);
    }
    return null;
  }
};

const writeCache = (cacheKey: string | undefined, data: Record<string, unknown>) => {
  if (!cacheKey || typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(cacheKey, JSON.stringify(data));
  } catch (error) {
    if (FEATURES.debugAnimations) {
      // eslint-disable-next-line no-console
      console.warn('[Lottie] Failed to write cache', error);
    }
  }
};

export const useLottieJson = (
  url: string,
  { retries = 2, timeoutMs = 3000, cacheKey, fallbackData }: UseLottieJsonOptions = {},
): UseLottieJsonReturn => {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(!!url);
  const [isFromCache, setIsFromCache] = useState(false);

  const retriesRef = useRef(retries);

  useEffect(() => {
    let cancelled = false;

    if (typeof window === 'undefined') {
      if (fallbackData) {
        setData(fallbackData);
      }
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const cached = readCache(cacheKey);
    if (cached) {
      setData(cached);
      setIsFromCache(true);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    if (!url) {
      if (fallbackData) {
        setData(fallbackData);
      }
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    let timeoutHandle: number | undefined;

    const load = async () => {
      setLoading(true);
      setError(null);

      const attemptFetch = async (remaining: number): Promise<Record<string, unknown>> => {
        try {
          if (FEATURES.debugAnimations) {
            // eslint-disable-next-line no-console
            console.debug('[Lottie] Fetching animation', { url, remaining });
          }

          const response = await fetchWithTimeout(url, timeoutMs);

          if (!response.ok) {
            throw new Error(`Failed to load lottie asset: ${response.status}`);
          }

          const json = (await response.json()) as Record<string, unknown>;
          writeCache(cacheKey, json);
          return json;
        } catch (err) {
          if (remaining <= 0) {
            throw err;
          }

          const delay = 300 * Math.pow(2, retries - remaining);
          await new Promise<void>((resolve) => {
            timeoutHandle = window.setTimeout(resolve, delay);
          });

          return attemptFetch(remaining - 1);
        }
      };

      try {
        const json = await attemptFetch(retriesRef.current);
        if (!cancelled) {
          setData(json);
          setIsFromCache(false);
        }
      } catch (err) {
        if (FEATURES.debugAnimations) {
          // eslint-disable-next-line no-console
          console.error('[Lottie] Failed to load animation', err);
        }

        if (!cancelled) {
          if (fallbackData) {
            setData(fallbackData);
            setError(null);
          } else {
            setError(err as Error);
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    };
  }, [url, cacheKey, timeoutMs, fallbackData]);

  return { data, error, loading, isFromCache };
};

