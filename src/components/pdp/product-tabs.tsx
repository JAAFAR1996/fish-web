import { getTranslations } from 'next-intl/server';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Icon,
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

const SECTION_DEFINITIONS = [
  { value: 'description', icon: 'file-text' as const, labelKey: 'description' },
  { value: 'specifications', icon: 'list' as const, labelKey: 'specifications' },
  { value: 'usageGuide', icon: 'book' as const, labelKey: 'usageGuide' },
  { value: 'reviews', icon: 'star' as const, labelKey: 'reviews' },
  { value: 'qa', icon: 'help' as const, labelKey: 'qa' },
  { value: 'faq', icon: 'help' as const, labelKey: 'faq' },
  { value: 'bundles', icon: 'package-search' as const, labelKey: 'bundles' },
];

function ensureValidSection(section?: string): string {
  const values = SECTION_DEFINITIONS.map((definition) => definition.value);
  const normalized = section ?? '';
  return values.includes(normalized) ? normalized : 'description';
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

  const sanitizedDefaultSection = ensureValidSection(defaultTab);
  const descriptionParagraphs = product.description
    .split('\n')
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <section className={cn('space-y-6', className)}>
      <Accordion
        type="multiple"
        defaultValue={[sanitizedDefaultSection]}
        className="space-y-3"
      >
        <AccordionItem value="description" className="rounded-lg border border-border bg-card shadow-sm">
          <AccordionTrigger className="px-4 py-3 text-start text-base font-semibold">
            <div className="flex items-center gap-2">
              <Icon name="file-text" size="sm" className="text-muted-foreground" />
              {tTabs('description')}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
              {descriptionParagraphs.length > 0 ? (
                descriptionParagraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))
              ) : (
                <p>{product.description}</p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="specifications" className="rounded-lg border border-border bg-card shadow-sm">
          <AccordionTrigger className="px-4 py-3 text-start text-base font-semibold">
            <div className="flex items-center gap-2">
              <Icon name="list" size="sm" className="text-muted-foreground" />
              {tTabs('specifications')}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <SpecificationsTable product={product} locale={locale} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="usageGuide" className="rounded-lg border border-border bg-card shadow-sm">
          <AccordionTrigger className="px-4 py-3 text-start text-base font-semibold">
            <div className="flex items-center gap-2">
              <Icon name="book" size="sm" className="text-muted-foreground" />
              {tTabs('usageGuide')}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <UsageGuideSection product={product} locale={locale} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="reviews" className="rounded-lg border border-border bg-card shadow-sm">
          <AccordionTrigger className="px-4 py-3 text-start text-base font-semibold">
            <div className="flex items-center gap-2">
              <Icon name="star" size="sm" className="text-muted-foreground" />
              {tTabs('reviews')}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <ReviewsTabContent
              productId={product.id}
              productSlug={product.slug}
              productName={product.name}
              reviews={reviews}
              reviewSummary={reviewSummary}
              userVotes={userVotes}
              locale={locale}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="qa" className="rounded-lg border border-border bg-card shadow-sm">
          <AccordionTrigger className="px-4 py-3 text-start text-base font-semibold">
            <div className="flex items-center gap-2">
              <Icon name="help" size="sm" className="text-muted-foreground" />
              {tTabs('qa')}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <ProductQA />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="faq" className="rounded-lg border border-border bg-card shadow-sm">
          <AccordionTrigger className="px-4 py-3 text-start text-base font-semibold">
            <div className="flex items-center gap-2">
              <Icon name="help" size="sm" className="text-muted-foreground" />
              {tTabs('faq')}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <FaqSection product={product} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="bundles" className="rounded-lg border border-border bg-card shadow-sm">
          <AccordionTrigger className="px-4 py-3 text-start text-base font-semibold">
            <div className="flex items-center gap-2">
              <Icon name="package-search" size="sm" className="text-muted-foreground" />
              {tTabs('bundles')}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
