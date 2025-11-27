import type { FuseResultMatch } from 'fuse.js';
import type { IconName } from '@/components/ui';

export type Theme = 'light' | 'dark' | 'system';

// Extended theme options for new visual styles
export type ThemeOption = 'light' | 'dark' | 'neon-ocean' | 'monochrome' | 'pastel';

// Difficulty levels for fish and plants
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type Locale = 'ar' | 'en';

export type Direction = 'rtl' | 'ltr';

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type ColorShade =
  | 50
  | 100
  | 200
  | 300
  | 400
  | 500
  | 600
  | 700
  | 800
  | 900
  | 950;

export type BrandColor = 'aqua' | 'sand' | 'coral';

export type ProductBadge = 'new' | 'bestSeller' | 'outOfStock' | 'discount';

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
}

export interface ProductCompatibility {
  minTankSize: number | null;
  maxTankSize: number | null;
  displayText: string;
}

export interface ProductSpecifications {
  flow: number | null;
  power: number | null;
  compatibility: ProductCompatibility;
  dimensions: ProductDimensions | null;
  weight: number | null;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  description: string;
  price: number;
  originalPrice: number | null;
  currency: 'IQD';
  images: string[];
  thumbnail: string;
  rating: number;
  reviewCount: number;
  stock: number;
  lowStockThreshold: number;
  /**
   * @deprecated Use isOutOfStock(product) helper instead. This field may be derived from stock.
   */
  inStock: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  difficulty?: DifficultyLevel;
  ecoFriendly?: boolean;
  specifications: ProductSpecifications;
  videoUrl?: string;
  explodedViewParts?: EquipmentPart[];
  bundleProducts?: string[];
  flashSale?: FlashSale;
  created_at?: string;
  updated_at?: string;
}

export type ProductWithFlashSale = Product & { flashSale?: FlashSale };

export interface ProductMedia {
  type: 'image' | 'video';
  url: string;
  alt: string;
  thumbnail?: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
}

export interface SocialProofData {
  viewedToday: number;
  boughtThisWeek: number;
  inCart: number;
  timestamp: number;
}

export interface BreadcrumbItem {
  label: string;
  href: string;
  current: boolean;
}

export type GetProductBadges = (product: Product) => ProductBadge[];
export type GetDiscountPercentage = (
  originalPrice: number | null,
  currentPrice: number | null
) => number;
export type IsLowStock = (product: Product) => boolean;

export type SortOption =
  | 'bestSelling'
  | 'highestRated'
  | 'lowestPrice'
  | 'highestPrice'
  | 'newest';

export type FilterType = 'hob' | 'canister' | 'sponge' | 'internal';

export interface ProductFilters {
  types: string[];
  tankSizeMin: number | null;
  tankSizeMax: number | null;
  flowRateMin: number | null;
  flowRateMax: number | null;
  priceMin: number | null;
  priceMax: number | null;
  ratingMin: number | null;
  brands: string[];
  categories: string[];
  subcategories: string[];
}

export interface FilterOption {
  value: string;
  labelKey: string;
  count?: number;
}

export type BrandOption = { name: string; count?: number };

export interface ProductListingProps {
  initialProducts: Product[];
  initialFilters?: ProductFilters;
  initialSort?: SortOption;
  searchQuery?: string;
  hadError?: boolean;
  recommendedProducts?: Product[];
}

export type CalculatorType = 'heater' | 'filter' | 'salinity';

export type BioloadLevel = 'low' | 'medium' | 'high';

export interface HeaterCalculationInputs {
  tankVolume: number;
  currentTemp: number;
  targetTemp: number;
}

export interface HeaterCalculationResult {
  requiredWattage: number;
  recommendedWattage: number;
  status: 'optimal' | 'adequate' | 'insufficient';
  temperatureRise: number;
}

export interface FilterCalculationInputs {
  tankVolume: number;
  bioload: BioloadLevel;
}

export interface FilterCalculationResult {
  requiredFlowRate: number;
  recommendedFlowRate: number;
  status: 'optimal' | 'adequate' | 'insufficient';
  multiplier: number;
}

export interface CalculationResult {
  value: number;
  unit: string;
  status: 'optimal' | 'adequate' | 'insufficient';
  recommendation: string;
}

