import { pgTable, uuid, text, integer, numeric, boolean, timestamp, jsonb, uniqueIndex, index, pgEnum, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';

export const cartStatusEnum = pgEnum('cart_status', ['active', 'converted', 'abandoned']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']);
export const paymentMethodEnum = pgEnum('payment_method', ['cod', 'zaincash', 'fastpay', 'bank_transfer']);
export const notificationTypeEnum = pgEnum('notification_type', ['order_confirmation', 'shipping_update', 'stock_alert', 'special_offer']);
export const discountTypeEnum = pgEnum('discount_type', ['percentage', 'fixed']);
export const transactionTypeEnum = pgEnum('transaction_type', ['earned', 'redeemed', 'expired']);
export const referralStatusEnum = pgEnum('referral_status', ['pending', 'completed', 'rewarded']);
export const rewardTypeEnum = pgEnum('reward_type', ['points', 'discount']);
export const voteTypeEnum = pgEnum('vote_type', ['helpful', 'not_helpful']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  username: text('username').unique(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  phone: text('phone'),
  loyaltyPointsBalance: integer('loyalty_points_balance').default(0).notNull(),
  referralCode: text('referral_code').unique(),
  referredBy: uuid('referred_by').references((): any => profiles.id, { onDelete: 'set null' }),
  isAdmin: boolean('is_admin').default(false),
  emailOrderUpdates: boolean('email_order_updates').default(true),
  emailShippingUpdates: boolean('email_shipping_updates').default(true),
  emailStockAlerts: boolean('email_stock_alerts').default(true),
  emailMarketing: boolean('email_marketing').default(false),
  inappNotificationsEnabled: boolean('inapp_notifications_enabled').default(true),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => ({
  referralCodeIdx: index('idx_profiles_referral_code').on(table.referralCode).where(sql`${table.referralCode} is not null`),
  referredByIdx: index('idx_profiles_referred_by').on(table.referredBy).where(sql`${table.referredBy} is not null`),
  isAdminIdx: index('idx_profiles_is_admin').on(table.isAdmin).where(sql`${table.isAdmin} = true`),
}));

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  data: jsonb('data'),
  link: text('link'),
  readAt: timestamp('read_at', { withTimezone: true, mode: 'string' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_notifications_user_id').on(table.userId),
  userIdUnreadIdx: index('idx_notifications_user_id_unread').on(table.userId, table.readAt).where(sql`${table.readAt} is null`),
  userIdCreatedIdx: index('idx_notifications_user_id_created').on(table.userId, table.createdAt),
  typeIdx: index('idx_notifications_type').on(table.type),
}));

export const carts = pgTable('carts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: cartStatusEnum('status').default('active').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => ({
  uniqueActiveCart: uniqueIndex('unique_active_cart').on(table.userId, table.status).where(sql`${table.status} = 'active'`),
}));

export const cartItems = pgTable('cart_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  cartId: uuid('cart_id').notNull().references(() => carts.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull(),
  quantity: integer('quantity').default(1).notNull(),
  unitPrice: numeric('unit_price').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => ({
  uniqueCartProduct: uniqueIndex('unique_cart_product').on(table.cartId, table.productId),
  cartProductIdx: index('idx_cart_items_cart_product').on(table.cartId, table.productId),
}));

export const savedAddresses = pgTable('saved_addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  label: text('label'),
  recipientName: text('recipient_name').notNull(),
  phone: text('phone'),
  addressLine1: text('address_line1').notNull(),
  addressLine2: text('address_line2'),
  city: text('city').notNull(),
  governorate: text('governorate').notNull(),
  postalCode: text('postal_code'),
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => ({
  uniqueDefault: uniqueIndex('unique_default_address').on(table.userId).where(sql`${table.isDefault} = true`),
}));

