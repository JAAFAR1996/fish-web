import {
  HelpfulVote,
  Review,
  ReviewSummary,
  ReviewWithUser,
} from '@/types';

import { createServerSupabaseClient } from '@/lib/supabase/server';

import { getReviewSummary } from './review-utils';

type ReviewSortOption = 'recent' | 'helpful' | 'highest' | 'lowest';

interface ProductReviewFilters {
  rating?: number;
  sortBy?: ReviewSortOption;
}

export async function getProductReviews(
  productId: string,
  filters: ProductReviewFilters = {},
): Promise<ReviewWithUser[]> {
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('reviews')
    .select(
      'id, product_id, user_id, rating, title, comment, images, is_approved, helpful_count, not_helpful_count, created_at, updated_at, user:profiles_public(id, full_name, avatar_url)',
    )
    .eq('product_id', productId)
    .eq('is_approved', true);

  if (filters.rating) {
    if (filters.rating >= 5) {
      query = query.eq('rating', filters.rating);
    } else {
      query = query.gte('rating', filters.rating);
    }
  }

  const sortBy = filters.sortBy ?? 'recent';
  let orderColumn: 'created_at' | 'helpful_count' | 'rating' = 'created_at';
  let ascending = false;

  switch (sortBy) {
    case 'helpful':
      orderColumn = 'helpful_count';
      ascending = false;
      break;
    case 'highest':
      orderColumn = 'rating';
      ascending = false;
      break;
    case 'lowest':
      orderColumn = 'rating';
      ascending = true;
      break;
    case 'recent':
    default:
      orderColumn = 'created_at';
      ascending = false;
      break;
  }

  query = query.order(orderColumn, { ascending });

  if (orderColumn !== 'created_at') {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch product reviews', error);
    return [];
  }

  return (data ?? []) as ReviewWithUser[];
}

export async function getUserReview(
  userId: string,
  productId: string,
): Promise<Review | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch user review', error);
    return null;
  }

  return data ?? null;
}

export async function getReviewById(reviewId: string): Promise<ReviewWithUser | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('reviews')
    .select(
      'id, product_id, user_id, rating, title, comment, images, is_approved, helpful_count, not_helpful_count, created_at, updated_at, user:profiles_public(id, full_name, avatar_url)',
    )
    .eq('id', reviewId)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch review by id', error);
    return null;
  }

  return (data as ReviewWithUser) ?? null;
}

export async function getProductReviewSummary(productId: string): Promise<ReviewSummary> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('product_id', productId)
    .eq('is_approved', true);

  if (error) {
    console.error('Failed to fetch product review summary', error);
    return getReviewSummary([]);
  }

  return getReviewSummary((data ?? []) as Review[]);
}

export async function getUserHelpfulVote(
  userId: string,
  reviewId: string,
): Promise<HelpfulVote | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('helpful_votes')
    .select('*')
    .eq('user_id', userId)
    .eq('review_id', reviewId)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch helpful vote', error);
    return null;
  }

  return data ?? null;
}

export async function getReviewHelpfulVotes(
  reviewId: string,
): Promise<{ helpful: number; notHelpful: number }> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('helpful_votes')
    .select('vote_type')
    .eq('review_id', reviewId);

  if (error) {
    console.error('Failed to fetch review helpful votes', error);
    return { helpful: 0, notHelpful: 0 };
  }

  let helpful = 0;
  let notHelpful = 0;

  for (const vote of data ?? []) {
    if (vote.vote_type === 'helpful') {
      helpful += 1;
    } else if (vote.vote_type === 'not_helpful') {
      notHelpful += 1;
    }
  }

  return { helpful, notHelpful };
}

export async function getUserReviews(
  userId: string,
  limit = 10,
): Promise<ReviewWithUser[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('reviews')
    .select(
      'id, product_id, user_id, rating, title, comment, images, is_approved, helpful_count, not_helpful_count, created_at, updated_at, user:profiles_public(id, full_name, avatar_url)',
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch user reviews', error);
    return [];
  }

  return (data ?? []) as ReviewWithUser[];
}

export async function getHelpfulVotesForUser(
  userId: string,
  reviewIds: string[],
): Promise<Record<string, HelpfulVote>> {
  if (!reviewIds.length) {
    return {};
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('helpful_votes')
    .select('*')
    .eq('user_id', userId)
    .in('review_id', reviewIds);

  if (error) {
    console.error('Failed to fetch helpful votes for user', error);
    return {};
  }

  const votes: Record<string, HelpfulVote> = {};
  for (const vote of data ?? []) {
    votes[vote.review_id] = vote as HelpfulVote;
  }

  return votes;
}
