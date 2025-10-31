import type { Locale } from '@/types';

export function formatPublishDate(dateString: string, locale: Locale): string {
  const date = new Date(dateString);
  
  if (locale === 'ar') {
    return new Intl.DateTimeFormat('ar-IQ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatRelativeDate(dateString: string, locale: Locale): string {
  const date = new Date(dateString);
  const now = Date.now();
  const diff = now - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days < 1) {
    return locale === 'ar' ? 'اليوم' : 'Today';
  }

  if (days < 7) {
    return locale === 'ar' ? `منذ ${days} أيام` : `${days} days ago`;
  }

  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return locale === 'ar' ? `منذ ${weeks} أسابيع` : `${weeks} weeks ago`;
  }

  return formatPublishDate(dateString, locale);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function stripMDX(content: string): string {
  return content
    .replace(/^#{1,6}\s+.*$/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_~]/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\n+/g, ' ')
    .trim();
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > 0) {
    return truncated.slice(0, lastSpace) + '...';
  }

  return truncated + '...';
}