export const savedCalculations = pgTable('saved_calculations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  calculatorType: text('calculator_type').notNull(),
  inputs: jsonb('inputs').notNull(),
  result: jsonb('result').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const wishlists = pgTable('wishlists', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => ({
  uniqueUserProduct: uniqueIndex('unique_wishlist_user_product').on(table.userId, table.productId),
  userIdIdx: index('idx_wishlists_user_id').on(table.userId),
  productIdIdx: index('idx_wishlists_product_id').on(table.productId),
}));

export const notifyMeRequests = pgTable('notify_me_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: text('product_id').notNull(),
  email: text('email'),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  notified: boolean('notified').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => ({
  productIdIdx: index('idx_notify_me_product_id').on(table.productId),
  notifiedIdx: index('idx_notify_me_notified').on(table.notified).where(sql`${table.notified} = false`),
  uniqueProductEmail: uniqueIndex('unique_notify_product_email').on(table.productId, table.email).where(sql`${table.email} is not null`),
  uniqueProductUser: uniqueIndex('unique_notify_product_user').on(table.productId, table.userId).where(sql`${table.userId} is not null`),
}));

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: text('product_id').notNull(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  title: text('title').notNull(),
  comment: text('comment').notNull(),
  images: jsonb('images').default(sql`'[]'::jsonb`).notNull(),
  isApproved: boolean('is_approved').default(false).notNull(),
  helpfulCount: integer('helpful_count').default(0).notNull(),
  notHelpfulCount: integer('not_helpful_count').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => ({
  uniqueUserProduct: uniqueIndex('unique_review_user_product').on(table.userId, table.productId),
  productIdIdx: index('idx_reviews_product_id').on(table.productId),
  userIdIdx: index('idx_reviews_user_id').on(table.userId),
  isApprovedIdx: index('idx_reviews_is_approved').on(table.isApproved).where(sql`${table.isApproved} = true`),
  createdAtIdx: index('idx_reviews_created_at').on(table.createdAt),
}));

export const helpfulVotes = pgTable('helpful_votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  reviewId: uuid('review_id').notNull().references(() => reviews.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  voteType: voteTypeEnum('vote_type').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => ({
  uniqueUserReview: uniqueIndex('unique_vote_user_review').on(table.userId, table.reviewId),
  reviewIdIdx: index('idx_helpful_votes_review_id').on(table.reviewId),
  userIdIdx: index('idx_helpful_votes_user_id').on(table.userId),
}));

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNumber: text('order_number').unique().notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  guestEmail: text('guest_email'),
  shippingAddressId: uuid('shipping_address_id').references(() => savedAddresses.id, { onDelete: 'set null' }),
  shippingAddress: jsonb('shipping_address').notNull(),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  status: orderStatusEnum('status').default('pending').notNull(),
  subtotal: numeric('subtotal').notNull(),
  shippingCost: numeric('shipping_cost').default('0').notNull(),
  discount: numeric('discount').default('0').notNull(),
  loyaltyDiscount: numeric('loyalty_discount').default('0').notNull(),
  loyaltyPointsUsed: integer('loyalty_points_used').default(0).notNull(),
  total: numeric('total').notNull(),
  couponCode: text('coupon_code'),
  notes: text('notes'),
  trackingNumber: text('tracking_number'),
  carrier: text('carrier'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_orders_user_id').on(table.userId),
  orderNumberIdx: index('idx_orders_order_number').on(table.orderNumber),
  statusIdx: index('idx_orders_status').on(table.status),
  createdAtIdx: index('idx_orders_created_at').on(table.createdAt),
}));

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull(),
  productSnapshot: jsonb('product_snapshot').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: numeric('unit_price').notNull(),
  subtotal: numeric('subtotal').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => ({
  orderIdIdx: index('idx_order_items_order_id').on(table.orderId),
}));

export const coupons = pgTable('coupons', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').unique().notNull(),
  discountType: discountTypeEnum('discount_type').notNull(),
  discountValue: numeric('discount_value').notNull(),
  minOrderValue: numeric('min_order_value'),
  maxDiscount: numeric('max_discount'),
  expiryDate: timestamp('expiry_date', { withTimezone: true, mode: 'string' }),
  usageLimit: integer('usage_limit'),
  usedCount: integer('used_count').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => ({
  codeIdx: index('idx_coupons_code').on(table.code).where(sql`${table.isActive} = true`),
}));

export const shippingRates = pgTable('shipping_rates', {
  id: uuid('id').primaryKey().defaultRandom(),
  governorate: text('governorate').unique().notNull(),
  baseRate: numeric('base_rate').notNull(),
  freeShippingThreshold: numeric('free_shipping_threshold').default('100000').notNull(),
  estimatedDeliveryDays: integer('estimated_delivery_days').default(3).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const flashSales = pgTable('flash_sales', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: text('product_id').notNull(),
  flashPrice: numeric('flash_price').notNull(),
  originalPrice: numeric('original_price').notNull(),
  stockLimit: integer('stock_limit').notNull(),
  stockSold: integer('stock_sold').default(0).notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true, mode: 'string' }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true, mode: 'string' }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => ({
  productIdIdx: index('idx_flash_sales_product_id').on(table.productId),
  activeIdx: index('idx_flash_sales_active').on(table.isActive).where(sql`${table.isActive} = true`),
  datesIdx: index('idx_flash_sales_dates').on(table.startsAt, table.endsAt),
}));

export const bundles = pgTable('bundles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  productIds: jsonb('product_ids').notNull(),
  discountType: discountTypeEnum('discount_type').notNull(),
  discountValue: numeric('discount_value').notNull(),
  bundlePrice: numeric('bundle_price').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true, mode: 'string' }),
  endsAt: timestamp('ends_at', { withTimezone: true, mode: 'string' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => ({
  activeIdx: index('idx_bundles_active').on(table.isActive).where(sql`${table.isActive} = true`),
  datesIdx: index('idx_bundles_dates').on(table.startsAt, table.endsAt),
}));

export const loyaltyPoints = pgTable('loyalty_points', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  transactionType: transactionTypeEnum('transaction_type').notNull(),
  points: integer('points').notNull(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_loyalty_points_user_id').on(table.userId),
  typeIdx: index('idx_loyalty_points_type').on(table.transactionType),
  createdIdx: index('idx_loyalty_points_created').on(table.createdAt),
  orderIdIdx: index('idx_loyalty_points_order_id').on(table.orderId).where(sql`${table.orderId} is not null`),
}));

