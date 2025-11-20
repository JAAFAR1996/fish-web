import { db } from '@server/db';
import { gallerySetups, profiles } from '@shared/schema';
import {
  and,
  desc,
  eq,
  gte,
  lte,
  sql,
} from 'drizzle-orm';

import { TANK_SIZE_RANGES } from './constants';
import type {
  GalleryFilters,
  GallerySetup,
  GallerySetupWithProducts,
  GallerySetupWithUser,
  Product,
} from '@/types';

const toIsoString = (value: Date | string | null | undefined): string =>
  value instanceof Date ? value.toISOString() : value ?? new Date(0).toISOString();

type GallerySetupRow = typeof gallerySetups.$inferSelect;
type ProfileRow = typeof profiles.$inferSelect | null;

function transformSetup(row: GallerySetupRow): GallerySetup {
  return {
    id: row.id,
    user_id: row.userId,
    title: row.title,
    description: row.description ?? null,
    tank_size: row.tankSize,
    style: row.style as GallerySetup['style'],
    media_urls: (row.mediaUrls as GallerySetup['media_urls']) ?? [],
    hotspots: (row.hotspots as GallerySetup['hotspots']) ?? [],
    is_approved: row.isApproved,
    featured: row.featured,
    view_count: row.viewCount,
    created_at: toIsoString(row.createdAt),
    updated_at: toIsoString(row.updatedAt),
  };
}

function transformUser(profile: ProfileRow): GallerySetupWithUser['user'] | null {
  if (!profile) {
    return null;
    }

  return {
    id: profile.id,
    full_name: profile.fullName ?? null,
    avatar_url: profile.avatarUrl ?? null,
  };
}

function attachUser(
  setup: GallerySetup,
  profile: ProfileRow,
): GallerySetupWithUser {
  return {
    ...setup,
    user: transformUser(profile),
  };
}

export async function getGallerySetups(options?: {
  isApproved?: boolean;
  style?: string;
  tankSizeRange?: keyof typeof TANK_SIZE_RANGES | 'all';
  userId?: string;
  limit?: number;
  offset?: number;
}): Promise<GallerySetupWithUser[]> {
  try {
    const conditions: Array<ReturnType<typeof eq> | ReturnType<typeof gte> | ReturnType<typeof lte> | ReturnType<typeof sql>> = [];

    if (options?.isApproved !== undefined) {
      conditions.push(eq(gallerySetups.isApproved, options.isApproved));
    } else {
      conditions.push(eq(gallerySetups.isApproved, true));
    }

    if (options?.style) {
      conditions.push(eq(gallerySetups.style, options.style));
    }

    if (options?.tankSizeRange && options.tankSizeRange !== 'all') {
      const { min, max } = TANK_SIZE_RANGES[options.tankSizeRange];
      conditions.push(gte(gallerySetups.tankSize, min));
      conditions.push(lte(gallerySetups.tankSize, max));
    }

    if (options?.userId) {
      conditions.push(eq(gallerySetups.userId, options.userId));
    }

    let baseQuery = db
      .select({
        setup: gallerySetups,
        user: profiles,
      })
      .from(gallerySetups)
      .leftJoin(profiles, eq(gallerySetups.userId, profiles.id))
      .where(and(...conditions))
      .orderBy(desc(gallerySetups.createdAt))
      .$dynamic();

    if (typeof options?.limit === 'number') {
      baseQuery = baseQuery.limit(options.limit);
    }
    if (typeof options?.offset === 'number') {
      baseQuery = baseQuery.offset(options.offset);
    }

    const rows = await baseQuery;

    return rows.map(({ setup, user }) =>
      attachUser(transformSetup(setup), user),
    );
  } catch (error) {
    console.error('Failed to fetch gallery setups', error);
    return [];
  }
}

export async function getSetupById(id: string): Promise<GallerySetupWithUser | null> {
  try {
    const [row] = await db
      .select({
        setup: gallerySetups,
        user: profiles,
      })
      .from(gallerySetups)
      .leftJoin(profiles, eq(gallerySetups.userId, profiles.id))
      .where(eq(gallerySetups.id, id))
      .limit(1);

    if (!row) {
      return null;
    }

    return attachUser(transformSetup(row.setup), row.user);
  } catch (error) {
    console.error('Failed to fetch gallery setup by id', error);
    return null;
  }
}

export async function getUserSetups(userId: string): Promise<GallerySetupWithUser[]> {
  return getGallerySetups({ userId, isApproved: undefined });
}

export async function getFeaturedSetups(limit = 8): Promise<GallerySetupWithUser[]> {
  try {
    const rows = await db
      .select({
        setup: gallerySetups,
        user: profiles,
      })
      .from(gallerySetups)
      .leftJoin(profiles, eq(gallerySetups.userId, profiles.id))
      .where(
        and(
          eq(gallerySetups.isApproved, true),
          eq(gallerySetups.featured, true),
        ),
      )
      .orderBy(desc(gallerySetups.viewCount))
      .limit(limit);

    return rows.map(({ setup, user }) =>
      attachUser(transformSetup(setup), user),
    );
  } catch (error) {
    console.error('Failed to fetch featured setups', error);
    return [];
  }
}

export async function getRelatedSetups(
  setup: GallerySetup,
  limit = 4,
): Promise<GallerySetupWithUser[]> {
  try {
    const conditions: Array<ReturnType<typeof eq> | ReturnType<typeof sql>> = [
      eq(gallerySetups.isApproved, true),
      sql`${gallerySetups.id} != ${setup.id}`,
    ];

    if (setup.style) {
      conditions.push(eq(gallerySetups.style, setup.style));
    }

    const rows = await db
      .select({
        setup: gallerySetups,
        user: profiles,
      })
      .from(gallerySetups)
      .leftJoin(profiles, eq(gallerySetups.userId, profiles.id))
      .where(and(...conditions))
      .orderBy(desc(gallerySetups.createdAt))
      .limit(limit);

    return rows.map(({ setup, user }) =>
      attachUser(transformSetup(setup), user),
    );
  } catch (error) {
    console.error('Failed to fetch related setups', error);
    return [];
  }
}

export async function getGalleryStats(): Promise<{
  total: number;
  approved: number;
  featured: number;
}> {
  try {
    const [totalResult, approvedResult, featuredResult] = await Promise.all([
      db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(gallerySetups),
      db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(gallerySetups)
        .where(eq(gallerySetups.isApproved, true)),
      db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(gallerySetups)
        .where(eq(gallerySetups.featured, true)),
    ]);

    return {
      total: totalResult[0]?.count ?? 0,
      approved: approvedResult[0]?.count ?? 0,
      featured: featuredResult[0]?.count ?? 0,
    };
  } catch (error) {
    console.error('Failed to fetch gallery stats', error);
    return {
      total: 0,
      approved: 0,
      featured: 0,
    };
  }
}
