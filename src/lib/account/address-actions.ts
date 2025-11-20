'use server';

import { db } from '@server/db';
import { savedAddresses as savedAddressesTable } from '@shared/schema';
import { getUser } from '@/lib/auth/utils';
import type { SavedAddress } from '@/types';
import { and, desc, eq } from 'drizzle-orm';

interface AddressInput {
  label?: string | null;
  recipient_name: string;
  phone?: string | null;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  governorate: string;
  postal_code?: string | null;
  is_default: boolean;
}

function mapRowToSavedAddress(row: typeof savedAddressesTable.$inferSelect): SavedAddress {
  return {
    id: row.id,
    user_id: row.userId,
    label: row.label ?? null,
    recipient_name: row.recipientName,
    phone: row.phone ?? null,
    address_line1: row.addressLine1,
    address_line2: row.addressLine2 ?? null,
    city: row.city,
    governorate: row.governorate,
    postal_code: row.postalCode ?? null,
    is_default: row.isDefault ?? false,
    created_at:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : row.createdAt ?? new Date().toISOString(),
    updated_at:
      row.updatedAt instanceof Date
        ? row.updatedAt.toISOString()
        : row.updatedAt ?? new Date().toISOString(),
  };
}

function normalizeInput(values: AddressInput) {
  return {
    label: values.label ?? null,
    recipientName: values.recipient_name,
    phone: values.phone ?? null,
    addressLine1: values.address_line1,
    addressLine2: values.address_line2 ?? null,
    city: values.city,
    governorate: values.governorate,
    postalCode: values.postal_code ?? null,
    isDefault: values.is_default ?? false,
  };
}

export async function listAddressesAction(): Promise<SavedAddress[]> {
  const user = await getUser();

  if (!user) {
    return [];
  }

  const rows = await db
    .select()
    .from(savedAddressesTable)
    .where(eq(savedAddressesTable.userId, user.id))
    .orderBy(desc(savedAddressesTable.isDefault), desc(savedAddressesTable.createdAt));

  return rows.map(mapRowToSavedAddress);
}

export async function saveAddressAction(
  values: AddressInput,
  addressId?: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getUser();

  if (!user) {
    return { success: false, error: 'auth.errors.unauthenticated' };
  }

  const normalized = normalizeInput(values);

  try {
    if (normalized.isDefault) {
      await db
        .update(savedAddressesTable)
        .set({ isDefault: false })
        .where(eq(savedAddressesTable.userId, user.id));
    }

    if (addressId) {
      await db
        .update(savedAddressesTable)
        .set(normalized)
        .where(
          and(
            eq(savedAddressesTable.id, addressId),
            eq(savedAddressesTable.userId, user.id),
          ),
        );
    } else {
      await db.insert(savedAddressesTable).values({
        ...normalized,
        userId: user.id,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to save address', error);
    return { success: false, error: 'account.addresses.saveError' };
  }
}

export async function deleteAddressAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getUser();

  if (!user) {
    return { success: false, error: 'auth.errors.unauthenticated' };
  }

  try {
    await db
      .delete(savedAddressesTable)
      .where(
        and(
          eq(savedAddressesTable.id, id),
          eq(savedAddressesTable.userId, user.id),
        ),
      );

    return { success: true };
  } catch (error) {
    console.error('Failed to delete address', error);
    return { success: false, error: 'account.addresses.deleteError' };
  }
}

export async function setDefaultAddressAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getUser();

  if (!user) {
    return { success: false, error: 'auth.errors.unauthenticated' };
  }

  try {
    await db
      .update(savedAddressesTable)
      .set({ isDefault: false })
      .where(eq(savedAddressesTable.userId, user.id));

    await db
      .update(savedAddressesTable)
      .set({ isDefault: true })
      .where(
        and(
          eq(savedAddressesTable.id, id),
          eq(savedAddressesTable.userId, user.id),
        ),
      );

    return { success: true };
  } catch (error) {
    console.error('Failed to set default address', error);
    return { success: false, error: 'account.addresses.saveError' };
  }
}

