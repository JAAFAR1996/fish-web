import { getTranslations } from 'next-intl/server';

import {
  Icon,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import type {
  HelpfulVote,
  Locale,
  Product,
  ReviewSummary as ReviewSummaryType,
  ReviewWithUser,
} from '@/types';

import { FaqSection } from './faq-section';
import { SpecificationsTable } from './specifications-table';
import { UsageGuideSection } from './usage-guide-section';
import { ReviewsTabContent } from './reviews-tab-content';
import { ProductQA } from './product-qa';
import { RelatedProducts } from './related-products';

export interface ProductTabsProps {
  product: Product;
  locale: Locale;
  defaultTab?: string;
  reviews: ReviewWithUser[];
  reviewSummary: ReviewSummaryType;
  userVotes: Record<string, HelpfulVote>;
  complementaryProducts?: Product[];
  relatedProducts?: Product[];
  smartRecommendations?: Product[];
  onAddToCart?: (product: Product) => Promise<void> | void;
  className?: string;
}

const TAB_DEFINITIONS = [
  { value: 'description', icon: 'file-text' as const, labelKey: 'description' },
  { value: 'specifications', icon: 'list' as const, labelKey: 'specifications' },
  { value: 'usageGuide', icon: 'book' as const, labelKey: 'usageGuide' },
  { value: 'reviews', icon: 'star' as const, labelKey: 'reviews' },
  { value: 'qa', icon: 'help' as const, labelKey: 'qa' },
  { value: 'faq', icon: 'help' as const, labelKey: 'faq' },
  { value: 'bundles', icon: 'package-search' as const, labelKey: 'bundles' },
];

function ensureValidTab(tab?: string) {
  const values = TAB_DEFINITIONS.map((definition) => definition.value);
  return values.includes(tab ?? '') ? tab : 'description';
}

export async function ProductTabs({
  product,
  locale,
  defaultTab,
  reviews,
  reviewSummary,
  userVotes,
  complementaryProducts = [],
  relatedProducts = [],
  smartRecommendations = [],
  onAddToCart,
  className,
}: ProductTabsProps) {
  const tTabs = await getTranslations('pdp.tabs');

  const sanitizedDefaultTab = ensureValidTab(defaultTab);
  const descriptionParagraphs = product.description
    .split('\n')
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <section className={cn('space-y-6', className)}>
      <Tabs
        defaultValue={sanitizedDefaultTab}
        className="w-full"
      >
        <TabsList className="relative flex w-full gap-2 overflow-x-auto rounded-lg border border-border bg-muted/40 p-1 sm:justify-start">
          {TAB_DEFINITIONS.map(({ value, icon, labelKey }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex min-w-[120px] items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              <Icon name={icon} size="sm" className="text-muted-foreground" />
              <span>{tTabs(labelKey)}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent
          value="description"
          className="rounded-lg border border-border bg-card p-6 shadow-sm"
        >
          <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
            {descriptionParagraphs.length > 0 ? (
              descriptionParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))
            ) : (
              <p>{product.description}</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="specifications">
          <SpecificationsTable product={product} locale={locale} />
        </TabsContent>

        <TabsContent
          value="usageGuide"
          className="rounded-lg border border-border bg-card p-6 shadow-sm"
        >
          <UsageGuideSection product={product} locale={locale} />
        </TabsContent>

        <TabsContent
          value="reviews"
          className="rounded-lg border border-border bg-card p-6 shadow-sm"
        >
          <ReviewsTabContent
            productId={product.id}
            productSlug={product.slug}
            productName={product.name}
            reviews={reviews}
            reviewSummary={reviewSummary}
            userVotes={userVotes}
            locale={locale}
          />
        </TabsContent>

        <TabsContent
          value="qa"
          className="rounded-lg border border-border bg-card p-6 shadow-sm"
        >
          <ProductQA />
        </TabsContent>

        <TabsContent
          value="bundles"
          className="rounded-lg border border-border bg-card p-6 shadow-sm"
        >
          <div className="space-y-8">
            {smartRecommendations.length > 0 ? (
              <RelatedProducts
                products={smartRecommendations}
                category={product.category}
                title={tTabs('bundlesSmart')}
                onAddToCart={onAddToCart ?? (() => {})}
              />
            ) : (
              <>
                {complementaryProducts.length > 0 && (
                  <RelatedProducts
                    products={complementaryProducts}
                    category={product.category}
                    title={tTabs('bundlesFrequentlyBought')}
                    onAddToCart={onAddToCart ?? (() => {})}
                  />
                )}
                {relatedProducts.length > 0 && (
                  <RelatedProducts
                    products={relatedProducts}
                    category={product.category}
                    title={tTabs('bundlesSimilar')}
                    onAddToCart={onAddToCart ?? (() => {})}
                  />
                )}
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent
          value="faq"
          className="rounded-lg border border-border bg-card p-6 shadow-sm"
        >
          <FaqSection product={product} />
        </TabsContent>
      </Tabs>
    </section>
  );
}
