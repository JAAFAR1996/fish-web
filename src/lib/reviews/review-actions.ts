'use server';

import { revalidatePath } from 'next/cache';

import { getUser } from '@/lib/auth/utils';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getSupabaseUrl } from '@/lib/env';

import { deleteReviewImages, extractPathFromUrl } from './image-upload';
import { MAX_REVIEW_IMAGES, STORAGE_BUCKET } from './constants';
import {
  getReviewById,
  getUserHelpfulVote,
  getUserReview,
} from './review-queries';
import {
  canEditReview,
  validateReviewForm,
} from './review-validation';

interface ReviewActionResponse {
  success: boolean;
  error?: string;
  reviewId?: string;
}

const getFirstError = (errors: Record<string, string>): string | undefined =>
  Object.values(errors)[0];

const revalidateReviewPaths = (path: string) => {
  revalidatePath(path);
  revalidatePath('/account');
};

const validateImageUrls = async (imageUrls: string[]): Promise<{ valid: boolean; error?: string }> => {
  if (imageUrls.length > MAX_REVIEW_IMAGES) {
    return { valid: false, error: 'reviews.validation.imagesMax' };
  }

  const supabaseUrl = getSupabaseUrl();
  const expectedPrefix = `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/`;

  for (const url of imageUrls) {
    if (!url.startsWith(expectedPrefix)) {
      return { valid: false, error: 'reviews.errors.uploadFailed' };
    }

    const path = extractPathFromUrl(url);
    if (!path) {
      return { valid: false, error: 'reviews.errors.uploadFailed' };
    }
  }

  return { valid: true };
};

interface RevalidateOptions {
  revalidatePath?: string;
}

export async function createReviewAction(
  productId: string,
  formData: {
    rating: number;
    title: string;
    comment: string;
    imageUrls: string[];
  },
  options?: RevalidateOptions,
): Promise<ReviewActionResponse> {
  const user = await getUser();

  if (!user) {
    return { success: false, error: 'reviews.errors.authRequired' };
  }

  const validation = validateReviewForm({
    rating: formData.rating ?? null,
    title: formData.title,
    comment: formData.comment,
    images: [],
  });

  if (!validation.valid) {
    return {
      success: false,
      error: getFirstError(validation.errors) ?? 'reviews.errors.submitFailed',
    };
  }

  const imageValidation = await validateImageUrls(formData.imageUrls);
  if (!imageValidation.valid) {
    return {
      success: false,
      error: imageValidation.error ?? 'reviews.errors.uploadFailed',
    };
  }

  const existingReview = await getUserReview(user.id, productId);

  if (existingReview) {
    return { success: false, error: 'reviews.validation.alreadyReviewed' };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      product_id: productId,
      user_id: user.id,
      rating: formData.rating,
      title: formData.title.trim(),
      comment: formData.comment.trim(),
      images: formData.imageUrls,
      is_approved: false,
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('Failed to create review', error);
    return { success: false, error: 'reviews.errors.submitFailed' };
  }

  if (options?.revalidatePath) {
    revalidateReviewPaths(options.revalidatePath);
  }

  return { success: true, reviewId: data.id };
}

export async function updateReviewAction(
  reviewId: string,
  formData: {
    rating: number;
    title: string;
    comment: string;
    imageUrls: string[];
  },
  options?: RevalidateOptions,
): Promise<ReviewActionResponse> {
  const user = await getUser();

  if (!user) {
    return { success: false, error: 'reviews.errors.authRequired' };
  }

  const existingReview = await getReviewById(reviewId);

  if (!existingReview || existingReview.user_id !== user.id) {
    return { success: false, error: 'reviews.errors.authRequired' };
  }

  if (!canEditReview(existingReview.created_at)) {
    return { success: false, error: 'reviews.errors.submitFailed' };
  }

  const validation = validateReviewForm({
    rating: formData.rating ?? null,
    title: formData.title,
    comment: formData.comment,
    images: [],
  });

  if (!validation.valid) {
    return {
      success: false,
      error: getFirstError(validation.errors) ?? 'reviews.errors.submitFailed',
    };
  }

  const imageValidation = await validateImageUrls(formData.imageUrls);
  if (!imageValidation.valid) {
    return {
      success: false,
      error: imageValidation.error ?? 'reviews.errors.uploadFailed',
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('reviews')
    .update({
      rating: formData.rating,
      title: formData.title.trim(),
      comment: formData.comment.trim(),
      images: formData.imageUrls,
      is_approved: false,
    })
    .eq('id', reviewId);

  if (error) {
    console.error('Failed to update review', error);
    return { success: false, error: 'reviews.errors.submitFailed' };
  }

  if (options?.revalidatePath) {
    revalidateReviewPaths(options.revalidatePath);
  }

  return { success: true, reviewId };
}

export async function deleteReviewAction(
  reviewId: string,
  options?: RevalidateOptions,
): Promise<ReviewActionResponse> {
  const user = await getUser();

  if (!user) {
    return { success: false, error: 'reviews.errors.authRequired' };
  }

  const existingReview = await getReviewById(reviewId);

  if (!existingReview || existingReview.user_id !== user.id) {
    return { success: false, error: 'reviews.errors.authRequired' };
  }

  if (Array.isArray(existingReview.images) && existingReview.images.length > 0) {
    await deleteReviewImages(existingReview.images);
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('reviews').delete().eq('id', reviewId);

  if (error) {
    console.error('Failed to delete review', error);
    return { success: false, error: 'reviews.errors.submitFailed' };
  }

  if (options?.revalidatePath) {
    revalidateReviewPaths(options.revalidatePath);
  }

  return { success: true };
}

export async function toggleHelpfulVoteAction(
  reviewId: string,
  voteType: 'helpful' | 'not_helpful',
): Promise<ReviewActionResponse> {
  const user = await getUser();

  if (!user) {
    return { success: false, error: 'reviews.errors.authRequired' };
  }

  const supabase = await createServerSupabaseClient();
  const existingVote = await getUserHelpfulVote(user.id, reviewId);

  if (!existingVote) {
    const { error } = await supabase
      .from('helpful_votes')
      .insert({
        review_id: reviewId,
        user_id: user.id,
        vote_type: voteType,
      });

    if (error) {
      console.error('Failed to create helpful vote', error);
      return { success: false, error: 'reviews.errors.submitFailed' };
    }
  } else if (existingVote.vote_type === voteType) {
    const { error } = await supabase
      .from('helpful_votes')
      .delete()
      .eq('id', existingVote.id);

    if (error) {
      console.error('Failed to remove helpful vote', error);
      return { success: false, error: 'reviews.errors.submitFailed' };
    }
  } else {
    const { error } = await supabase
      .from('helpful_votes')
      .update({ vote_type: voteType })
      .eq('id', existingVote.id);

    if (error) {
      console.error('Failed to update helpful vote', error);
      return { success: false, error: 'reviews.errors.submitFailed' };
    }
  }

  revalidatePath('/account');

  return { success: true };
}
