'use server';

import { revalidatePath } from 'next/cache';

import { getUser } from '@/lib/auth/utils';
import { getR2PublicUrl } from '@/lib/env';
import { db } from '@server/db';
import { helpfulVotes, reviews } from '@shared/schema';
import { and, eq, sql } from 'drizzle-orm';

import { deleteReviewImages } from './image-upload';
import { extractPathFromUrl } from './url-utils';
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

  const baseUrl = getR2PublicUrl().replace(/\/+$/, '');
  const expectedPrefix = `${baseUrl}/${STORAGE_BUCKET}/`;

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

  try {
    const [created] = await db
      .insert(reviews)
      .values({
        productId,
        userId: user.id,
        rating: formData.rating,
        title: formData.title.trim(),
        comment: formData.comment.trim(),
        images: formData.imageUrls,
        isApproved: false,
      })
      .returning({ id: reviews.id });

    if (!created) {
      return { success: false, error: 'reviews.errors.submitFailed' };
    }

    if (options?.revalidatePath) {
      revalidateReviewPaths(options.revalidatePath);
    }

    return { success: true, reviewId: created.id };
  } catch (error) {
    console.error('Failed to create review', error);
    return { success: false, error: 'reviews.errors.submitFailed' };
  }
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

  try {
    await db
      .update(reviews)
      .set({
        rating: formData.rating,
        title: formData.title.trim(),
        comment: formData.comment.trim(),
        images: formData.imageUrls,
        isApproved: false,
        updatedAt: sql`now()`,
      })
      .where(and(eq(reviews.id, reviewId), eq(reviews.userId, user.id)));

    if (options?.revalidatePath) {
      revalidateReviewPaths(options.revalidatePath);
    }

    return { success: true, reviewId };
  } catch (error) {
    console.error('Failed to update review', error);
    return { success: false, error: 'reviews.errors.submitFailed' };
  }
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

  try {
    await db
      .delete(reviews)
      .where(and(eq(reviews.id, reviewId), eq(reviews.userId, user.id)));

    if (options?.revalidatePath) {
      revalidateReviewPaths(options.revalidatePath);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to delete review', error);
    return { success: false, error: 'reviews.errors.submitFailed' };
  }
}

export async function toggleHelpfulVoteAction(
  reviewId: string,
  voteType: 'helpful' | 'not_helpful',
): Promise<ReviewActionResponse> {
  const user = await getUser();

  if (!user) {
    return { success: false, error: 'reviews.errors.authRequired' };
  }

  try {
    const existingVote = await getUserHelpfulVote(user.id, reviewId);

    if (!existingVote) {
      // Insert new vote
      await db.insert(helpfulVotes).values({
        reviewId,
        userId: user.id,
        voteType,
      });

      // Increment the appropriate counter
      if (voteType === 'helpful') {
        await db
          .update(reviews)
          .set({ helpfulCount: sql`${reviews.helpfulCount} + 1` })
          .where(eq(reviews.id, reviewId));
      } else {
        await db
          .update(reviews)
          .set({ notHelpfulCount: sql`${reviews.notHelpfulCount} + 1` })
          .where(eq(reviews.id, reviewId));
      }
    } else if (existingVote.vote_type === voteType) {
      // Delete existing vote
      await db
        .delete(helpfulVotes)
        .where(and(eq(helpfulVotes.id, existingVote.id), eq(helpfulVotes.userId, user.id)));

      // Decrement the appropriate counter
      if (voteType === 'helpful') {
        await db
          .update(reviews)
          .set({ helpfulCount: sql`GREATEST(${reviews.helpfulCount} - 1, 0)` })
          .where(eq(reviews.id, reviewId));
      } else {
        await db
          .update(reviews)
          .set({ notHelpfulCount: sql`GREATEST(${reviews.notHelpfulCount} - 1, 0)` })
          .where(eq(reviews.id, reviewId));
      }
    } else {
      // Update vote type
      await db
        .update(helpfulVotes)
        .set({ voteType })
        .where(and(eq(helpfulVotes.id, existingVote.id), eq(helpfulVotes.userId, user.id)));

      // Update counters: decrement old type, increment new type
      if (voteType === 'helpful') {
        await db
          .update(reviews)
          .set({
            helpfulCount: sql`${reviews.helpfulCount} + 1`,
            notHelpfulCount: sql`GREATEST(${reviews.notHelpfulCount} - 1, 0)`,
          })
          .where(eq(reviews.id, reviewId));
      } else {
        await db
          .update(reviews)
          .set({
            helpfulCount: sql`GREATEST(${reviews.helpfulCount} - 1, 0)`,
            notHelpfulCount: sql`${reviews.notHelpfulCount} + 1`,
          })
          .where(eq(reviews.id, reviewId));
      }
    }

    revalidatePath('/account');

    return { success: true };
  } catch (error) {
    console.error('Failed to toggle helpful vote', error);
    return { success: false, error: 'reviews.errors.submitFailed' };
  }
}
