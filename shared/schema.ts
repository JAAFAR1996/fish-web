import { pgTable, text, uuid, timestamp, integer, numeric, boolean, jsonb, uniqueIndex, index, unique, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  emailVerified: boolean('email_verified').notNull().default(false),
  verificationToken: text('verification_token'),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_sessions_user_id').on(table.userId),
  tokenIdx: index('idx_sessions_token').on(table.token),
  expiresAtIdx: index('idx_sessions_expires_at').on(table.expiresAt),
}));

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  used: boolean('used').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_password_reset_tokens_user_id').on(table.userId),
  tokenIdx: index('idx_password_reset_tokens_token').on(table.token),
  expiresAtIdx: index('idx_password_reset_tokens_expires_at').on(table.expiresAt),
}));

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  username: text('username').unique(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  phone: text('phone'),
  loyaltyPointsBalance: integer('loyalty_points_balance').notNull().default(0),
  referralCode: text('referral_code').unique(),
  referredBy: uuid('referred_by').references((): any => profiles.id, { onDelete: 'set null' }),
  isAdmin: boolean('is_admin').default(false),
  emailOrderUpdates: boolean('email_order_updates').default(true),
  emailShippingUpdates: boolean('email_shipping_updates').default(true),
  emailStockAlerts: boolean('email_stock_alerts').default(true),
  emailMarketing: boolean('email_marketing').default(false),
  inappNotificationsEnabled: boolean('inapp_notifications_enabled').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  referralCodeIdx: index('idx_profiles_referral_code').on(table.referralCode).where(sql`${table.referralCode} IS NOT NULL`),
  referredByIdx: index('idx_profiles_referred_by').on(table.referredBy).where(sql`${table.referredBy} IS NOT NULL`),
  isAdminIdx: index('idx_profiles_is_admin').on(table.isAdmin).where(sql`${table.isAdmin} = true`),
}));

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  data: jsonb('data'),
  link: text('link'),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_notifications_user_id').on(table.userId),
  userIdUnreadIdx: index('idx_notifications_user_id_unread').on(table.userId, table.readAt).where(sql`${table.readAt} IS NULL`),
  userIdCreatedIdx: index('idx_notifications_user_id_created').on(table.userId, table.createdAt),
  typeIdx: index('idx_notifications_type').on(table.type),
}));

export const carts = pgTable('carts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const cartItems = pgTable('cart_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  cartId: uuid('cart_id').notNull().references(() => carts.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull(),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: numeric('unit_price').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueCartProduct: unique('unique_cart_product').on(table.cartId, table.productId),
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
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const savedCalculations = pgTable('saved_calculations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  calculatorType: text('calculator_type').notNull(),
  inputs: jsonb('inputs').notNull(),
  result: jsonb('result').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const wishlists = pgTable('wishlists', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueUserProduct: unique('unique_user_product').on(table.userId, table.productId),
  userIdIdx: index('idx_wishlists_user_id').on(table.userId),
  productIdIdx: index('idx_wishlists_product_id').on(table.productId),
}));

export const notifyMeRequests = pgTable('notify_me_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: text('product_id').notNull(),
  email: text('email'),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  notified: boolean('notified').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  productIdIdx: index('idx_notify_me_product_id').on(table.productId),
  notifiedIdx: index('idx_notify_me_notified').on(table.notified).where(sql`${table.notified} = false`),
  productEmailIdx: uniqueIndex('idx_notify_me_product_email').on(table.productId, table.email).where(sql`${table.email} IS NOT NULL`),
  productUserIdx: uniqueIndex('idx_notify_me_product_user').on(table.productId, table.userId).where(sql`${table.userId} IS NOT NULL`),
}));

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: text('product_id').notNull(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  title: text('title').notNull(),
  comment: text('comment').notNull(),
  images: jsonb('images').notNull().default(sql`'[]'::jsonb`),
  isApproved: boolean('is_approved').notNull().default(false),
  helpfulCount: integer('helpful_count').notNull().default(0),
  notHelpfulCount: integer('not_helpful_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueUserProduct: unique('unique_review_user_product').on(table.userId, table.productId),
  productIdIdx: index('idx_reviews_product_id').on(table.productId),
  userIdIdx: index('idx_reviews_user_id').on(table.userId),
  isApprovedIdx: index('idx_reviews_is_approved').on(table.isApproved).where(sql`${table.isApproved} = true`),
  createdAtIdx: index('idx_reviews_created_at').on(table.createdAt),
}));

export const helpfulVotes = pgTable('helpful_votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  reviewId: uuid('review_id').notNull().references(() => reviews.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  voteType: text('vote_type').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueUserReview: unique('unique_user_review_vote').on(table.userId, table.reviewId),
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
  paymentMethod: text('payment_method').notNull(),
  status: text('status').notNull().default('pending'),
  subtotal: numeric('subtotal').notNull(),
  shippingCost: numeric('shipping_cost').notNull().default('0'),
  discount: numeric('discount').notNull().default('0'),
  loyaltyDiscount: numeric('loyalty_discount').notNull().default('0'),
  loyaltyPointsUsed: integer('loyalty_points_used').notNull().default(0),
  total: numeric('total').notNull(),
  couponCode: text('coupon_code'),
  notes: text('notes'),
  trackingNumber: text('tracking_number'),
  carrier: text('carrier'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
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
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  orderIdIdx: index('idx_order_items_order_id').on(table.orderId),
}));

