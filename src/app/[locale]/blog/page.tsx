import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

import { getAllBlogPosts, getBlogPostsByCategory, getBlogCategories } from '@/lib/blog/mdx-utils';
import { generateBlogListingMetadata } from '@/lib/blog/seo-utils';
import { BlogGrid, BlogCategories } from '@/components/blog';
import { Button, Icon } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { POSTS_PER_PAGE } from '@/lib/blog/constants';
import type { BlogListingProps, BlogCategory, Locale } from '@/types';

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams?: { category?: string };
}): Promise<Metadata> {
  const category = (searchParams?.category as BlogCategory) || null;
  return generateBlogListingMetadata(category, params.locale as Locale);
}

export default async function BlogPage({ params, searchParams }: BlogListingProps) {
  const { locale } = params;
  setRequestLocale(locale);

  const category = searchParams?.category as BlogCategory | undefined;
  const currentPage = parseInt(searchParams?.page ?? '1', 10);

  const [allPosts, categories] = await Promise.all([
    category ? getBlogPostsByCategory(category) : getAllBlogPosts(),
    getBlogCategories(),
  ]);

  const totalPages = Math.max(1, Math.ceil(allPosts.length / POSTS_PER_PAGE));
  const start = (currentPage - 1) * POSTS_PER_PAGE;
  const end = start + POSTS_PER_PAGE;
  const paginatedPosts = allPosts.slice(start, end);

  const t = await getTranslations('blog');

  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
          {t('pageTitle')}
        </h1>
        <p className="text-lg text-muted-foreground mb-4">{t('pageSubtitle')}</p>
        {category && (
          <p className="text-base text-muted-foreground">
            {t(`categories.${category}.description`)}
          </p>
        )}
      </header>

      <BlogCategories
        categories={categories}
        activeCategory={category || null}
        className="mb-8"
      />

      <BlogGrid posts={paginatedPosts} locale={locale as Locale} variant="grid" />

      {totalPages > 1 && (
        <nav
          className="flex items-center justify-center gap-4 mt-12"
          aria-label="Blog pagination"
        >
          {prevPage ? (
            <Button variant="outline" asChild>
              <Link
                href={category ? `/blog?category=${category}&page=${prevPage}` : `/blog?page=${prevPage}`}
              >
                <Icon name="chevron-left" className="h-4 w-4 me-2" />
                {t('pagination.previous')}
              </Link>
            </Button>
          ) : (
            <Button variant="outline" disabled>
              <Icon name="chevron-left" className="h-4 w-4 me-2" />
              {t('pagination.previous')}
            </Button>
          )}

          <span className="text-sm text-muted-foreground">
            {t('pagination.page')} {currentPage} {t('pagination.of')} {totalPages}
          </span>

          {nextPage ? (
            <Button variant="outline" asChild>
              <Link
                href={category ? `/blog?category=${category}&page=${nextPage}` : `/blog?page=${nextPage}`}
              >
                {t('pagination.next')}
                <Icon name="chevron-right" className="h-4 w-4 ms-2" />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" disabled>
              {t('pagination.next')}
              <Icon name="chevron-right" className="h-4 w-4 ms-2" />
            </Button>
          )}
        </nav>
      )}
    </main>
  );
}
