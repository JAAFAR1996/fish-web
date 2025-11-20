"use server";

import { revalidatePath } from 'next/cache';

import { db } from '@server/db';
import { gallerySetups } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

import { routing } from '@/i18n/routing';
import { requireAdmin, requireUser } from '@/lib/auth/utils';
import { createAuditLog } from '@/lib/admin/audit-utils';
import { AUDIT_ACTIONS, ENTITY_TYPES } from '@/lib/admin/constants';
import { deleteGalleryImages } from './image-upload';
import type { GalleryMedia, GalleryStyle, Hotspot } from '@/types';
import {
  GALLERY_STYLES,
  MAX_GALLERY_MEDIA,
  MAX_HOTSPOTS_PER_IMAGE,
  MIN_TITLE_LENGTH,
  MAX_TITLE_LENGTH,
  MIN_TANK_SIZE,
  MAX_TANK_SIZE,
} from './constants';

type GalleryInsert = typeof gallerySetups.$inferInsert;

function revalidateGallery() {
  routing.locales.forEach((locale) => {
    revalidatePath(`/${locale}/gallery`, 'page');
  });
}

export async function createSetupAction(
  payload: {
    title: string;
    description: string;
    tankSize: number;
    style: string;
    mediaUrls: Array<string | GalleryMedia>;
    hotspots: Hotspot[];
  },
): Promise<{ success: boolean; error?: string; id?: string }> {
  const user = await requireUser();

  const title = (payload.title ?? '').trim();
  if (title.length < MIN_TITLE_LENGTH || title.length > MAX_TITLE_LENGTH) {
    return { success: false, error: 'gallery.validation.titleRequired' };
  }
  if (payload.tankSize < MIN_TANK_SIZE || payload.tankSize > MAX_TANK_SIZE) {
    return { success: false, error: 'gallery.validation.tankSizeRequired' };
  }
  if (!GALLERY_STYLES.includes(payload.style as GalleryStyle)) {
    return { success: false, error: 'gallery.validation.styleRequired' };
  }
  if (!Array.isArray(payload.mediaUrls) || payload.mediaUrls.length < 1) {
    return { success: false, error: 'gallery.validation.mediaRequired' };
  }
  if (payload.mediaUrls.length > MAX_GALLERY_MEDIA) {
    return { success: false, error: 'gallery.validation.maxMedia' };
  }
  if (Array.isArray(payload.hotspots) && payload.hotspots.length > MAX_HOTSPOTS_PER_IMAGE) {
    return { success: false, error: 'gallery.validation.maxHotspots' };
  }

  const insertValues = {
    userId: user.id,
    title: payload.title.trim(),
    description: payload.description?.trim() || null,
    tankSize: payload.tankSize,
    style: payload.style,
    mediaUrls: payload.mediaUrls,
    hotspots: payload.hotspots,
    isApproved: false,
    featured: false,
  };

  try {
    const [created] = await db
      .insert(gallerySetups)
      .values(insertValues)
      .returning({ id: gallerySetups.id });

    if (!created) {
      return { success: false, error: 'gallery.errors.createFailed' };
    }

    try {
      await createAuditLog(
        user.id,
        AUDIT_ACTIONS.GALLERY_SETUP_CREATED,
        ENTITY_TYPES.GALLERY_SETUP,
        created.id,
        {
          after: {
            user_id: insertValues.userId,
            title: insertValues.title,
            description: insertValues.description,
            tank_size: insertValues.tankSize,
            style: insertValues.style,
            media_urls: insertValues.mediaUrls,
            hotspots: insertValues.hotspots,
            is_approved: insertValues.isApproved,
            featured: insertValues.featured,
          },
        },
      );
    } catch {
      // Audit logging failure should not block creation
    }

    revalidateGallery();
    return { success: true, id: created.id };
  } catch (error) {
    console.error('Failed to create gallery setup', error);
    return { success: false, error: 'gallery.errors.createFailed' };
  }
}

