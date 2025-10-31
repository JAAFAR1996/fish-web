import { MAX_RECENT_SEARCHES, RECENT_SEARCHES_KEY } from './constants';

const isBrowser = typeof window !== 'undefined';

export function getRecentSearches(): string[] {
  if (!isBrowser) {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((value): value is string => typeof value === 'string');
  } catch {
    return [];
  }
}

export function saveRecentSearch(query: string): void {
  if (!isBrowser) {
    return;
  }

  const normalized = query.trim().toLowerCase();
  if (normalized.length < 2) {
    return;
  }

  const current = getRecentSearches();
  const updated = [normalized, ...current.filter((entry) => entry !== normalized)].slice(
    0,
    MAX_RECENT_SEARCHES
  );

  try {
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Fail silently if storage is unavailable or quota exceeded.
  }
}

export function clearRecentSearches(): void {
  if (!isBrowser) {
    return;
  }

  try {
    window.localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Ignore storage errors.
  }
}
