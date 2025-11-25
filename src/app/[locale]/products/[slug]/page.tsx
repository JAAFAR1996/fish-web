import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { Button, Icon } from '@/components/ui';
import {
  InlineCalculator,
  ProductBreadcrumb,
  ProductMedia,
  ProductTabs,
  RelatedProducts,
  ProductInfo,
  SocialProofBadge,
} from '@/components/pdp';
import {
  getProductBySlug,
  getRelatedProducts,
  getComplementaryProducts,
} from '@/lib/data/products';
import {
  getProductReviews,
  getProductReviewSummary,
  getHelpfulVotesForUser,
  getReviewById,
  getUserReview,
} from '@/lib/reviews/review-queries';
import { getUser } from '@/lib/auth/utils';
import { formatCurrency, isOutOfStock } from '@/lib/utils';
import type { Locale, Product } from '@/types';
import { generateProductSchema, generateBreadcrumbSchema, generateReviewListSchema } from '@/lib/seo/product-schema';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://fishweb.iq';

interface PageParams {
  locale: Locale;
  slug: string;
}

interface ProductPageProps {
  params: PageParams;
  searchParams?: { tab?: string };
}

async function addToCartAction(product: Product) {
  'use server';
  console.log('Add to cart:', product.id);
}

async function saveCalculationAction(payload: unknown) {
  'use server';
  console.log('Save calculation payload:', payload);
}

export const revalidate = 3600; // 1 hour ISR

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { locale, slug } = params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be located.',
    };
  }

  const t = await getTranslations({ locale, namespace: 'pdp' });

  const title = t('titleTemplate', {
    productName: product.name,
    brand: product.brand,
  });
  const description = t('descriptionTemplate', {
    description: product.description,
  });

  const primaryImage = product.thumbnail ?? product.images?.[0] ?? '';
  const absoluteThumbnail = primaryImage?.startsWith('http')
    ? primaryImage
    : `${BASE_URL}${primaryImage}`;

  const canonicalUrl = `${BASE_URL}/${locale}/products/${product.slug}`;

  const openGraphImages = absoluteThumbnail
    ? [
        {
          url: absoluteThumbnail,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ]
    : undefined;

  const twitterImages = absoluteThumbnail
    ? [
        {
          url: absoluteThumbnail,
          alt: product.name,
        },
      ]
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: openGraphImages,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: twitterImages,
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ar: `/ar/products/${product.slug}`,
        en: `/en/products/${product.slug}`,
      },
    },
  };
}

export default async function ProductPage({
  params,
  searchParams,
}: ProductPageProps) {
  const { locale, slug } = params;
  setRequestLocale(locale);

  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const [
    relatedProducts,
    complementaryProducts,
    tPdp,
    reviews,
    reviewSummary,
    user,
  ] = await Promise.all([
    getRelatedProducts(product, 8),
    getComplementaryProducts(product, 4),
    getTranslations('pdp'),
    getProductReviews(product.id),
    getProductReviewSummary(product.id),
    getUser(),
  ]);

  let allReviews = reviews;

  if (user) {
    const ownReview = await getUserReview(user.id, product.id);
    if (ownReview && !reviews.some((review) => review.id === ownReview.id)) {
      const detailedReview = await getReviewById(ownReview.id);
      if (detailedReview) {
        allReviews = [detailedReview, ...reviews];
      }
    }
  }

  const userVotes = user
    ? await getHelpfulVotesForUser(
        user.id,
        allReviews.map((review) => review.id),
      )
    : {};

  const price = formatCurrency(product.price, locale);
  const outOfStock = isOutOfStock(product);

  const defaultTab = searchParams?.tab;
  const complementaryCategory =
    complementaryProducts[0]?.category ?? product.category;
  const reviewSchemas =
    allReviews.length > 0 ? generateReviewListSchema(allReviews, product) : [];

  const complementaryIds = new Set(complementaryProducts.map((p) => p.id));
  const combinedRecommendations = [...complementaryProducts, ...relatedProducts].filter(
    (product, index, self) => self.findIndex((p) => p.id === product.id) === index
  );

  const smartRecommendations = combinedRecommendations
    .map((p) => {
      const ratingScore = (p.rating ?? 0) * 10;
      const reviewScore = Math.min(p.reviewCount ?? 0, 500) / 20;
      const bestSellerBoost = p.isBestSeller ? 15 : 0;
      const complementaryBoost = complementaryIds.has(p.id) ? 10 : 0;
      const newBoost = p.isNew ? 3 : 0;
      return {
        product: p,
        score: ratingScore + reviewScore + bestSellerBoost + complementaryBoost + newBoost,
      };
    })
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.product);

  return (
    <div className="relative pb-28">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <ProductBreadcrumb product={product} className="mb-6" />

        <article className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">
          <ProductMedia
            images={product.images}
            productName={product.name}
            className="lg:sticky lg:top-24 lg:self-start"
          />

          <div className="space-y-6 lg:space-y-8">
            <ProductInfo 
              product={product} 
              averageRating={reviewSummary.totalReviews > 0 ? reviewSummary.averageRating : undefined}
              reviewCount={reviewSummary.totalReviews > 0 ? reviewSummary.totalReviews : undefined}
            />
            <SocialProofBadge product={product} />
          </div>
        </article>

        <div className="mt-12 space-y-12">
          <ProductTabs
            product={product}
            locale={locale}
            defaultTab={defaultTab}
            reviews={allReviews}
            reviewSummary={reviewSummary}
            userVotes={userVotes}
            complementaryProducts={complementaryProducts}
            relatedProducts={relatedProducts}
            smartRecommendations={smartRecommendations}
            onAddToCart={addToCartAction}
          />
          <InlineCalculator
            product={product}
            canSave={false}
            onSaveCalculation={saveCalculationAction}
          />
          {smartRecommendations.length > 0 && (
            <RelatedProducts
              products={smartRecommendations}
              category={product.category}
              title={tPdp('related.smart')}
              onAddToCart={addToCartAction}
            />
          )}
        </div>
      </div>

      <div className="sticky-cta-bar fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-4 shadow-lg lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">
              {product.name}
            </span>
            <span className="text-xl font-semibold text-foreground">
              {price}
            </span>
          </div>
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="flex-1"
            onClick={() => addToCartAction(product)}
            disabled={outOfStock}
          >
            <Icon name="cart" size="sm" />
            {tPdp('cta.addToCart')}
          </Button>
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generateProductSchema(product, reviewSummary, locale),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateBreadcrumbSchema(product, locale)),
        }}
      />
      {reviewSchemas.map((schema, index) => (
        <script
          // eslint-disable-next-line react/no-array-index-key
          key={`review-schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </div>
  );
}