export interface SavedCalculation {
  id: string;
  type: CalculatorType;
  inputs: HeaterCalculationInputs | FilterCalculationInputs;
  result: HeaterCalculationResult | FilterCalculationResult;
  timestamp: number;
  userId: string | null;
}

export type AuthProvider = 'email' | 'google' | 'phone';

export type AuthTab = 'signin' | 'signup';

export interface AuthError {
  message: string;
  code?: string;
  field?: string;
}

export interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  is_admin: boolean;
  loyalty_points_balance: number;
  referral_code: string | null;
  referred_by: string | null;
  created_at: string;
  updated_at: string;
}

export type CartStatus = 'active' | 'converted' | 'abandoned';

export interface Cart {
  id: string;
  user_id: string;
  status: CartStatus;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
  updated_at: string;
}

export interface CartWithItems extends Cart {
  items: CartItem[];
  total: number;
}

export interface CartItemWithProduct extends CartItem {
  product: Product;
}

export interface LocalStorageCartItem {
  productId: string;
  quantity: number;
  addedAt: number;
}

export interface LocalStorageCart {
  items: LocalStorageCartItem[];
  updatedAt: number;
}

export type SavedForLaterItem = LocalStorageCartItem;

export interface CartContextValue {
  items: CartItemWithProduct[];
  savedItems: CartItemWithProduct[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  total: number;
  isLoading: boolean;
  addItem: (product: Product, quantity?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  saveForLater: (productId: string) => Promise<void>;
  moveToCart: (productId: string) => Promise<void>;
  removeSavedItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  openSidebar: () => void;
  closeSidebar: () => void;
  isSidebarOpen: boolean;
}

export interface Wishlist {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface WishlistItemWithProduct extends Wishlist {
  product: Product;
}

export interface LocalStorageWishlistItem {
  productId: string;
  addedAt: number;
}

export interface WishlistContextValue {
  items: WishlistItemWithProduct[];
  itemCount: number;
  isLoading: boolean;
  addItem: (product: Product) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  toggleItem: (product: Product) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => Promise<void>;
  moveToCart: (productId: string) => Promise<void>;
}

export interface SearchResult {
  product: Product;
  score: number;
  matches: FuseResultMatch[];
}

export interface AutocompleteSuggestion {
  type: 'product' | 'brand' | 'category' | 'article';
  value: string;
  label: string;
  product: Product | null;
  count: number | null;
  thumbnail: string | null;
  slug?: string;
  readingTime?: number | null;
}

export type VoiceSearchState = 'idle' | 'listening' | 'processing' | 'error' | 'not-supported';

export interface SearchFilters {
  inStock: boolean;
  onSale: boolean;
  isNew: boolean;
  categories: string[];
}

export interface SearchPageProps {
  params: { locale: string };
  searchParams: {
    q?: string;
    category?: string;
    brand?: string;
    inStock?: string;
  };
}

export interface NotifyMeRequest {
  id: string;
  product_id: string;
  email: string | null;
  user_id: string | null;
  notified: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  is_approved: boolean;
  helpful_count: number;
  not_helpful_count: number;
  verified?: boolean;
  verified_purchase?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReviewWithUser extends Review {
  user: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface HelpfulVote {
  id: string;
  review_id: string;
  user_id: string;
  vote_type: 'helpful' | 'not_helpful';
  created_at: string;
}

export interface ReviewFormData {
  rating: number;
  title: string;
  comment: string;
  images: File[];
}

export interface ReviewFilters {
  rating: number | null;
  sortBy: 'recent' | 'helpful' | 'highest' | 'lowest';
  withImages?: boolean;
  verified?: boolean;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface ImageUploadPreview {
  file: File | null;
  preview: string;
  uploading: boolean;
  uploaded: boolean;
  url: string | null;
  error: string | null;
}

export interface CartConstants {
  FREE_SHIPPING_THRESHOLD: number;
  MAX_QUANTITY: number;
  MIN_QUANTITY: number;
  STORAGE_KEY: string;
  SAVED_ITEMS_KEY: string;
}

export interface SavedAddress {
  id: string;
  user_id: string;
  label: string | null;
  recipient_name: string;
  phone: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  governorate: string;
  postal_code: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  guest_email: string | null;
  shipping_address_id: string | null;
  shipping_address: ShippingAddressSnapshot;
  payment_method: PaymentMethod;
  status: OrderStatus;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  loyalty_discount: number;
  loyalty_points_used: number;
  total: number;
  coupon_code: string | null;
  notes: string | null;
  tracking_number: string | null;
  carrier: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductSnapshot {
  name: string;
  brand: string;
  thumbnail: string;
  specifications: ProductSpecifications;
}

export interface ShippingAddressSnapshot {
  label: string | null;
  recipient_name: string;
  phone: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  governorate: string;
  postal_code: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_snapshot: ProductSnapshot;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
}

export type PaymentMethod = 'cod' | 'zaincash' | 'fastpay' | 'bank_transfer';

export type CheckoutStep = 'shipping' | 'payment' | 'review';

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value: number | null;
  max_discount: number | null;
  expiry_date: string | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShippingRate {
  governorate: string;
  base_rate: number;
  free_shipping_threshold: number;
  estimated_delivery_days: number;
}

export interface CheckoutData {
  shippingAddress: ShippingAddressSnapshot;
  paymentMethod: PaymentMethod;
  couponCode: string | null;
  notes: string | null;
  }

  export type NotificationType = 'order_confirmation' | 'shipping_update' | 'stock_alert' | 'special_offer';

  interface BaseNotificationData {
    type: NotificationType;
  }

  export interface OrderNotificationData extends BaseNotificationData {
    type: 'order_confirmation' | 'shipping_update';
    order_id: string;
    order_number: string;
    total: number;
    items_count: number;
    tracking_number?: string;
  }

  export interface StockAlertData extends BaseNotificationData {
    type: 'stock_alert';
    product_id: string;
    product_name: string;
    product_slug: string;
    thumbnail: string;
    price: number;
  }

  export interface SpecialOfferData extends BaseNotificationData {
    type: 'special_offer';
    offer_id: string;
    title: string;
    discount: number;
    code: string;
    expiry_date: string;
  }

  export type NotificationData = OrderNotificationData | StockAlertData | SpecialOfferData;

  export interface Notification {
    id: string;
    user_id: string;
    type: NotificationType;
    title: string;
    message: string;
    data: NotificationData | null;
    link: string | null;
    read_at: string | null;
    created_at: string;
  }

  export interface NotificationPreferences {
    email_order_updates: boolean;
    email_shipping_updates: boolean;
    email_stock_alerts: boolean;
    email_marketing: boolean;
    inapp_notifications_enabled: boolean;
  }

export interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

// Marketing features (Phase 16)

export interface FlashSale {
  id: string;
  product_id: string;
  flash_price: number;
  original_price: number;
  stock_limit: number;
  stock_sold: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FlashSaleWithProduct extends FlashSale {
  product: Product;
  timeRemaining: number;
  percentageSold: number;
}

export interface Bundle {
  id: string;
  name: string;
  description: string;
  product_ids: string[];
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  bundle_price: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BundleWithProducts extends Bundle {
  products: Product[];
  totalOriginalPrice: number;
  savings: number;
}

export type LoyaltyTransactionType = 'earned' | 'redeemed' | 'expired';

export interface LoyaltyPointsTransaction {
  id: string;
  user_id: string;
  transaction_type: LoyaltyTransactionType;
  points: number;
  order_id: string | null;
  description: string | null;
  created_at: string;
}

export interface LoyaltyPointsSummary {
  balance: number;
  totalEarned: number;
  totalRedeemed: number;
  recentTransactions: LoyaltyPointsTransaction[];
}

export type ReferralStatus = 'pending' | 'completed' | 'rewarded';
export type ReferralRewardType = 'points' | 'discount';

export interface Referral {
  id: string;
  referrer_id: string;
  referee_id: string;
  referral_code: string;
  status: ReferralStatus;
  reward_type: ReferralRewardType;
  reward_value: number;
  referee_first_order_id: string | null;
  rewarded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingRewards: number;
  totalRewardsEarned: number;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  user_id: string | null;
  subscribed_at: string;
  unsubscribed_at: string | null;
  preferences: Record<string, unknown>;
  unsubscribe_token: string;
  created_at: string;
  updated_at: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export type FormStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export type BlogCategory =
  | 'filter-guide'
  | 'plant-care'
  | 'fish-compatibility'
  | 'setup-tips'
  | 'freshwater'
  | 'troubleshooting'
  | 'lighting'
  | 'maintenance';

export interface BlogAuthor {
  name: string;
  avatar: string;
  bio: string;
  social?: {
    twitter?: string;
    instagram?: string;
  };
}

export interface BlogPostMetadata {
  title: string;
  excerpt: string;
  category: BlogCategory;
  tags: string[];
  coverImage: string;
  author: BlogAuthor;
  publishedAt: string;
  updatedAt: string | null;
  relatedProducts: string[];
  seo: {
    title: string;
    description: string;
  };
}

export interface BlogPost extends BlogPostMetadata {
  slug: string;
  content: string;
  readingTime: number;
}

export interface BlogCategoryInfo {
  key: BlogCategory;
  title: string;
  description: string;
  icon: IconName;
  color: string;
  postCount: number;
}

export interface BlogListingProps {
  params: { locale: string };
  searchParams?: { category?: string; page?: string };
}

export interface BlogPostProps {
  params: { locale: string; slug: string };
}

export type AdminDashboardTab =
  | 'dashboard'
  | 'products'
  | 'orders'
  | 'inventory'
  | 'reports'
  | 'users';

export interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  lowStockProducts: number;
  pendingReviews: number;
  activeFlashSales: number;
}

export interface SalesReportData {
  date: string;
  revenue: number;
  orders: number;
  customers: number;
}

export interface BestSellerData {
  product_id: string;
  product_name: string;
  product_thumbnail: string;
  total_quantity: number;
  total_revenue: number;
  order_count: number;
}

export interface LowStockProduct extends Product {
  stockPercentage: number;
  daysUntilOutOfStock: number;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  changes: Record<string, unknown>;
  created_at: string;
}

// Gallery (Phase 18)
export type GalleryStyle = 'planted' | 'reef' | 'community' | 'biotope' | 'nano' | 'other';

export type TankSizeRange = 'nano' | 'small' | 'medium' | 'large';

export interface GalleryMedia {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  order: number;
}

export interface Hotspot {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  product_id: string;
  label?: string | null;
}

export interface GallerySetup {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  tank_size: number;
  style: GalleryStyle;
  media_urls: (string | GalleryMedia)[];
  hotspots: Hotspot[];
  is_approved: boolean;
  featured: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface GallerySetupWithUser extends GallerySetup {
  user: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface GallerySetupWithProducts extends GallerySetup {
  products: Product[];
}

export interface GalleryFilters {
  tankSizeRange: TankSizeRange | 'all';
  styles: GalleryStyle[];
  searchQuery: string;
  sortBy: 'newest' | 'popular' | 'featured';
}

export interface GalleryFormData {
  title: string;
  description: string;
  tankSize: number;
  style: GalleryStyle;
  media: File[];
  hotspots: Hotspot[];
}

// Fish Finder
export interface FishFinderOption {
  id: string;
  label: string;
  image?: string;
  value: string;
}

export interface FishFinderStep {
  id: number;
  question: string;
  options: FishFinderOption[];
}

export interface FishFinderResult {
  products: Product[];
  reasoning: string;
}

export interface FishFinderAnswer {
  stepId: number;
  value: string;
}

export interface FishFinderProfile {
  tankSize?: number | string;
  bioload?: BioloadLevel;
  experience?: DifficultyLevel;
  style?: string;
  preferences?: string[];
  answers?: FishFinderAnswer[];
}

// Journey
export interface JourneyStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
}

export interface JourneyRoadmap {
  title: string;
  subtitle?: string;
  steps: JourneyStep[];
  currentStepId?: number;
}

// Bundles
export interface ProductBundle {
  id: string;
  name: string;
  products: Product[];
  discount: number;
  totalPrice: number;
  discountedPrice: number;
}

export interface BundleProductReference {
  id: string;
  quantity: number;
  optional?: boolean;
}

// Equipment exploded view parts
export interface EquipmentPart {
  id: string;
  name: string;
  description: string;
  position: { x: number; y: number };
}

export interface EquipmentExplodedView {
  productId?: string;
  heroImage?: string;
  parts: EquipmentPart[];
  notes?: string;
}

export interface ProductFormData
  extends Omit<
    Product,
    'id' | 'slug' | 'rating' | 'reviewCount' | 'inStock' | 'created_at' | 'updated_at'
  > {
  images: string[];
}

export interface OrderUpdateData {
  status: OrderStatus;
  tracking_number: string | null;
  carrier: string | null;
  notes: string | null;
}
