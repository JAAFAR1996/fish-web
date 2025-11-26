'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';

import type { AutocompleteSuggestion, Locale } from '@/types';
import { Badge, Icon } from '@/components/ui';
import { cn, formatCurrency } from '@/lib/utils';

type TranslateFn = ReturnType<typeof useTranslations>;

export interface SearchAutocompleteProps {
  suggestions: AutocompleteSuggestion[];
  query: string; // eslint-disable-line @typescript-eslint/no-unused-vars
  isOpen: boolean;
  onClose: () => void;
  onSelect: (suggestion: AutocompleteSuggestion) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  className?: string;
}

const SECTION_ORDER: Array<AutocompleteSuggestion['type']> = [
  'product',
  'category',
  'brand',
  'article',
];

export function SearchAutocomplete({
  suggestions,
  query,
  isOpen,
  onClose,
  onSelect,
  inputRef,
  className,
}: SearchAutocompleteProps) {
  const autocompleteRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [style, setStyle] = useState<CSSProperties>();
  const locale = useLocale() as Locale;
  const t = useTranslations('search.autocomplete');
  const tActions = useTranslations('search.actions');

  const groups = useMemo(() => {
    return SECTION_ORDER.map((type) => ({
      type,
      items: suggestions.filter((suggestion) => suggestion.type === type),
    })).filter((group) => group.items.length > 0);
  }, [suggestions]);

  useEffect(() => {
    setActiveIndex(0);
    itemRefs.current = [];
  }, [suggestions]);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') {
      return;
    }

    const updatePosition = () => {
      const input = inputRef.current;
      if (!input) {
        return;
      }

      const rect = input.getBoundingClientRect();
      setStyle({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    };

    updatePosition();

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [inputRef, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !autocompleteRef.current?.contains(target) &&
        !inputRef.current?.contains(target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, inputRef]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input || !isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!suggestions.length) {
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((prev) => (prev + 1) % suggestions.length);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((prev) =>
          prev === 0 ? suggestions.length - 1 : prev - 1
        );
      } else if (event.key === 'Enter') {
        if (suggestions[activeIndex]) {
          event.preventDefault();
          onSelect(suggestions[activeIndex]);
        }
      } else if (event.key === 'Escape') {
        onClose();
      }
    };

    input.addEventListener('keydown', handleKeyDown);

    return () => {
      input.removeEventListener('keydown', handleKeyDown);
    };
  }, [inputRef, isOpen, suggestions, activeIndex, onSelect, onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const node = itemRefs.current[activeIndex];
    if (node) {
      node.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex, isOpen]);

  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  const renderContent = () => {
    if (!suggestions.length) {
      return (
        <div className="flex flex-col items-center justify-center px-6 py-8 text-center text-sm text-muted-foreground">
          <Icon name="search" size="lg" className="mb-3 text-muted-foreground/60" />
          <p className="font-medium">{t('noResults')}</p>
          <p className="mt-1 text-xs">{tActions('search')}</p>
        </div>
      );
    }

    let itemIndex = -1;

    return groups.map((group, groupIndex) => (
      <div key={group.type} role="group" aria-label={group.type}>
        <div className="bg-muted px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {group.type === 'product' && t('products')}
          {group.type === 'category' && t('categories')}
          {group.type === 'brand' && t('brands')}
          {group.type === 'article' && t('articles')}
        </div>
        <ul role="listbox" className="divide-y divide-border/50">
          {group.items.map((suggestion) => {
            itemIndex += 1;
            const isActive = itemIndex === activeIndex;

            return (
              <li
                key={`${group.type}-${suggestion.value}`}
                role="option"
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                ref={(node) => {
                  itemRefs.current[itemIndex] = node;
                }}
                className={cn(
                  'flex cursor-pointer items-center gap-3 px-3 py-3 text-sm transition-colors',
                  isActive ? 'bg-muted/80' : 'hover:bg-muted/60 focus:bg-muted/60'
                )}
                onMouseEnter={() => setActiveIndex(itemIndex)}
                onClick={() => onSelect(suggestion)}
              >
                {renderSuggestionContent(suggestion, locale, t)}
              </li>
            );
          })}
        </ul>
        {groupIndex < groups.length - 1 && (
          <div className="h-px bg-border/60" />
        )}
      </div>
    ));
  };

  const node = (
    <div
      ref={autocompleteRef}
      className={cn(
        'animate-autocomplete-slide-in fixed z-50 max-h-[420px] overflow-y-auto rounded-xl border border-border bg-background shadow-xl',
        className
      )}
      style={style}
    >
      {renderContent()}
    </div>
  );

  return createPortal(node, document.body);
}

function renderSuggestionContent(
  suggestion: AutocompleteSuggestion,
  locale: Locale,
  t: TranslateFn
) {
  if (suggestion.type === 'product' && suggestion.product) {
    const { product } = suggestion;

    return (
      <>
        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border border-border/60 bg-muted">
          {product.thumbnail ? (
            <Image
              src={product.thumbnail}
              alt={product.name}
              fill
              sizes="40px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Icon name="package" size="sm" aria-hidden />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">{product.name}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            {product.category && (
              <Badge variant="outline" size="sm" className="truncate">
                {product.category}
              </Badge>
            )}
            <span>{formatCurrency(product.price, locale)}</span>
          </div>
        </div>
        <Icon name="arrow-right" className="text-muted-foreground" size="sm" flipRtl />
      </>
    );
  }

  if (suggestion.type === 'brand') {
    return (
      <>
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted">
          <Icon name="tag" size="sm" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground">{suggestion.label}</p>
          {suggestion.count !== null && (
            <p className="text-xs text-muted-foreground">
              {suggestion.count}
              {' '}
              {t('products')}
            </p>
          )}
        </div>
        <Icon name="search" className="text-muted-foreground" size="sm" />
      </>
    );
  }

  if (suggestion.type === 'article') {
    return (
      <>
        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border border-border/60 bg-muted">
          {suggestion.thumbnail ? (
            <Image
              src={suggestion.thumbnail}
              alt={suggestion.label}
              fill
              sizes="40px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Icon name="book" size="sm" aria-hidden />
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground line-clamp-2">{suggestion.label}</p>
          {suggestion.readingTime ? (
            <p className="text-xs text-muted-foreground">
              {suggestion.readingTime}
              {' '}
              {t('minutes')}
            </p>
          ) : null}
        </div>
        <Icon name="arrow-right" className="text-muted-foreground" size="sm" flipRtl />
      </>
    );
  }

  return (
    <>
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted">
        <Icon name="list" size="sm" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-foreground">{suggestion.label}</p>
        {suggestion.count !== null && (
          <p className="text-xs text-muted-foreground">
            {suggestion.count}
            {' '}
            {t('products')}
          </p>
        )}
      </div>
      <Icon name="arrow-right" className="text-muted-foreground" size="sm" flipRtl />
    </>
  );
}
