import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { Icon } from '@/components/ui';
import type { MDXComponents } from 'mdx/types';

export const mdxComponents: MDXComponents = {
  h1: ({ children, ...props }) => (
    <h1
      className="text-4xl font-bold text-foreground mt-8 mb-4 scroll-mt-20"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2
      className="text-3xl font-bold text-aqua-600 dark:text-aqua-400 mt-8 mb-4 scroll-mt-20"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3
      className="text-2xl font-semibold text-foreground mt-6 mb-3 scroll-mt-20"
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4
      className="text-xl font-semibold text-foreground mt-4 mb-2 scroll-mt-20"
      {...props}
    >
      {children}
    </h4>
  ),
  h5: ({ children, ...props }) => (
    <h5
      className="text-lg font-semibold text-foreground mt-4 mb-2 scroll-mt-20"
      {...props}
    >
      {children}
    </h5>
  ),
  h6: ({ children, ...props }) => (
    <h6
      className="text-base font-semibold text-foreground mt-4 mb-2 scroll-mt-20"
      {...props}
    >
      {children}
    </h6>
  ),
  a: ({ href, children, ...props }) => {
    const isInternal = href?.startsWith('/');
    const isExternal = href?.startsWith('http');

    // Filter out props that aren't compatible with Link component
    const { popover: _popover, ...linkCompatibleProps } = props as Record<string, unknown>;

    if (isInternal && href) {
      return (
        <Link
          href={href}
          className="text-aqua-500 hover:underline transition-colors"
          {...linkCompatibleProps}
        >
          {children}
        </Link>
      );
    }

    if (isExternal && href) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-aqua-500 hover:underline transition-colors inline-flex items-center gap-1"
          {...props}
        >
          {children}
          <Icon name="external-link" className="h-3 w-3 inline" />
        </a>
      );
    }

    return (
      <a
        href={href ?? '#'}
        className="text-aqua-500 hover:underline transition-colors"
        {...props}
      >
        {children}
      </a>
    );
  },
  img: ({ src, alt, width, height, ...props }) => (
    <figure className="my-6">
      <div className="relative rounded-lg overflow-hidden shadow-md">
        <Image
          src={src || ''}
          alt={alt || ''}
          width={typeof width === 'number' ? width : 1200}
          height={typeof height === 'number' ? height : 630}
          className="w-full h-auto"
          {...props}
        />
      </div>
      {alt && <figcaption className="text-sm text-muted-foreground text-center mt-2">{alt}</figcaption>}
    </figure>
  ),
  code: ({ children, ...props }) => (
    <code
      className="bg-muted text-foreground px-1.5 py-0.5 rounded text-sm font-mono"
      {...props}
    >
      {children}
    </code>
  ),
  pre: ({ children, ...props }) => (
    <pre
      className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg overflow-x-auto my-6 font-mono text-sm"
      {...props}
    >
      {children}
    </pre>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-s-4 border-aqua-500 bg-aqua-50 dark:bg-aqua-950/20 ps-4 py-2 my-6 italic text-base text-muted-foreground"
      {...props}
    >
      {children}
    </blockquote>
  ),
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto my-6">
      <table className="w-full border-collapse" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-muted" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }) => (
    <th
      className="px-4 py-2 text-start font-semibold border-b border-border"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="px-4 py-2 border-b border-border" {...props}>
      {children}
    </td>
  ),
  tr: ({ children, ...props }) => (
    <tr className="even:bg-muted/50" {...props}>
      {children}
    </tr>
  ),
  ul: ({ children, ...props }) => (
    <ul className="space-y-2 ps-6 my-4 list-disc marker:text-aqua-500" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="space-y-2 ps-6 my-4 list-decimal" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),
  p: ({ children, ...props }) => (
    <p className="my-4 leading-relaxed text-foreground" {...props}>
      {children}
    </p>
  ),
};
