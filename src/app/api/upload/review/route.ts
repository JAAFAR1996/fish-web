import { NextRequest, NextResponse } from 'next/server';
import { Buffer } from 'node:buffer';

import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
  STORAGE_BUCKET,
} from '@/lib/reviews/constants';
import { getUser } from '@/lib/auth/utils';
import { uploadFile } from '@/lib/storage/r2';
import { checkUploadRateLimit } from '@/lib/uploads/rate-limit';
import { sanitizeFileName } from '@/lib/uploads/sanitize';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const formData = await request.formData();
  const file = formData.get('file');
  const userId = formData.get('userId');
  const reviewId = formData.get('reviewId');

  if (
    !(file instanceof File) ||
    typeof userId !== 'string' ||
    !userId.trim() ||
    typeof reviewId !== 'string' ||
    !reviewId.trim()
  ) {
    return NextResponse.json({ error: 'Invalid upload payload' }, { status: 400 });
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json(
      { error: 'reviews.validation.imageSizeMax' },
      { status: 413 },
    );
  }

  if (
    !ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])
  ) {
    return NextResponse.json(
      { error: 'reviews.validation.imageTypeInvalid' },
      { status: 415 },
    );
  }

  const user = await getUser();
  if (!user || user.id !== userId) {
    return NextResponse.json(
      { error: 'auth.errors.unauthenticated' },
      { status: 403 },
    );
  }

  const identifier = request.ip ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
  if (!checkUploadRateLimit(`review:${identifier}:${user.id}`)) {
    return NextResponse.json(
      { error: 'auth.errors.tooManyRequests' },
      { status: 429 },
    );
  }

  const sanitizedName = sanitizeFileName(file.name) || 'image';
  const key = `${userId}/${reviewId}/${Date.now()}-${sanitizedName}`;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const url = await uploadFile(
      STORAGE_BUCKET,
      key,
      buffer,
      file.type || 'application/octet-stream',
    );

    return NextResponse.json({ url });
  } catch (error) {
    console.error('[Upload] Failed to upload review image', {
      error,
      userId,
      reviewId,
    });
    return NextResponse.json(
      { error: 'reviews.errors.uploadFailed' },
      { status: 500 },
    );
  }
}
