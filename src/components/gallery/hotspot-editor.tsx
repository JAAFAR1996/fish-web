"use client";

import Image from 'next/image';
import { useCallback, useMemo, useRef, useState } from 'react';

import type { Hotspot } from '@/types';
import { Button, Card, Input } from '@/components/ui';
import { calculateHotspotCoordinates, createHotspot } from '@/lib/gallery/hotspot-utils';
import { HotspotMarker } from './hotspot-marker';
import { SearchAutocomplete } from '@/components/search/search-autocomplete';

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
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isAdding || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const { x, y } = calculateHotspotCoordinates(e.clientX, e.clientY, rect);
      // Open product search autocomplete anchored to input
      setIsSearchOpen(true);
      setQuery('');
      (window as any).__pending_hotspot_coords = { x, y };
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
            onChange={async (e) => {
              const q = e.target.value;
              setQuery(q);
              if (q.trim().length >= 2) {
                try {
                  const response = await fetch(`/api/search?q=${encodeURIComponent(q)}&locale=en`);
                  if (response.ok) {
                    const data = await response.json();
                    setSuggestions(data.suggestions || []);
                  } else {
                    setSuggestions([]);
                  }
                } catch (error) {
                  console.error('Failed to fetch suggestions:', error);
                  setSuggestions([]);
                }
              } else {
                setSuggestions([]);
              }
            }}
            placeholder="Search products..."
          />
          <SearchAutocomplete
            suggestions={suggestions as any}
            query={query}
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            onSelect={(sugg) => {
              if (sugg.type === 'product' && sugg.product) {
                const coords = (window as any).__pending_hotspot_coords as { x: number; y: number } | undefined;
                if (coords) {
                  const newHotspot = createHotspot(coords.x, coords.y, sugg.product.id);
                  onChange([...hotspots, newHotspot]);
                  (window as any).__pending_hotspot_coords = undefined;
                }
                setIsSearchOpen(false);
                setQuery('');
                setSuggestions([]);
              }
            }}
            inputRef={inputRef as any}
          />
        </div>
      )}
    </Card>
  );
}
