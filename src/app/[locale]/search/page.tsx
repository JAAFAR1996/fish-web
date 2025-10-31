import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { ProductListing } from '@/components/products';
import {
  SearchEmptyState,
  SearchResultsHeader,
} from '@/components/search';
import { getProducts, getProductsWithFlashSales } from '@/lib/data/products';
import { searchProducts } from '@/lib/search/search-utils';
import { searchProductsSupabase } from '@/lib/search/supabase-search';
import type { Product, SearchPageProps } from '@/types';

export const revalidate = 1800; // 30 minutes ISR

export async function generateMetadata({
  params,
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { locale } = params;
  const query = (searchParams?.q ?? '').trim();
  const t = await getTranslations({ locale, namespace: 'search.results' });

  const title = query ? t('resultsFor', { query }) : t('title');
  const description = t('description');

  return {
    title,
    description,
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function SearchPage({
  params,
  searchParams,
}: SearchPageProps) {
  const { locale } = params;
  const query = (searchParams?.q ?? '').trim();

  setRequestLocale(locale);

  if (!query) {
    redirect(`/${locale}/products`);
  }

  let products: Product[] = [];

  try {
    products = await searchProductsSupabase(query, locale, 60);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[search/page] Supabase search failed', error);
    }
  }

  if (products.length === 0) {
    const allProducts = await getProducts();
    const localResults = searchProducts(allProducts, query);
    products = localResults.map((result) => result.product);
  }

  const uniqueProducts = dedupeProducts(products);

  let filteredProducts = [...uniqueProducts];

  if (searchParams?.category) {
    const category = searchParams.category.toLowerCase();
    filteredProducts = filteredProducts.filter(
      (product) => product.category.toLowerCase() === category
    );
  }

  if (searchParams?.brand) {
    const brand = searchParams.brand.toLowerCase();
    filteredProducts = filteredProducts.filter(
      (product) => product.brand.toLowerCase() === brand
    );
  }

  if (searchParams?.inStock === 'true') {
    filteredProducts = filteredProducts.filter((product) => product.stock > 0);
  }

  // Attach flash sale data to filtered products when available
  const productsWithFlashSales = await getProductsWithFlashSales();
  const flashSaleMap = new Map(productsWithFlashSales.map((product) => [product.id, product.flashSale]));
  const enrichedProducts = filteredProducts.map((product) => ({
    ...product,
    flashSale: flashSaleMap.get(product.id) ?? product.flashSale,
  }));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:px-8">
      <SearchResultsHeader query={query} resultCount={enrichedProducts.length} />
      {enrichedProducts.length === 0 ? (
        <SearchEmptyState query={query} />
      ) : (
        <ProductListing initialProducts={enrichedProducts} searchQuery={query} />
      )}
    </div>
  );
}

function dedupeProducts(products: Product[]): Product[] {
  const map = new Map<string, Product>();
  products.forEach((product) => {
    map.set(product.id, product);
  });
  return Array.from(map.values());
}
