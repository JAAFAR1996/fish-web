import { NextRequest, NextResponse } from 'next/server';
import { Buffer } from 'node:buffer';

import {
  ALLOWED_GALLERY_IMAGE_TYPES,
  GALLERY_IMAGES_BUCKET,
  MAX_GALLERY_IMAGE_SIZE,
} from '@/lib/gallery/constants';
import { getUser } from '@/lib/auth/utils';
import { uploadFile } from '@/lib/storage/r2';
import { checkUploadRateLimit } from '@/lib/uploads/rate-limit';
import { sanitizeFileName } from '@/lib/uploads/sanitize';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const formData = await request.formData();
  const file = formData.get('file');
  const userId = formData.get('userId');
  const setupId = formData.get('setupId');

  if (
    !(file instanceof File) ||
    typeof userId !== 'string' ||
    !userId.trim() ||
    typeof setupId !== 'string' ||
    !setupId.trim()
  ) {
    return NextResponse.json({ error: 'Invalid upload payload' }, { status: 400 });
  }

  if (file.size > MAX_GALLERY_IMAGE_SIZE) {
    return NextResponse.json(
      { error: 'gallery.validation.maxMedia' },
      { status: 413 },
    );
  }

  if (
    !ALLOWED_GALLERY_IMAGE_TYPES.includes(
      file.type as (typeof ALLOWED_GALLERY_IMAGE_TYPES)[number],
    )
  ) {
    return NextResponse.json(
      { error: 'gallery.validation.mediaRequired' },
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
  if (!checkUploadRateLimit(`gallery:${identifier}:${user.id}`)) {
    return NextResponse.json(
      { error: 'auth.errors.tooManyRequests' },
      { status: 429 },
    );
  }

  const sanitizedName = sanitizeFileName(file.name) || 'media';
  const key = `${userId}/${setupId}/${Date.now()}-${sanitizedName}`;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const url = await uploadFile(
      GALLERY_IMAGES_BUCKET,
      key,
      buffer,
      file.type || 'application/octet-stream',
    );

    return NextResponse.json({ url });
  } catch (error) {
    console.error('[Upload] Failed to upload gallery media', {
      error,
      userId,
      setupId,
    });
    return NextResponse.json(
      { error: 'gallery.errors.createFailed' },
      { status: 500 },
    );
  }
}
