import { NextRequest, NextResponse } from 'next/server';
import { Buffer } from 'node:buffer';

import {
  ALLOWED_PRODUCT_IMAGE_TYPES,
  MAX_PRODUCT_IMAGE_SIZE,
  PRODUCT_IMAGES_BUCKET,
} from '@/lib/admin/constants';
import { requireAdmin } from '@/lib/auth/utils';
import { uploadFile } from '@/lib/storage/r2';
import { checkUploadRateLimit } from '@/lib/uploads/rate-limit';
import { sanitizeFileName } from '@/lib/uploads/sanitize';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin();
  } catch (error) {
    console.warn('[Upload] Unauthorized product upload attempt', { error });
    return NextResponse.json(
      { error: 'auth.errors.unauthenticated' },
      { status: 403 },
    );
  }

  const identifier = request.ip ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
  if (!checkUploadRateLimit(`product:${identifier}`)) {
    return NextResponse.json(
      { error: 'auth.errors.tooManyRequests' },
      { status: 429 },
    );
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const slug = formData.get('slug');

  if (!(file instanceof File) || typeof slug !== 'string' || !slug.trim()) {
    return NextResponse.json(
      { error: 'Invalid upload payload' },
      { status: 400 },
    );
  }

  if (file.size > MAX_PRODUCT_IMAGE_SIZE) {
    return NextResponse.json(
      { error: 'admin.validation.imageSizeMax' },
      { status: 413 },
    );
  }

  if (
    !ALLOWED_PRODUCT_IMAGE_TYPES.includes(
      file.type as (typeof ALLOWED_PRODUCT_IMAGE_TYPES)[number],
    )
  ) {
    return NextResponse.json(
      { error: 'admin.validation.imageTypeInvalid' },
      { status: 415 },
    );
  }

  const sanitizedFileName = sanitizeFileName(file.name) || 'image';
  const key = `products/${slug}/${Date.now()}-${sanitizedFileName}`;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const url = await uploadFile(
      PRODUCT_IMAGES_BUCKET,
      key,
      buffer,
      file.type || 'application/octet-stream',
    );

    return NextResponse.json({ url });
  } catch (error) {
    console.error('[Upload] Failed to upload product image', {
      error,
      slug,
    });
    return NextResponse.json(
      { error: 'errors.imageUploadFailed' },
      { status: 500 },
    );
  }
}