export async function updateSetupAction(
  id: string,
  payload: Partial<{
    title: string;
    description: string;
    tankSize: number;
    style: string;
    mediaUrls: Array<string | GalleryMedia>;
    hotspots: Hotspot[];
  }>,
): Promise<{ success: boolean; error?: string }> {
  const user = await requireUser();

  try {
    const [existing] = await db
      .select({ userId: gallerySetups.userId })
      .from(gallerySetups)
      .where(eq(gallerySetups.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'gallery.errors.notFound' };
    }

    if (existing.userId !== user.id) {
      return { success: false, error: 'auth.errors.unauthenticated' };
    }

    // Validate provided fields
    if (payload.title !== undefined) {
      const title = payload.title.trim();
      if (title.length < MIN_TITLE_LENGTH || title.length > MAX_TITLE_LENGTH) {
        return { success: false, error: 'gallery.validation.titleRequired' };
      }
    }

    if (payload.tankSize !== undefined) {
      if (payload.tankSize < MIN_TANK_SIZE || payload.tankSize > MAX_TANK_SIZE) {
        return { success: false, error: 'gallery.validation.tankSizeRequired' };
      }
    }

    if (payload.style !== undefined) {
      if (!GALLERY_STYLES.includes(payload.style as GalleryStyle)) {
        return { success: false, error: 'gallery.validation.styleRequired' };
      }
    }

    if (payload.mediaUrls !== undefined) {
      if (!Array.isArray(payload.mediaUrls) || payload.mediaUrls.length < 1) {
        return { success: false, error: 'gallery.validation.mediaRequired' };
      }
      if (payload.mediaUrls.length > MAX_GALLERY_MEDIA) {
        return { success: false, error: 'gallery.validation.maxMedia' };
      }
    }

    if (payload.hotspots !== undefined) {
      if (Array.isArray(payload.hotspots) && payload.hotspots.length > MAX_HOTSPOTS_PER_IMAGE) {
        return { success: false, error: 'gallery.validation.maxHotspots' };
      }
    }

    const updates: Partial<GalleryInsert> = {};
    if (payload.title !== undefined) updates.title = payload.title.trim();
    if (payload.description !== undefined) {
      updates.description = payload.description?.trim() || null;
    }
    if (payload.tankSize !== undefined) updates.tankSize = payload.tankSize;
    if (payload.style !== undefined) updates.style = payload.style;
    if (payload.hotspots !== undefined) updates.hotspots = payload.hotspots;
    if (payload.mediaUrls !== undefined) updates.mediaUrls = payload.mediaUrls;

    if (Object.keys(updates).length === 0) {
      return { success: true };
    }

    await db
      .update(gallerySetups)
      .set(updates)
      .where(eq(gallerySetups.id, id));

    revalidateGallery();
    return { success: true };
  } catch (error) {
    console.error('Failed to update gallery setup', error);
    return { success: false, error: 'gallery.errors.updateFailed' };
  }
}

export async function deleteSetupAction(
  id: string,
  imageUrls: string[],
): Promise<{ success: boolean; error?: string }> {
  const user = await requireUser();

  try {
    const [existing] = await db
      .select({ userId: gallerySetups.userId })
      .from(gallerySetups)
      .where(eq(gallerySetups.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'gallery.errors.notFound' };
    }

    if (existing.userId !== user.id) {
      return { success: false, error: 'auth.errors.unauthenticated' };
    }

    if (Array.isArray(imageUrls) && imageUrls.length) {
      await deleteGalleryImages(imageUrls);
    }

    await db
      .delete(gallerySetups)
      .where(eq(gallerySetups.id, id));

    revalidateGallery();
    return { success: true };
  } catch (error) {
    console.error('Failed to delete gallery setup', error);
    return { success: false, error: 'gallery.errors.deleteFailed' };
  }
}

export async function incrementViewCountAction(id: string): Promise<void> {
  try {
    await db
      .update(gallerySetups)
      .set({ viewCount: sql`${gallerySetups.viewCount} + 1` })
      .where(eq(gallerySetups.id, id));
  } catch (error) {
    console.error('Failed to increment gallery view count', error);
  }
}

export async function approveSetupAction(
  id: string,
  approved: boolean,
): Promise<{ success: boolean; error?: string }> {
  const admin = await requireAdmin();

  try {
    await db
      .update(gallerySetups)
      .set({ isApproved: approved })
      .where(eq(gallerySetups.id, id));

    try {
      await createAuditLog(
        admin.id,
        AUDIT_ACTIONS.GALLERY_SETUP_APPROVED,
        ENTITY_TYPES.GALLERY_SETUP,
        id,
        { approved },
      );
    } catch {
      // Ignore audit failures
    }

    revalidateGallery();
    return { success: true };
  } catch (error) {
    console.error('Failed to update gallery approval status', error);
    return { success: false, error: 'gallery.errors.updateFailed' };
  }
}

export async function featureSetupAction(
  id: string,
  featured: boolean,
): Promise<{ success: boolean; error?: string }> {
  const admin = await requireAdmin();

  try {
    await db
      .update(gallerySetups)
      .set({ featured })
      .where(eq(gallerySetups.id, id));

    try {
      await createAuditLog(
        admin.id,
        AUDIT_ACTIONS.GALLERY_SETUP_FEATURED,
        ENTITY_TYPES.GALLERY_SETUP,
        id,
        { featured },
      );
    } catch {
      // Ignore audit failures
    }

    revalidateGallery();
    return { success: true };
  } catch (error) {
    console.error('Failed to update gallery featured status', error);
    return { success: false, error: 'gallery.errors.updateFailed' };
  }
}
