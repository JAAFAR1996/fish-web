import { db } from '@server/db';
import { helpfulVotes, profiles, reviews } from '@shared/schema';
import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  sql,
} from 'drizzle-orm';

import type {
  HelpfulVote,
  Review,
  ReviewSummary,
  ReviewWithUser,
} from '@/types';

type ReviewRow = typeof reviews.$inferSelect;
type ProfileRow = typeof profiles.$inferSelect | null;

type ReviewSortOption = 'recent' | 'helpful' | 'highest' | 'lowest';

interface ProductReviewFilters {
  rating?: number;
  sortBy?: ReviewSortOption;
}

const toIsoString = (value: Date | string | null | undefined): string =>
  value instanceof Date ? value.toISOString() : value ?? new Date(0).toISOString();

function transformUserProfile(userId: string, profile?: ProfileRow): ReviewWithUser['user'] {
  return {
    id: profile?.id ?? userId,
    full_name: profile?.fullName ?? null,
    avatar_url: profile?.avatarUrl ?? null,
  };
}

function transformReview(review: ReviewRow): Review {
  const ratingValue =
    typeof review.rating === 'number'
      ? review.rating
      : Number.parseFloat(String(review.rating ?? 0));

  return {
    id: review.id,
    product_id: review.productId,
    user_id: review.userId,
    rating: Number.isNaN(ratingValue) ? 0 : ratingValue,
    title: review.title ?? '',
    comment: review.comment ?? '',
    images: Array.isArray(review.images) ? review.images : [],
    is_approved: Boolean(review.isApproved),
    helpful_count: Number(review.helpfulCount ?? 0),
    not_helpful_count: Number(review.notHelpfulCount ?? 0),
    created_at: toIsoString(review.createdAt),
    updated_at: toIsoString(review.updatedAt),
  };
}

function transformReviewWithUser(
  review: ReviewRow,
  profile?: ProfileRow,
): ReviewWithUser {
  return {
    ...transformReview(review),
    user: transformUserProfile(review.userId, profile),
  };
}

function transformHelpfulVote(vote: typeof helpfulVotes.$inferSelect): HelpfulVote {
  return {
    id: vote.id,
    review_id: vote.reviewId,
    user_id: vote.userId,
    vote_type: vote.voteType as HelpfulVote['vote_type'],
    created_at: toIsoString(vote.createdAt),
  };
}

export async function getProductReviews(
  productId: string,
  filters: ProductReviewFilters = {},
): Promise<ReviewWithUser[]> {
  try {
    const conditions = [
      eq(reviews.productId, productId),
      eq(reviews.isApproved, true),
    ];

    if (filters.rating) {
      if (filters.rating >= 5) {
        conditions.push(eq(reviews.rating, filters.rating));
      } else {
        conditions.push(gte(reviews.rating, filters.rating));
      }
    }

    const sortBy = filters.sortBy ?? 'recent';
    const orderings: Array<ReturnType<typeof asc> | ReturnType<typeof desc>> = [];

    switch (sortBy) {
      case 'helpful':
        orderings.push(desc(reviews.helpfulCount));
        break;
      case 'highest':
        orderings.push(desc(reviews.rating));
        break;
      case 'lowest':
        orderings.push(asc(reviews.rating));
        break;
      case 'recent':
      default:
        orderings.push(desc(reviews.createdAt));
        break;
    }

    if (sortBy !== 'recent') {
      orderings.push(desc(reviews.createdAt));
    }

    const rows = await db
      .select({
        review: reviews,
        profile: profiles,
      })
      .from(reviews)
      .leftJoin(profiles, eq(reviews.userId, profiles.id))
      .where(and(...conditions))
      .orderBy(...orderings);

    return rows.map(({ review, profile }) =>
      transformReviewWithUser(review, profile),
    );
  } catch (error) {
    console.error('Failed to fetch product reviews', error);
    return [];
  }
}

export async function getUserReview(
  userId: string,
  productId: string,
): Promise<Review | null> {
  try {
    const [row] = await db
      .select()
      .from(reviews)
      .where(
        and(eq(reviews.userId, userId), eq(reviews.productId, productId)),
      )
      .limit(1);

    return row ? transformReview(row) : null;
  } catch (error) {
    console.error('Failed to fetch user review', error);
    return null;
  }
}

