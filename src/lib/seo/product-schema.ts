import type { Locale, Product, ReviewSummary, ReviewWithUser } from '@/types';

const BASE_URL = 'https://fishweb.iq';

function resolveLocalePath(locale: Locale): string {
  return `${BASE_URL}/${locale}`;
}

function resolveProductUrl(locale: Locale, product: Product): string {
  return `${resolveLocalePath(locale)}/products/${product.slug}`;
}

function resolveCategoryUrl(locale: Locale, category: string): string {
  return `${resolveLocalePath(locale)}/products?category=${encodeURIComponent(category)}`;
}

export function generateProductSchema(
  product: Product,
  reviewSummary: ReviewSummary,
  locale: Locale,
) {
  const imageUrls = (product.images ?? [])
    .filter((url): url is string => Boolean(url) && typeof url === 'string');

  if (!imageUrls.length && product.thumbnail) {
    imageUrls.push(product.thumbnail);
  }

  const aggregateRating =
    reviewSummary?.totalReviews > 0
      ? {
          '@type': 'AggregateRating',
          ratingValue: reviewSummary.averageRating,
          reviewCount: reviewSummary.totalReviews,
        }
      : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: imageUrls,
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: product.brand,
    },
    category: product.category,
    offers: {
      '@type': 'Offer',
      price: product.price.toString(),
      priceCurrency: product.currency ?? 'IQD',
      availability:
        product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      url: resolveProductUrl(locale, product),
    },
    ...(aggregateRating ? { aggregateRating } : {}),
  };
}

export function generateBreadcrumbSchema(product: Product, locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: resolveLocalePath(locale),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Products',
        item: `${resolveLocalePath(locale)}/products`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.category,
        item: resolveCategoryUrl(locale, product.category),
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: product.name,
        item: resolveProductUrl(locale, product),
      },
    ],
  };
}

export function generateReviewListSchema(
  reviews: ReviewWithUser[],
  product: Product,
) {
  return reviews.map((review) => ({
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'Product',
      name: product.name,
    },
    author: {
      '@type': 'Person',
      name: review.user?.full_name ?? 'Anonymous',
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody: review.comment,
    datePublished: review.created_at,
  }));
}
