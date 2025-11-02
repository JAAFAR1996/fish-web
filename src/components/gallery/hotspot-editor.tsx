"use client";

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { AutocompleteSuggestion, Hotspot } from '@/types';
import { Button, Card, Input } from '@/components/ui';
import { calculateHotspotCoordinates, createHotspot } from '@/lib/gallery/hotspot-utils';
import { HotspotMarker } from './hotspot-marker';
import { SearchAutocomplete } from '@/components/search/search-autocomplete';

const SEARCH_DEBOUNCE = 250;
const MIN_SEARCH_LENGTH = 2;

interface WindowWithPendingCoords extends Window {
  __pending_hotspot_coords?: { x: number; y: number };
}

declare const window: WindowWithPendingCoords;

interface HotspotEditorProps {
  imageUrl: string;
  hotspots: Hotspot[];
  onChange: (hotspots: Hotspot[]) => void;
  className?: string;
}

export function HotspotEditor({ imageUrl, hotspots, onChange, className }: HotspotEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < MIN_SEARCH_LENGTH) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmedQuery)}&locale=en`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const body = await response.json();

        if (!cancelled) {
          setSuggestions(body.suggestions ?? []);
        }
      } catch (error) {
        if (controller.signal.aborted || cancelled) {
          return;
        }

        if (process.env.NODE_ENV !== 'production') {
          console.error('[HotspotEditor] search error', error);
        }

        if (!cancelled) {
          setSuggestions([]);
        }
      }
    }, SEARCH_DEBOUNCE);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isAdding || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const { x, y } = calculateHotspotCoordinates(e.clientX, e.clientY, rect);
      // Open product search autocomplete anchored to input
      setIsSearchOpen(true);
      setQuery('');
      window.__pending_hotspot_coords = { x, y };
      setTimeout(() => inputRef.current?.focus(), 0);
    },
    [hotspots, isAdding, onChange]
  );

  return (
    <Card className={className}>
      <div
        ref={containerRef}
        className={`relative aspect-video ${isAdding ? 'hotspot-editor-active' : ''} overflow-hidden rounded-lg border border-border bg-muted`}
        onClick={handleClick}
      >
        <Image src={imageUrl} alt="Editor" fill className="object-cover" />
        {hotspots.map((h, idx) => (
          <HotspotMarker key={h.id} hotspot={h} index={idx} />
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <Button type="button" variant={isAdding ? 'primary' : 'outline'} onClick={() => setIsAdding((v) => !v)}>
          {isAdding ? 'Click the image to tag a product' : 'Add hotspot'}
        </Button>
        {hotspots.length > 0 && (
          <Button type="button" variant="outline" onClick={() => onChange(hotspots.slice(0, -1))}>
            Remove last
          </Button>
        )}
      </div>

      {isSearchOpen && (
        <div className="relative mt-4">
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
          />
          <SearchAutocomplete
            suggestions={suggestions}
            query={query}
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            onSelect={(sugg) => {
              if (sugg.type === 'product' && sugg.product) {
                const coords = window.__pending_hotspot_coords;
                if (coords) {
                  const newHotspot = createHotspot(coords.x, coords.y, sugg.product.id);
                  onChange([...hotspots, newHotspot]);
                  window.__pending_hotspot_coords = undefined;
                }
                setIsSearchOpen(false);
                setQuery('');
                setSuggestions([]);
              }
            }}
            inputRef={inputRef}
          />
        </div>
      )}
    </Card>
  );
}