export const coupons = pgTable('coupons', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').unique().notNull(),
  discountType: text('discount_type').notNull(),
  discountValue: numeric('discount_value').notNull(),
  minOrderValue: numeric('min_order_value'),
  maxDiscount: numeric('max_discount'),
  expiryDate: timestamp('expiry_date', { withTimezone: true }),
  usageLimit: integer('usage_limit'),
  usedCount: integer('used_count').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  codeIdx: index('idx_coupons_code').on(table.code).where(sql`${table.isActive} = true`),
}));

export const shippingRates = pgTable('shipping_rates', {
  id: uuid('id').primaryKey().defaultRandom(),
  governorate: text('governorate').unique().notNull(),
  baseRate: numeric('base_rate').notNull(),
  freeShippingThreshold: numeric('free_shipping_threshold').notNull().default('100000'),
  estimatedDeliveryDays: integer('estimated_delivery_days').notNull().default(3),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const flashSales = pgTable('flash_sales', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: text('product_id').notNull(),
  flashPrice: numeric('flash_price').notNull(),
  originalPrice: numeric('original_price').notNull(),
  stockLimit: integer('stock_limit').notNull(),
  stockSold: integer('stock_sold').notNull().default(0),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
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
  discountType: text('discount_type').notNull(),
  discountValue: numeric('discount_value').notNull(),
  bundlePrice: numeric('bundle_price').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  activeIdx: index('idx_bundles_active').on(table.isActive).where(sql`${table.isActive} = true`),
  datesIdx: index('idx_bundles_dates').on(table.startsAt, table.endsAt),
}));

export const loyaltyPoints = pgTable('loyalty_points', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  transactionType: text('transaction_type').notNull(),
  points: integer('points').notNull(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_loyalty_points_user_id').on(table.userId),
  typeIdx: index('idx_loyalty_points_type').on(table.transactionType),
  createdIdx: index('idx_loyalty_points_created').on(table.createdAt),
  orderIdIdx: index('idx_loyalty_points_order_id').on(table.orderId).where(sql`${table.orderId} IS NOT NULL`),
}));

export const referrals = pgTable('referrals', {
  id: uuid('id').primaryKey().defaultRandom(),
  referrerId: uuid('referrer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  refereeId: uuid('referee_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  referralCode: text('referral_code').notNull(),
  status: text('status').notNull().default('pending'),
  rewardType: text('reward_type').notNull().default('points'),
  rewardValue: numeric('reward_value').notNull(),
  refereeFirstOrderId: uuid('referee_first_order_id').references(() => orders.id, { onDelete: 'set null' }),
  rewardedAt: timestamp('rewarded_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
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
  subscribedAt: timestamp('subscribed_at', { withTimezone: true }).notNull().defaultNow(),
  unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
  preferences: jsonb('preferences').default(sql`'{}'::jsonb`),
  unsubscribeToken: text('unsubscribe_token').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  emailIdx: index('idx_newsletter_email').on(table.email),
  userIdIdx: index('idx_newsletter_user_id').on(table.userId).where(sql`${table.userId} IS NOT NULL`),
  subscribedIdx: index('idx_newsletter_subscribed').on(table.subscribedAt).where(sql`${table.unsubscribedAt} IS NULL`),
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
  currency: text('currency').notNull().default('IQD'),
  images: jsonb('images').notNull().default(sql`'[]'::jsonb`),
  thumbnail: text('thumbnail').notNull(),
  rating: numeric('rating').notNull().default('0'),
  reviewCount: integer('review_count').notNull().default(0),
  stock: integer('stock').notNull().default(0),
  lowStockThreshold: integer('low_stock_threshold').notNull().default(5),
  isNew: boolean('is_new').notNull().default(false),
  isBestSeller: boolean('is_best_seller').notNull().default(false),
  specifications: jsonb('specifications').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
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
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
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
  mediaUrls: jsonb('media_urls').notNull().default(sql`'[]'::jsonb`),
  hotspots: jsonb('hotspots').notNull().default(sql`'[]'::jsonb`),
  isApproved: boolean('is_approved').notNull().default(false),
  featured: boolean('featured').notNull().default(false),
  viewCount: integer('view_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_gallery_setups_user_id').on(table.userId),
  isApprovedIdx: index('idx_gallery_setups_is_approved').on(table.isApproved),
  styleIdx: index('idx_gallery_setups_style').on(table.style),
  tankSizeIdx: index('idx_gallery_setups_tank_size').on(table.tankSize),
  featuredIdx: index('idx_gallery_setups_featured').on(table.featured).where(sql`${table.featured} = true`),
  createdAtIdx: index('idx_gallery_setups_created_at').on(table.createdAt),
}));
