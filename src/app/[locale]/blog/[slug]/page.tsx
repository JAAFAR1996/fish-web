import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import Image from 'next/image';
import { MDXRemote } from 'next-mdx-remote/rsc';

import { getBlogPostBySlug, getAllBlogPosts, getRelatedPosts } from '@/lib/blog/mdx-utils';
import { generateBlogPostMetadata, generateBlogStructuredData } from '@/lib/blog/seo-utils';
import { getProducts } from '@/lib/data/products';
import { BlogPostHeader, mdxComponents, RelatedPostsSection } from '@/components/blog';
import { RelatedProducts } from '@/components/pdp';
import type { BlogPostProps, Locale } from '@/types';

export const revalidate = 3600;

export async function generateStaticParams() {
  const posts = await getAllBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug);
  
  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The requested blog post could not be found.',
    };
  }

  return generateBlogPostMetadata(post, params.locale as Locale);
}

export default async function BlogPostPage({ params }: BlogPostProps) {
  const { locale, slug } = params;
  setRequestLocale(locale);

  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const [relatedPosts, allProducts] = await Promise.all([
    getRelatedPosts(post, 3),
    getProducts(),
  ]);

  const relatedProducts = post.relatedProducts.length > 0
    ? allProducts.filter((p) => post.relatedProducts.includes(p.id))
    : [];

  const structuredData = generateBlogStructuredData(post);

  return (
    <article className="pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BlogPostHeader post={post} locale={locale as Locale} className="mb-8" />

        <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg mb-12">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-3xl mx-auto">
          <MDXRemote source={post.content} components={mdxComponents} />
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <RelatedProducts
            products={relatedProducts}
            category={post.category}
            title="Related Products"
            onAddToCart={async () => {}}
            wishlistIds={[]}
            onWishlistToggle={async () => {}}
          />
        </div>
      )}

      {relatedPosts.length > 0 && (
        <RelatedPostsSection
          posts={relatedPosts}
          currentPost={post}
          locale={locale as Locale}
          className="mt-12"
        />
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
    </article>
  );
}
