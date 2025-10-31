'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { useRouter } from '@/i18n/navigation';
import type { AutocompleteSuggestion } from '@/types';
import { Button, Icon, Input } from '@/components/ui';
import {
  SearchAutocomplete,
  VoiceSearchModal,
} from '@/components/search';
import { cn } from '@/lib/utils';
import {
  getAutocompleteSuggestions,
  getSuggestionHref,
} from '@/lib/search/autocomplete-utils';
import { SEARCH_DEBOUNCE, MIN_SEARCH_LENGTH } from '@/lib/search/constants';
import { saveRecentSearch } from '@/lib/search/recent-searches';
import { isVoiceSearchSupported } from '@/lib/search/voice-search';

type SearchBarProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};

export function SearchBar({ className, size = 'md' }: SearchBarProps) {
  const t = useTranslations('nav');
  const tSearchActions = useTranslations('search.actions');
  const router = useRouter();
  const locale = useLocale();
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const isModifier = event.ctrlKey || event.metaKey;
      if (!isModifier || event.key.toLowerCase() !== 'k') {
        return;
      }

      event.preventDefault();
      inputRef.current?.focus();
    };

    window.addEventListener('keydown', handler);

    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, []);

  useEffect(() => {
    setVoiceSupported(isVoiceSearchSupported());
  }, []);

  useEffect(() => {
    const query = value.trim();
    if (query.length < MIN_SEARCH_LENGTH) {
      setSuggestions([]);
      setIsAutocompleteOpen(false);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    setIsLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&locale=${locale}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const body = (await response.json()) as {
          suggestions?: AutocompleteSuggestion[];
        };

        if (!cancelled) {
          const results = body.suggestions ?? [];
          setSuggestions(results);
          setIsAutocompleteOpen(true);
        }
      } catch (error) {
        if (controller.signal.aborted || cancelled) {
          return;
        }

        if (process.env.NODE_ENV !== 'production') {
          console.error('[SearchBar] autocomplete error', error);
        }

        try {
          const fallback = await getAutocompleteSuggestions(query);
          if (!cancelled) {
            setSuggestions(fallback);
            setIsAutocompleteOpen(true);
          }
        } catch (fallbackError) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('[SearchBar] fallback autocomplete error', fallbackError);
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }, SEARCH_DEBOUNCE);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [locale, value]);

  const focusAutocomplete = useCallback(() => {
    if (value.trim().length >= MIN_SEARCH_LENGTH) {
      setIsAutocompleteOpen(true);
    }
  }, [value]);

  const handleSearch = useCallback(
    (override?: string) => {
      const query = (override ?? value).trim();
      if (query.length < MIN_SEARCH_LENGTH) {
        return;
      }

      saveRecentSearch(query);
      setIsAutocompleteOpen(false);
      router.push({
        pathname: '/search',
        locale,
        query: { q: query },
      });
    },
    [locale, router, value]
  );

  const handleSuggestionSelect = useCallback(
    (suggestion: AutocompleteSuggestion) => {
      setIsAutocompleteOpen(false);
      if (suggestion.type !== 'product') {
        saveRecentSearch(suggestion.label);
      } else if (suggestion.product) {
        saveRecentSearch(suggestion.product.name);
      }

      const href = getSuggestionHref(suggestion, locale);
      router.push(href);
    },
    [locale, router]
  );

  const handleVoiceResult = useCallback(
    (transcript: string) => {
      const normalized = transcript.trim();
      if (!normalized) {
        return;
      }

      setValue(normalized);
      handleSearch(normalized);
    },
    [handleSearch]
  );

  const trailingContent = useMemo(() => {
    if (isLoading) {
      return <Icon name="loader" className="animate-spin" size="sm" aria-hidden="true" />;
    }

    return (
      <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
        <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px] font-medium">
          ⌘
        </kbd>
        <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px] font-medium">
          K
        </kbd>
      </span>
    );
  }, [isLoading]);

  return (
    <div className={cn('relative w-full', className)}>
      <Input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={t('searchPlaceholder')}
        aria-label={t('search')}
        aria-keyshortcuts="Control+K Meta+K"
        size={size}
        leadingIcon={<Icon name="search" size="sm" aria-hidden="true" />}
        trailingIcon={trailingContent}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            handleSearch();
          }
          if (event.key === 'Escape') {
            setIsAutocompleteOpen(false);
          }
        }}
        onFocus={focusAutocomplete}
        className={cn(
          'w-full max-w-full',
          size === 'sm' && 'text-sm',
          size === 'md' && 'text-base',
          size === 'lg' && 'text-lg'
        )}
      />

      {voiceSupported && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute end-2 top-1/2 hidden -translate-y-1/2 items-center text-muted-foreground hover:text-foreground sm:inline-flex"
          onClick={() => {
            setIsVoiceModalOpen(true);
            setIsAutocompleteOpen(false);
          }}
          aria-label={tSearchActions('voiceSearch')}
        >
          <Icon name="mic" size="sm" />
        </Button>
      )}

      <SearchAutocomplete
        suggestions={suggestions}
        query={value}
        isOpen={isAutocompleteOpen}
        onClose={() => setIsAutocompleteOpen(false)}
        onSelect={handleSuggestionSelect}
        inputRef={inputRef}
      />

      {voiceSupported && (
        <VoiceSearchModal
          isOpen={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          onResult={handleVoiceResult}
        />
      )}
    </div>
  );
}
