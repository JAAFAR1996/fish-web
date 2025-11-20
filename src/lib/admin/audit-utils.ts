import { and, desc, eq } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { db } from '@server/db';
import { adminAuditLogs } from '@shared/schema';

import type { AdminAuditLog, Locale } from '@/types';

import { AUDIT_LOGS_PER_PAGE } from './constants';

const ACTION_LABELS: Record<
  string,
  { en: string; ar: string }
> = {
  product_created: {
    en: 'Created product',
    ar: 'تم إنشاء منتج',
  },
  product_updated: {
    en: 'Updated product',
    ar: 'تم تحديث منتج',
  },
  product_deleted: {
    en: 'Deleted product',
    ar: 'تم حذف منتج',
  },
  gallery_setup_created: {
    en: 'Created gallery setup',
    ar: 'تم إنشاء إعداد معرض',
  },
  gallery_setup_approved: {
    en: 'Approved gallery setup',
    ar: 'تمت الموافقة على إعداد المعرض',
  },
  gallery_setup_featured: {
    en: 'Featured gallery setup',
    ar: 'تم تمييز إعداد المعرض',
  },
  order_updated: {
    en: 'Updated order',
    ar: 'تم تحديث طلب',
  },
  review_approved: {
    en: 'Approved review',
    ar: 'تمت الموافقة على مراجعة',
  },
  review_rejected: {
    en: 'Rejected review',
    ar: 'تم رفض مراجعة',
  },
  stock_updated: {
    en: 'Updated stock',
    ar: 'تم تحديث المخزون',
  },
};

const ENTITY_LABELS: Record<
  string,
  { en: string; ar: string }
> = {
  product: {
    en: 'product',
    ar: 'منتج',
  },
  order: {
    en: 'order',
    ar: 'طلب',
  },
  review: {
    en: 'review',
    ar: 'مراجعة',
  },
  user: {
    en: 'user',
    ar: 'مستخدم',
  },
  flash_sale: {
    en: 'flash sale',
    ar: 'عرض فلاش',
  },
  bundle: {
    en: 'bundle',
    ar: 'حزمة',
  },
  coupon: {
    en: 'coupon',
    ar: 'قسيمة',
  },
  gallery_setup: {
    en: 'gallery setup',
    ar: 'إعداد معرض',
  },
};

export async function createAuditLog(
  adminId: string,
  action: string,
  entityType: string,
  entityId: string,
  changes?: Record<string, unknown>,
): Promise<void> {
  try {
    await db.insert(adminAuditLogs).values({
      adminId,
      action,
      entityType,
      entityId,
      changes: changes ?? null,
    });
  } catch (error) {
    console.error('Unexpected error while creating admin audit log', error);
  }
}

function transformAuditLog(row: typeof adminAuditLogs.$inferSelect): AdminAuditLog {
  return {
    id: row.id,
    admin_id: row.adminId,
    action: row.action,
    entity_type: row.entityType,
    entity_id: row.entityId,
    changes: (row.changes ?? {}) as Record<string, unknown>,
    created_at:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt ?? '',
  };
}

export async function getAuditLogs(
  filters?: {
    adminId?: string;
    entityType?: string;
    entityId?: string;
  },
  limit: number = AUDIT_LOGS_PER_PAGE,
): Promise<AdminAuditLog[]> {
  try {
    let query = db
      .select()
      .from(adminAuditLogs)
      .orderBy(desc(adminAuditLogs.createdAt))
      .limit(limit)
      .$dynamic();

    const conditions: SQL[] = [];

    if (filters?.adminId) {
      conditions.push(eq(adminAuditLogs.adminId, filters.adminId));
    }

    if (filters?.entityType) {
      conditions.push(eq(adminAuditLogs.entityType, filters.entityType));
    }

    if (filters?.entityId) {
      conditions.push(eq(adminAuditLogs.entityId, filters.entityId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const rows = await query;
    return rows.map(transformAuditLog);
  } catch (error) {
    console.error('Failed to fetch admin audit logs', error);
    return [];
  }
}

export function formatAuditLogMessage(log: AdminAuditLog, locale: Locale): string {
  const actionLabel =
    ACTION_LABELS[log.action]?.[locale] ?? ACTION_LABELS[log.action]?.en ?? log.action;
  const entityLabel =
    ENTITY_LABELS[log.entity_type]?.[locale] ??
    ENTITY_LABELS[log.entity_type]?.en ??
    log.entity_type;

  return `${actionLabel} ${entityLabel} #${log.entity_id}`;
}
