import type { Product } from '@/types';
import { getProductsWithFlashSalesAction } from '@/lib/data/products-actions';

export async function getRecommendedHeatersClient(
  requiredWattage: number,
  limit: number = 4
): Promise<Product[]> {
  const allProducts = await getProductsWithFlashSalesAction();

  const heaters = allProducts.filter((product) => product.category === 'heating');

  const lowerBound = requiredWattage * 0.8;
  const upperBound = requiredWattage * 1.5;

  const matchingHeaters = heaters.filter((product) => {
    const power = product.specifications.power;
    return power !== null && power >= lowerBound && power <= upperBound;
  });

  if (matchingHeaters.length === 0) {
    return heaters
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  return matchingHeaters
    .sort((a, b) => {
      const aPower = a.specifications.power ?? 0;
      const bPower = b.specifications.power ?? 0;
      const aProximity = Math.abs(aPower - requiredWattage);
      const bProximity = Math.abs(bPower - requiredWattage);

      if (aProximity !== bProximity) {
        return aProximity - bProximity;
      }

      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }

      return a.price - b.price;
    })
    .slice(0, limit);
}

export async function getRecommendedFiltersClient(
  requiredFlowRate: number,
  tankVolume: number,
  limit: number = 4
): Promise<Product[]> {
  const allProducts = await getProductsWithFlashSalesAction();

  const filters = allProducts.filter((product) => product.category === 'filtration');

  const matchingFilters = filters.filter((product) => {
    const flow = product.specifications.flow;
    if (flow === null || flow < requiredFlowRate) {
      return false;
    }

    return isProductCompatible(product, tankVolume);
  });

  if (matchingFilters.length === 0) {
    const compatibleFallback = filters.filter((product) =>
      isProductCompatible(product, tankVolume)
    );

    const candidatePool = compatibleFallback.length
      ? compatibleFallback
      : filters;

    return candidatePool
      .sort((a, b) => {
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }

        return a.price - b.price;
      })
      .slice(0, limit);
  }

  const scoredFilters = matchingFilters.map((product) => ({
    product,
    score: calculateMatchScore(product, requiredFlowRate, 'flow'),
  }));

  return scoredFilters
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      if (b.product.rating !== a.product.rating) {
        return b.product.rating - a.product.rating;
      }

      return a.product.price - b.product.price;
    })
    .slice(0, limit)
    .map(({ product }) => product);
}

function calculateMatchScore(
  product: Product,
  requiredValue: number,
  specKey: 'power' | 'flow'
): number {
  const productValue = product.specifications[specKey];

  if (productValue === null) {
    return 0;
  }

  const difference = Math.abs(productValue - requiredValue);
  const percentageDiff = (difference / requiredValue) * 100;

  if (percentageDiff <= 5) {
    return 100;
  } else if (percentageDiff <= 20) {
    return 99 - Math.floor(percentageDiff);
  } else if (percentageDiff <= 50) {
    return 79 - Math.floor(percentageDiff / 2);
  }

  return 50;
}

function isProductCompatible(product: Product, tankVolume: number): boolean {
  const { minTankSize, maxTankSize } = product.specifications.compatibility;

  if (minTankSize !== null && tankVolume < minTankSize) {
    return false;
  }

  if (maxTankSize !== null && tankVolume > maxTankSize) {
    return false;
  }

  return true;
}