export const referrals = pgTable('referrals', {
  id: uuid('id').primaryKey().defaultRandom(),
  referrerId: uuid('referrer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  refereeId: uuid('referee_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  referralCode: text('referral_code').notNull(),
  status: referralStatusEnum('status').default('pending').notNull(),
  rewardType: rewardTypeEnum('reward_type').default('points').notNull(),
  rewardValue: numeric('reward_value').notNull(),
  refereeFirstOrderId: uuid('referee_first_order_id').references(() => orders.id, { onDelete: 'set null' }),
  rewardedAt: timestamp('rewarded_at', { withTimezone: true, mode: 'string' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => ({
  referrerIdIdx: index('idx_referrals_referrer_id').on(table.referrerId),
  refereeIdIdx: index('idx_referrals_referee_id').on(table.refereeId),
  codeIdx: index('idx_referrals_code').on(table.referralCode),
  statusIdx: index('idx_referrals_status').on(table.status),
}));

export const newsletterSubscribers = pgTable('newsletter_subscribers', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  subscribedAt: timestamp('subscribed_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true, mode: 'string' }),
  preferences: jsonb('preferences').default(sql`'{}'::jsonb`),
  unsubscribeToken: text('unsubscribe_token').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('idx_newsletter_email').on(table.email),
  userIdIdx: index('idx_newsletter_user_id').on(table.userId).where(sql`${table.userId} is not null`),
  subscribedIdx: index('idx_newsletter_subscribed').on(table.subscribedAt).where(sql`${table.unsubscribedAt} is null`),
}));

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  slug: text('slug').unique().notNull(),
  name: text('name').notNull(),
  brand: text('brand').notNull(),
  category: text('category').notNull(),
  subcategory: text('subcategory').notNull(),
  description: text('description').notNull(),
  price: numeric('price').notNull(),
  originalPrice: numeric('original_price'),
  currency: text('currency').default('IQD').notNull(),
  images: jsonb('images').default(sql`'[]'::jsonb`).notNull(),
  thumbnail: text('thumbnail').notNull(),
  rating: numeric('rating').default('0').notNull(),
  reviewCount: integer('review_count').default(0).notNull(),
  stock: integer('stock').default(0).notNull(),
  lowStockThreshold: integer('low_stock_threshold').default(5).notNull(),
  isNew: boolean('is_new').default(false).notNull(),
  isBestSeller: boolean('is_best_seller').default(false).notNull(),
  specifications: jsonb('specifications').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => ({
  categoryIdx: index('idx_products_category').on(table.category),
  brandIdx: index('idx_products_brand').on(table.brand),
  stockIdx: index('idx_products_stock').on(table.stock),
  isNewIdx: index('idx_products_is_new').on(table.isNew).where(sql`${table.isNew} = true`),
  isBestSellerIdx: index('idx_products_is_best_seller').on(table.isBestSeller).where(sql`${table.isBestSeller} = true`),
}));

export const adminAuditLogs = pgTable('admin_audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  adminId: uuid('admin_id').notNull().references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  changes: jsonb('changes'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => ({
  adminIdIdx: index('idx_audit_logs_admin_id').on(table.adminId),
  entityIdx: index('idx_audit_logs_entity').on(table.entityType, table.entityId),
  createdAtIdx: index('idx_audit_logs_created_at').on(table.createdAt),
}));

export const gallerySetups = pgTable('gallery_setups', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  tankSize: integer('tank_size').notNull(),
  style: text('style').notNull(),
  mediaUrls: jsonb('media_urls').default(sql`'[]'::jsonb`).notNull(),
  hotspots: jsonb('hotspots').default(sql`'[]'::jsonb`).notNull(),
  isApproved: boolean('is_approved').default(false).notNull(),
  featured: boolean('featured').default(false).notNull(),
  viewCount: integer('view_count').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_gallery_setups_user_id').on(table.userId),
  isApprovedIdx: index('idx_gallery_setups_is_approved').on(table.isApproved),
  styleIdx: index('idx_gallery_setups_style').on(table.style),
  tankSizeIdx: index('idx_gallery_setups_tank_size').on(table.tankSize),
  featuredIdx: index('idx_gallery_setups_featured').on(table.featured).where(sql`${table.featured} = true`),
  createdAtIdx: index('idx_gallery_setups_created_at').on(table.createdAt),
}));

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => ({
  tokenIdx: index('idx_sessions_token').on(table.token),
  userIdIdx: index('idx_sessions_user_id').on(table.userId),
}));
