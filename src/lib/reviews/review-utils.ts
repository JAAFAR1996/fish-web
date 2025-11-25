import { Locale, Review, ReviewSummary } from '@/types';

export const calculateAverageRating = (reviews: Review[]): number => {
  if (!reviews.length) {
    return 0;
  }

  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  const average = total / reviews.length;

  return Math.round(average * 10) / 10;
};

export const getRatingDistribution = (
  reviews: Review[],
): Record<1 | 2 | 3 | 4 | 5, number> => {
  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  for (const review of reviews) {
    const rating = Math.min(Math.max(review.rating, 1), 5) as 1 | 2 | 3 | 4 | 5;
    distribution[rating] += 1;
  }

  return distribution;
};

export const getReviewSummary = (reviews: Review[]): ReviewSummary => {
  const averageRating = calculateAverageRating(reviews);
  const totalReviews = reviews.length;
  const ratingDistribution = getRatingDistribution(reviews);

  return { averageRating, totalReviews, ratingDistribution };
};

export const filterReviewsByRating = <T extends Review>(reviews: T[], minRating: number): T[] => {
  if (minRating <= 0) {
    return reviews;
  }

  return reviews.filter((review) => review.rating >= minRating);
};

export const filterVerifiedReviews = <T extends Review>(reviews: T[]): T[] =>
  reviews.filter(
    (review) => Boolean((review as Review).verified) || Boolean((review as Review).verified_purchase),
  );

export const sortReviews = <T extends Review>(
  reviews: T[],
  sortBy: 'recent' | 'helpful' | 'highest' | 'lowest',
): T[] => {
  const sorted = [...reviews];

  switch (sortBy) {
    case 'helpful':
      return sorted.sort((a, b) => {
        if (b.helpful_count === a.helpful_count) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }

        return b.helpful_count - a.helpful_count;
      });
    case 'highest':
      return sorted.sort((a, b) => {
        if (b.rating === a.rating) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }

        return b.rating - a.rating;
      });
    case 'lowest':
      return sorted.sort((a, b) => {
        if (a.rating === b.rating) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }

        return a.rating - b.rating;
      });
    case 'recent':
    default:
      return sorted.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }
};

export const formatReviewDate = (dateString: string, locale: Locale): string => {
  const date = new Date(dateString);
  const timestamp = date.getTime();

  if (Number.isNaN(timestamp)) {
    return dateString;
  }

  const now = Date.now();
  const diffInSeconds = Math.round((timestamp - now) / 1000);
  const absSeconds = Math.abs(diffInSeconds);
  const secondsInYear = 60 * 60 * 24 * 365;

  if (absSeconds >= secondsInYear) {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
  }

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (absSeconds < 60) {
    return rtf.format(diffInSeconds, 'second');
  }

  if (absSeconds < 3600) {
    return rtf.format(Math.round(diffInSeconds / 60), 'minute');
  }

  if (absSeconds < 86400) {
    return rtf.format(Math.round(diffInSeconds / 3600), 'hour');
  }

  if (absSeconds < 604800) {
    return rtf.format(Math.round(diffInSeconds / 86400), 'day');
  }

  if (absSeconds < 2629800) {
    return rtf.format(Math.round(diffInSeconds / 604800), 'week');
  }

  return rtf.format(Math.round(diffInSeconds / 2629800), 'month');
};

export const canUserReview = (
  userId: string,
  productId: string,
  existingReviews: Review[],
): boolean => {
  if (!userId) {
    return false;
  }

  return !existingReviews.some(
    (review) => review.user_id === userId && review.product_id === productId,
  );
};
