import type { Hotspot, Product } from '@/types';
import { MAX_HOTSPOTS_PER_IMAGE } from './constants';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function calculateHotspotCoordinates(
  clickX: number,
  clickY: number,
  rect: { left: number; top: number; width: number; height: number }
): { x: number; y: number } {
  const x = ((clickX - rect.left) / rect.width) * 100;
  const y = ((clickY - rect.top) / rect.height) * 100;
  return { x: clamp(x, 0, 100), y: clamp(y, 0, 100) };
}

export function createHotspot(
  x: number,
  y: number,
  productId: string,
  label?: string
): Hotspot {
  return {
    id: (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    x: clamp(x, 0, 100),
    y: clamp(y, 0, 100),
    product_id: productId,
    label: label ?? null,
  };
}

export function updateHotspot(hotspots: Hotspot[], id: string, partial: Partial<Hotspot>): Hotspot[] {
  return hotspots.map((h) => (h.id === id ? { ...h, ...partial } : h));
}

export function removeHotspot(hotspots: Hotspot[], id: string): Hotspot[] {
  return hotspots.filter((h) => h.id !== id);
}

export function validateHotspotCoordinates(x: number, y: number): boolean {
  return x >= 0 && x <= 100 && y >= 0 && y <= 100;
}

export function canAddHotspot(hotspots: Hotspot[]): boolean {
  return hotspots.length < MAX_HOTSPOTS_PER_IMAGE;
}

export function getHotspotProducts(hotspots: Hotspot[], products: Product[]): Product[] {
  const ids = Array.from(new Set(hotspots.map((h) => h.product_id)));
  return products.filter((p) => ids.includes(p.id));
}

export function sortHotspotsByPosition(hotspots: Hotspot[]): Hotspot[] {
  return [...hotspots].sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));
}
