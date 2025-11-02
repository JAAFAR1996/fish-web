import type { Metadata } from 'next';
import type { BlogPost, BlogCategory, Locale } from '@/types';

export function generateBlogPostMetadata(post: BlogPost, locale: Locale): Metadata {
  const title = post.seo.title || `${post.title} | FISH WEB Blog`;
  const description = post.seo.description || post.excerpt;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      images: [post.coverImage],
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? undefined,
      authors: [post.author.name],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [post.coverImage],
    },
    alternates: {
      languages: {
        ar: `/ar/blog/${post.slug}`,
        en: `/en/blog/${post.slug}`,
      },
      canonical: `/${locale}/blog/${post.slug}`,
    },
  };
}

export function generateBlogListingMetadata(category: BlogCategory | null, locale: Locale): Metadata {
  if (category) {
    const title = `${category} Articles | FISH WEB Blog`;
    const description = `Browse all ${category} articles on FISH WEB`;
    
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
      },
      alternates: {
        languages: {
          ar: `/ar/blog?category=${category}`,
          en: `/en/blog?category=${category}`,
        },
        canonical: `/${locale}/blog${category ? `?category=${category}` : ''}`,
      },
    };
  }

  return {
    title: 'Blog | FISH WEB',
    description: 'Your complete guide to the aquarium world - tips, guides, and educational articles',
    openGraph: {
      title: 'Blog | FISH WEB',
      description: 'Your complete guide to the aquarium world - tips, guides, and educational articles',
      type: 'website',
    },
    alternates: {
      languages: {
        ar: '/ar/blog',
        en: '/en/blog',
      },
      canonical: `/${locale}/blog`,
    },
  };
}

export function generateBlogStructuredData(post: BlogPost): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    image: post.coverImage,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: {
      '@type': 'Person',
      name: post.author.name,
      image: post.author.avatar,
    },
    publisher: {
      '@type': 'Organization',
      name: 'FISH WEB',
      logo: {
        '@type': 'ImageObject',
        url: '/logo.png',
      },
    },
    description: post.excerpt,
    articleBody: post.excerpt,
    keywords: post.tags.join(', '),
  };
}

export function generateBlogBreadcrumbStructuredData(post: BlogPost, locale: Locale): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `/${locale}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `/${locale}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.category,
        item: `/${locale}/blog?category=${post.category}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: post.title,
        item: `/${locale}/blog/${post.slug}`,
      },
    ],
  };
}
