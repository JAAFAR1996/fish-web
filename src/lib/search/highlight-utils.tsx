import { Fragment, type ReactNode } from 'react';

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function highlightSearchTerms(text: string, query: string): ReactNode {
  if (!text || !query) {
    return text;
  }

  const parts = getHighlightedParts(text, query);

  return parts.map((part, index) =>
    part.highlighted ? (
      <mark
        key={`highlight-${index}`}
        className="bg-aqua-100 dark:bg-aqua-900/30 text-foreground font-medium rounded px-0.5"
      >
        {part.text}
      </mark>
    ) : (
      <Fragment key={`text-${index}`}>{part.text}</Fragment>
    )
  );
}

export function highlightText(text: string, query: string): string {
  return getHighlightedParts(text, query)
    .map((part) =>
      part.highlighted
        ? `<mark class="bg-aqua-100 dark:bg-aqua-900/30 text-foreground font-medium rounded px-0.5">${part.text}</mark>`
        : part.text
    )
    .join('');
}

export function getHighlightedParts(
  text: string,
  query: string
): { text: string; highlighted: boolean }[] {
  if (!text || !query) {
    return [{ text, highlighted: false }];
  }

  const terms = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(escapeRegex);

  if (!terms.length) {
    return [{ text, highlighted: false }];
  }

  const regex = new RegExp(`(${terms.join('|')})`, 'gi');
  const rawParts = text.split(regex);

  const parts: { text: string; highlighted: boolean }[] = [];

  rawParts.forEach((part, index) => {
    if (!part) {
      return;
    }

    const highlighted = index % 2 === 1;
    parts.push({ text: part, highlighted });
  });

  return parts.length ? parts : [{ text, highlighted: false }];
}
