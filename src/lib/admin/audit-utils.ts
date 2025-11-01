import { createServerSupabaseClient } from '@/lib/supabase/server';

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
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from('admin_audit_logs').insert({
      admin_id: adminId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      changes: changes ?? null,
    });

    if (error) {
      console.error('Failed to create admin audit log', error);
    }
  } catch (error) {
    console.error('Unexpected error while creating admin audit log', error);
  }
}

export async function getAuditLogs(
  filters?: {
    adminId?: string;
    entityType?: string;
    entityId?: string;
  },
  limit: number = AUDIT_LOGS_PER_PAGE,
): Promise<AdminAuditLog[]> {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from('admin_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (filters?.adminId) {
    query = query.eq('admin_id', filters.adminId);
  }

  if (filters?.entityType) {
    query = query.eq('entity_type', filters.entityType);
  }

  if (filters?.entityId) {
    query = query.eq('entity_id', filters.entityId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch admin audit logs', error);
    return [];
  }

  return (data ?? []) as AdminAuditLog[];
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
