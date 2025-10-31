import { ValidationResult } from '@/types';

import {
  ALLOWED_IMAGE_TYPES,
  MAX_COMMENT_LENGTH,
  MAX_IMAGE_SIZE,
  MAX_REVIEW_IMAGES,
  MAX_TITLE_LENGTH,
  MAX_RATING,
  MIN_COMMENT_LENGTH,
  MIN_RATING,
  REVIEW_EDIT_WINDOW,
} from './constants';

const createValidationResult = (errors: Record<string, string> = {}): ValidationResult => ({
  valid: Object.keys(errors).length === 0,
  errors,
});

export const validateRating = (rating: number | null): ValidationResult => {
  if (rating === null || !Number.isInteger(rating) || rating < MIN_RATING || rating > MAX_RATING) {
    return createValidationResult({ rating: 'reviews.validation.ratingRequired' });
  }

  return createValidationResult();
};

export const validateReviewTitle = (title: string): ValidationResult => {
  const trimmed = title.trim();

  if (!trimmed) {
    return createValidationResult({ title: 'reviews.validation.titleRequired' });
  }

  if (trimmed.length > MAX_TITLE_LENGTH) {
    return createValidationResult({ title: 'reviews.validation.titleMax' });
  }

  return createValidationResult();
};

export const validateReviewComment = (comment: string): ValidationResult => {
  const trimmed = comment.trim();

  if (!trimmed) {
    return createValidationResult({ comment: 'reviews.validation.commentRequired' });
  }

  if (trimmed.length < MIN_COMMENT_LENGTH) {
    return createValidationResult({ comment: 'reviews.validation.commentMin' });
  }

  if (trimmed.length > MAX_COMMENT_LENGTH) {
    return createValidationResult({ comment: 'reviews.validation.commentMax' });
  }

  return createValidationResult();
};

export const validateReviewImages = (images: File[]): ValidationResult => {
  const errors: Record<string, string> = {};

  if (images.length > MAX_REVIEW_IMAGES) {
    errors.images = 'reviews.validation.imagesMax';
    return createValidationResult(errors);
  }

  for (const image of images) {
    if (image.size > MAX_IMAGE_SIZE) {
      errors.images = 'reviews.validation.imageSizeMax';
      break;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
      errors.images = 'reviews.validation.imageTypeInvalid';
      break;
    }
  }

  return createValidationResult(errors);
};

export const validateReviewForm = (data: {
  rating: number | null;
  title: string;
  comment: string;
  images: File[];
}): ValidationResult => {
  const ratingResult = validateRating(data.rating);
  const titleResult = validateReviewTitle(data.title);
  const commentResult = validateReviewComment(data.comment);
  const imagesResult = validateReviewImages(data.images);

  const errors = {
    ...ratingResult.errors,
    ...titleResult.errors,
    ...commentResult.errors,
    ...imagesResult.errors,
  };

  return {
    valid: ratingResult.valid && titleResult.valid && commentResult.valid && imagesResult.valid,
    errors,
  };
};

export const canEditReview = (reviewCreatedAt: string): boolean => {
  const createdAt = new Date(reviewCreatedAt).getTime();

  if (Number.isNaN(createdAt)) {
    return false;
  }

  return Date.now() - createdAt <= REVIEW_EDIT_WINDOW;
};