export async function getReviewById(reviewId: string): Promise<ReviewWithUser | null> {
  try {
    const [row] = await db
      .select({
        review: reviews,
        profile: profiles,
      })
      .from(reviews)
      .leftJoin(profiles, eq(reviews.userId, profiles.id))
      .where(eq(reviews.id, reviewId))
      .limit(1);

    if (!row) {
      return null;
    }

    return transformReviewWithUser(row.review, row.profile);
  } catch (error) {
    console.error('Failed to fetch review by id', error);
    return null;
  }
}

export async function getProductReviewSummary(productId: string): Promise<ReviewSummary> {
  try {
    const [result] = await db
      .select({
        average: sql<number>`COALESCE(ROUND(AVG(${reviews.rating})::numeric, 1), 0)`,
        total: sql<number>`COUNT(*)::int`,
        rating1: sql<number>`COUNT(*) FILTER (WHERE ${reviews.rating} = 1)::int`,
        rating2: sql<number>`COUNT(*) FILTER (WHERE ${reviews.rating} = 2)::int`,
        rating3: sql<number>`COUNT(*) FILTER (WHERE ${reviews.rating} = 3)::int`,
        rating4: sql<number>`COUNT(*) FILTER (WHERE ${reviews.rating} = 4)::int`,
        rating5: sql<number>`COUNT(*) FILTER (WHERE ${reviews.rating} = 5)::int`,
      })
      .from(reviews)
      .where(
        and(eq(reviews.productId, productId), eq(reviews.isApproved, true)),
      );

    if (!result) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    return {
      averageRating: result.average ?? 0,
      totalReviews: result.total ?? 0,
      ratingDistribution: {
        1: result.rating1 ?? 0,
        2: result.rating2 ?? 0,
        3: result.rating3 ?? 0,
        4: result.rating4 ?? 0,
        5: result.rating5 ?? 0,
      },
    };
  } catch (error) {
    console.error('Failed to fetch product review summary', error);
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }
}

export async function getUserHelpfulVote(
  userId: string,
  reviewId: string,
): Promise<HelpfulVote | null> {
  try {
    const [vote] = await db
      .select()
      .from(helpfulVotes)
      .where(
        and(eq(helpfulVotes.userId, userId), eq(helpfulVotes.reviewId, reviewId)),
      )
      .limit(1);

    return vote ? transformHelpfulVote(vote) : null;
  } catch (error) {
    console.error('Failed to fetch helpful vote', error);
    return null;
  }
}

export async function getReviewHelpfulVotes(
  reviewId: string,
): Promise<{ helpful: number; notHelpful: number }> {
  try {
    const votes = await db
      .select({
        voteType: helpfulVotes.voteType,
      })
      .from(helpfulVotes)
      .where(eq(helpfulVotes.reviewId, reviewId));

    let helpful = 0;
    let notHelpful = 0;

    for (const vote of votes) {
      if (vote.voteType === 'helpful') {
        helpful += 1;
      } else if (vote.voteType === 'not_helpful') {
        notHelpful += 1;
      }
    }

    return { helpful, notHelpful };
  } catch (error) {
    console.error('Failed to fetch review helpful votes', error);
    return { helpful: 0, notHelpful: 0 };
  }
}

export async function getUserReviews(
  userId: string,
  limit = 10,
): Promise<ReviewWithUser[]> {
  try {
    const rows = await db
      .select({
        review: reviews,
        profile: profiles,
      })
      .from(reviews)
      .leftJoin(profiles, eq(reviews.userId, profiles.id))
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt))
      .limit(limit);

    return rows.map(({ review, profile }) =>
      transformReviewWithUser(review, profile),
    );
  } catch (error) {
    console.error('Failed to fetch user reviews', error);
    return [];
  }
}

export async function getHelpfulVotesForUser(
  userId: string,
  reviewIds: string[],
): Promise<Record<string, HelpfulVote>> {
  if (!reviewIds.length) {
    return {};
  }

  try {
    const votes = await db
      .select()
      .from(helpfulVotes)
      .where(
        and(
          eq(helpfulVotes.userId, userId),
          inArray(helpfulVotes.reviewId, reviewIds),
        ),
      );

    const mapped: Record<string, HelpfulVote> = {};

    for (const vote of votes) {
      const transformed = transformHelpfulVote(vote);
      mapped[transformed.review_id] = transformed;
    }

    return mapped;
  } catch (error) {
    console.error('Failed to fetch helpful votes for user', error);
    return {};
  }
}
