import type { MetadataRoute } from 'next';
import { CATEGORIES } from '@/components/layout/navigation-data';
import productsData from '@/data/products.json';
import { getAllBlogPosts } from '@/lib/blog/mdx-utils';
import type { GallerySetupWithUser, Product } from '@/types';

async function getProductsForSitemap(): Promise<Product[]> {
  try {
    const { getProducts } = await import('@/lib/data/products');
    return await getProducts();
  } catch (error) {
    console.warn('[sitemap] Using static products fallback for sitemap generation', error);
    return JSON.parse(JSON.stringify(productsData)) as Product[];
  }
}

async function getGallerySetupsForSitemap(): Promise<GallerySetupWithUser[]> {
  try {
    const { getGallerySetups } = await import('@/lib/gallery/gallery-queries');
    return await getGallerySetups({ isApproved: true });
  } catch (error) {
    console.warn('[sitemap] Skipping gallery entries in sitemap (database unavailable)', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://fishweb.iq';

  const [products, posts, gallerySetups] = await Promise.all([
    getProductsForSitemap(),
    getAllBlogPosts(),
    getGallerySetupsForSitemap(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/gallery`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/calculators`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt || post.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const galleryPages: MetadataRoute.Sitemap = gallerySetups.map((setup) => ({
    url: `${baseUrl}/gallery/${setup.id}`,
    lastModified: setup.updated_at ? new Date(setup.updated_at) : new Date(setup.created_at),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const categoryPages: MetadataRoute.Sitemap = CATEGORIES.map((category) => ({
    url: `${baseUrl}/products?category=${category.key}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    ...staticPages,
    ...categoryPages,
    ...productPages,
    ...blogPages,
    ...galleryPages,
  ];
}
