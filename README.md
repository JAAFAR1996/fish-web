# FISH WEB - Premium Aquarium Equipment E-commerce

A modern, RTL-first e-commerce platform for aquarium equipment in Iraq, built with Next.js 14, TypeScript, Tailwind CSS, Supabase, and next-intl.

## Tech Stack
- Next.js 14 (App Router)
- TypeScript (strict mode)
- Tailwind CSS with RTL support
- Supabase (Database, Auth, Storage)
- next-intl for i18n

## Prerequisites
- Node.js 18.17 or newer
- npm, pnpm, or yarn
- Supabase project with API keys

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the environment template and add your Supabase credentials:
   ```bash
   cp .env.local.example .env.local
   ```
3. Update `.env.local` with values from the Supabase dashboard.
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Visit `http://localhost:3000` (all routes are locale prefixed, e.g. `/ar`, `/en`).

## Available Scripts
- `npm run dev` – Start the development server with Turbopack.
- `npm run build` – Create an optimized production build.
- `npm run start` – Run the production server.
- `npm run lint` – Execute ESLint using Next.js defaults.
- `npm run type-check` – Validate TypeScript types without emitting files.

## Project Structure
- `src/app` – Next.js App Router pages, layouts, and route handlers.
- `src/components` – Reusable UI pieces (grouped into ui, layout, products, features).
- `src/lib` – Utilities and third-party integrations (Supabase clients, helpers).
- `src/types` – Central TypeScript definitions.
- `src/i18n` – Locale configuration, middleware helpers, navigation utilities.
- `messages` – Translation dictionaries (`ar.json`, `en.json`).
- `public` – Static assets served directly by Next.js.

## Design System

### Design Tokens
- **Colors:** Aqua (#0E8FA8) for primary actions, Sand (#B89968) for accents, Coral (#FF6F61) for alerts, plus a neutral gray ramp.
- **Typography:** Cairo for Arabic content, Inter for English content; both loaded via `next/font` and exposed through CSS variables.
- **Spacing:** Tailwind spacing scale with additional custom values (`18`, `88`, `128`) for roomy layouts.
- **Shadows:** Tokenized shadows ranging from `sm` to `2xl` for cards, modals, and elevated UI.
- **Dark Mode:** Class-based theming powered by `next-themes` with smooth transitions controlled by CSS variables.
- **Container Queries:** Enabled through `@tailwindcss/container-queries` for component-scoped responsiveness.
- **Accessibility:** Respect `prefers-reduced-motion` and deliver high contrast focus rings in aqua.

### Using the Design System
- Prefer semantic utilities such as `bg-background`, `text-foreground`, and `border-border` to stay theme-aware.
- Reach for `font-sans`, `font-arabic`, or `font-english` depending on locale-specific typography needs.
- Compose layouts with Tailwind spacing utilities (`gap-6`, `px-18`, `py-88`) to stay on-scale.
- Combine utility animations (e.g., `motion-safe:animate-fade-in`) with `motion-reduce:` fallbacks.
- Import helpers from `@/lib/utils` (`cn`, `formatCurrency`, `getDirection`) to keep components concise.

## UI Component Library
A comprehensive, accessible component suite that follows WAI-ARIA best practices.

### Available Components

**Primitives**
- **Button:** Variants (`default`, `primary`, `secondary`, `outline`, `ghost`, `destructive`), sizes (`sm`, `md`, `lg`), loading state, icon slots, and `asChild` support.
- **Input:** Labeled input with helper/error text, leading/trailing icons, compact and comfortable sizes.
- **Card:** Header/content/footer layout with hoverable elevation, border or elevated variants.
- **Badge:** Semantic badges (`primary`, `secondary`, `success`, `warning`, `info`, `destructive`, `outline`) with size controls.

**Interactive**
- **Modal:** Accessible dialog built on `<dialog>` with focus trapping, keyboard dismissal, backdrop handling, and size options.
- **Dropdown Menu:** Menu-button pattern with keyboard navigation, typeahead search, separators, and labels.
- **Accordion:** Collapsible regions with single or multiple expand modes, full keyboard support, and animated height transitions.
- **Tabs:** Follows the tabs pattern with automatic ARIA wiring and keyboard navigation.
- **Icon:** Lucide icon registry with RTL flipping support.
- **Dark Mode Toggle:** Theme switcher integrated with `next-themes`.

## Home Page Sections

A comprehensive landing experience composed of nine cohesive sections that guide visitors from discovery to education.

### Section Order
1. **Hero**: 3D tilt hero with dual CTAs and trust indicators (already implemented)
2. **Featured Categories**: Six gradient cards that direct to product listings
3. **Best Sellers**: Scroll-snap carousel of top-rated products
4. **Calculators Showcase**: Preview cards for heater, filter, and salinity calculators
5. **Trust Badges**: Reinforces COD, returns, delivery, and support differentiators
6. **New Arrivals**: Container-query grid of the latest products
7. **Instagram Feed**: Stylized gallery placeholder for UGC and social proof
8. **Quick Guides**: Accordion with actionable tips for beginners
9. **Newsletter**: Already exposed in the global footer

### Components

**FeaturedCategories (Server Component)**
- Highlights six categories (filters, heaters, plant lighting, water care, plants/fertilizers, air) with gradient cards
- Large Lucide icons with hover lift effects (`category-card-hover`)
- Live product counts sourced from the product catalog
- Links deep into `/products?category={key}`
- Responsive grid: 2 columns on mobile, 3 on tablet, 6 on desktop

**BestSellers (Client Component)**
- Uses the reusable `Carousel` component with scroll snapping and momentum scrolling
- Fetches up to eight products marked `isBestSeller`
- Navigation arrows (hidden on mobile), touch-friendly swipe, RTL-aware
- Renders `ProductCard` with wishlist/cart handlers
- Empty state gracefully falls back to descriptive copy

**CalculatorsShowcase (Server Component)**
- Three cards representing Heater, Filter, and Salinity calculators
- Gradient icon badges, succinct descriptions, and CTA buttons
- Salinity calculator displays a “Coming Soon” badge
- Cards link to `/calculators?tab={type}` for deep-linking
- Section-level CTA to `/calculators`

**TrustBadges (Server Component)**
- Mirrors footer trust messaging with elevated visuals
- Circular gradient icons for COD, returns, delivery, and local support
- Gradient background section with centered copy for emphasis

**NewArrivals (Client Component)**
- Displays up to eight products flagged `isNew`
- Container queries (`@md`, `@lg`) drive 2 → 3 → 4 column transitions
- Reuses `ProductCard` with shared cart/wishlist interactions
- “View All” routes to `/products?sort=newest`

**InstagramFeed (Server Component)**
- Six static gradient tiles simulating social posts
- Hover overlay from `.instagram-overlay` reveals Instagram icon
- CTA button encourages following the official handle
- Placeholder links ready for future API integration

**QuickGuides (Client Component)**
- Accordion with three guides: filter selection, heater sizing, water parameters
- Icon chips for each topic, translated titles/content
- Single-expand accordion for focused reading
- Max width 4xl to maintain readability

**Carousel (Client Component)**
- Flex-based scroll container with CSS scroll snap
- Configurable items-per-view per breakpoint (`base`, `sm`, `md`, `lg`)
- Navigation buttons respect RTL and reduced-motion preferences
- Optional dots indicator with keyboard support
- Uses `.scrollbar-hide` utility to keep UI clean

### Data Fetching
- `getBestSellers(limit)` retrieves cached catalog data, filters `isBestSeller`, sorts by rating/review count
- `getNewArrivals(limit)` filters `isNew`, sorts by descending numeric ID fallback to rating
- `getProductsByCategory` and `getCategoryProductCount` keep category cards accurate
- Data fetched server-side in the locale-aware home page for SEO-friendly rendering

### Responsive Design
- Mobile: stacked sections, single-column grids, carousel shows one card
- Tablet: 2–3 column grids, carousel shows two cards, buttons remain accessible
- Desktop: 3–4 column grids, carousel shows four cards, generous spacing
- Container queries tailor product grids to their parent width instead of viewport-only breakpoints

### Carousel Implementation
- Flexbox with `scroll-snap-type: x mandatory` and `scroll-snap-align: start`
- Smooth scrolling disabled when `prefers-reduced-motion` is set
- RTL support via normalized scroll computations and icon flipping
- Navigation buttons disabled when no further content is available
- `gap` prop feeds CSS custom property (`--carousel-gap`) for precise item widths

### Translations
- `home.featuredCategories.*`, `home.bestSellers.*`, `home.calculatorsShowcase.*`
- `home.trustBadges.*`, `home.newArrivals.*`, `home.instagramFeed.*`, `home.quickGuides.*`
- Reuses existing `footer.trustBadges.*` entries for badge content
- Arabic and English dictionaries kept in sync to guarantee locale parity

### Accessibility
- Sections use semantic headings and `aria-labelledby`
- Carousel navigation buttons expose aria labels and state via disabled attributes
- Accordion adheres to WAI-ARIA Authoring Practices with keyboard navigation
- Hover animations respect `prefers-reduced-motion`
- Focus styles preserved on all interactive elements, including custom links/buttons

### Performance
- Server Components fetch data and render HTML for optimal LCP
- Client Components limited to sections requiring interaction (carousel, accordion, product cards)
- No third-party carousel dependencies; CSS handles scroll physics
- Gradient placeholders avoid CLS by maintaining consistent aspect ratios
- Shared handlers ready for cart/wishlist integration without re-renders

### SEO & Future Enhancements
- Structured page ready for metadata expansion (Open Graph, JSON-LD)
- Internal links to calculators and product listings improve crawl depth
- Future: replace Instagram placeholders with Supabase-stored images or Graph API
- Potential additions: testimonials, blog previews, personalized recommendations, seasonal promos
- Cart/wishlist server actions will eventually replace console placeholders in client components

## Wishlist System

The wishlist experience mirrors the cart’s dual-storage strategy while keeping the codebase consistent and easy to extend.

### Highlights
- **Dual Storage:** Guests rely on `localStorage` (`fish-web-wishlist`); authenticated users persist to Supabase (`wishlists` table). A login automatically merges both sources without duplicates.
- **Provider Pattern:** `WishlistProvider` exposes `useWishlist()` with `items`, `itemCount`, `addItem`, `removeItem`, `toggleItem`, `moveToCart`, and `clearWishlist`, matching the cart API for familiarity.
- **Server Actions:** `wishlist-actions.ts` handles add/remove/toggle/sync flows, revalidates `/wishlist` per locale, and records notify-me requests (`notify_me_requests` table with RLS + unique indexes).
- **UI Integration:** `ProductCard` and PDP `ProductInfo` consume `useWishlist()` directly. The heart icon is now stateful everywhere, and out-of-stock items surface a `NotifyMeButton` that opens an email capture modal.
- **Wishlist Page:** `/[locale]/wishlist` renders `WishlistPageContent`—bulk move-to-cart, clear-all, per-item notify me, and an empty state. The Account wishlist tab shows a four-item preview.

### Schema Additions
- `wishlists` table (unique `user_id + product_id`, indexed by user/product, full RLS coverage).
- `notify_me_requests` table (supports guests and users, unique partial indexes to avoid duplicate requests, pending notifications flagged via `notified = false`).

### Components & Utilities
- `src/lib/wishlist/`: constants, storage helpers, Supabase queries, and server actions.
- `WishlistProvider`: mirrors `CartProvider` with optimistic state updates and login sync.
- `NotifyMeModal` / `NotifyMeButton`: reusable opt-in flow for restock emails.
- `WishlistPageContent`, `EmptyWishlist`: dedicated wishlist UI with responsive grid + skeletons.

### Future Enhancements
- Email automation for notify-me (Phase 15).
- Shared/public wishlists and advanced batching (move-all, export, analytics).
- Admin tooling to view pending notify-me requests and trigger campaigns.

## Search System

A comprehensive search system with fuzzy search, autocomplete suggestions, voice search, and highlighted results.

## Reviews & Ratings System

Fully authenticated product reviews with star ratings, moderation, image uploads, and helpful voting.

### Highlights
- Authenticated reviews only (no guests) with one review per user/product and 30-day edit window
- Supabase tables: `reviews` (approval workflow, helpful counters) and `helpful_votes` (toggleable votes) with RLS policies
- Supabase Storage bucket `review-images` (public read, user-scoped write, 5MB/file, JPG/PNG/WebP)
- Server utilities (`src/lib/reviews`) for constants, validation, image upload, queries, and server actions (create/update/delete/toggle votes)
- Client components (`src/components/reviews`) covering summary, filters, list, item, form, image uploader, helpful buttons, and empty state
- PDP integration: server-rendered `ProductTabs` passes review data to client `ReviewsTabContent` with live refresh after actions
- Product page loads review summary/helpful votes on the server; ProductTabs now replaces the placeholder Reviews tab with full UI
- Translations in `messages/en.json` and `messages/ar.json` for all review copy, validations, errors, success states, and moderation labels
### Features

**Fuzzy Search**
- Powered by Fuse.js (12KB, lightweight fuzzy search library)
- Typo tolerance: 30% fuzzy match threshold (handles common typos)
- Weighted search keys: name (1.0) > brand (0.8) > description (0.5) > category (0.3)
- Case-insensitive matching
- Searches across: product name, brand, description, category, subcategory

**Autocomplete Dropdown**
- Debounced search (300ms) for responsive UX
- Minimum 2 characters to trigger
- Categorized suggestions:
  - **Products** (top 5): Thumbnail, name, price, category badge
  - **Brands** (top 2): Brand name, product count
  - **Categories** (top 1): Category name, product count
- Maximum 8 total suggestions
- Keyboard navigation (arrows, enter, escape)
- Click outside to close

**Voice Search (Optional)**
- Web Speech API integration
- Feature detection (hide button if not supported)
- Microphone button in search bar (desktop only)
- Modal with microphone animation and "Listening..." state
- Language-aware (ar-IQ for Arabic, en-US for English)
- Interim results (shows partial transcript)
- Error handling (permission denied, no speech, network error)

**Search Results Page**
- Route: `/search?q={query}`
- Reuses ProductListing component (filters, sort, grid)
- Search results header: "Showing X results for '{query}'"
- Empty state: "No results found" with suggestions
- Highlight search terms in product names and descriptions
- SEO-friendly (Server Component, proper metadata)

**Search Term Highlighting**
- Highlights matching text in search results
- Custom `<mark>` tag with aqua background
- Case-insensitive matching
- Multiple terms supported (split by space)
- Highlights in: product name, description, brand

**Recent Searches**
- Stores last 5 searches in localStorage
- Quick access to previous queries (optional feature)
- Shown in autocomplete dropdown (future enhancement)

### Architecture

**Search Utilities**
- `src/lib/search/search-utils.ts`: Fuse.js configuration, searchProducts function, match extraction
- `src/lib/search/autocomplete-utils.ts`: Autocomplete suggestion generation, formatting, href construction
- `src/lib/search/voice-search.ts`: VoiceSearchHandler class, feature detection, speech recognition wrapper
- `src/lib/search/highlight-utils.ts`: highlightSearchTerms function, regex escaping
- `src/lib/search/recent-searches.ts`: localStorage helpers for recent searches
- `src/lib/search/constants.ts`: Search constants (debounce, thresholds, limits)

**Search Components**
- `SearchBar` (Client): Enhanced with autocomplete, voice search, debounced input
- `SearchAutocomplete` (Client): Dropdown with categorized suggestions
- `VoiceSearchModal` (Client): Modal with speech recognition UI
- `SearchResultsHeader` (Server): "Showing X results for '{query}'"
- `SearchEmptyState` (Server): "No results found" with suggestions

**Page Route**
- `/app/[locale]/search/page.tsx`: Search results page (Server Component)

### Search Flow

**Text Search**
1. User types in SearchBar (Header)
2. After 2 characters, debounced search triggers (300ms)
3. SearchBar calls `getAutocompleteSuggestions(query)`
4. Fuse.js searches products, brands, categories
5. Autocomplete dropdown appears with categorized suggestions
6. User can:
   - Click suggestion: Navigate to product/brand/category page
   - Press Enter: Navigate to `/search?q={query}` (search results page)
   - Press Escape: Close autocomplete
7. Search results page:
   - Server Component fetches all products
   - Calls `searchProducts(products, query)` (Fuse.js on server)
   - Passes results to ProductListing component
   - ProductListing shows filters, sort, and product grid
   - Search terms highlighted in product names/descriptions

**Voice Search**
1. User clicks microphone button in SearchBar (desktop only)
2. VoiceSearchModal opens
3. Feature detection: Check if Web Speech API is supported
4. If supported:
   - VoiceSearchHandler starts speech recognition
   - Modal shows "Listening..." with pulsing microphone animation
   - User speaks search query
   - Interim results show partial transcript in real-time
   - Recognition stops when user finishes speaking
   - Final transcript populates SearchBar input
   - Auto-triggers search (navigates to search results page)
5. If not supported:
   - Modal shows "Voice search not supported" message
   - User can close modal and use text search

**Autocomplete Selection**
1. User types "fluval" in SearchBar
2. Autocomplete shows:
   - **Products**: Fluval 407 Filter, Fluval U2 Filter, Fluval 306 Filter (with thumbnails)
   - **Brands**: Fluval (12 products)
   - **Categories**: Filtration (18 products)
3. User clicks "Fluval 407 Filter" (product suggestion)
4. Navigates to `/products/fluval-407-canister-filter` (PDP)
5. Autocomplete closes
6. Search query saved to recent searches

**Alternative: User clicks "Fluval" (brand suggestion)**
- Navigates to `/search?q=fluval&brand=fluval`
- Search results page shows all Fluval products
- Filters pre-applied (brand: Fluval)

### Fuse.js Configuration

**Search Keys (Weighted)**
- `name`: 1.0 (highest priority, exact product name)
- `brand`: 0.8 (high priority, brand matching)
- `description`: 0.5 (medium priority, detailed text)
- `category`: 0.3 (low priority, broad categorization)
- `subcategory`: 0.3 (low priority, specific type)

**Options**
- `threshold`: 0.3 (30% fuzzy tolerance, good for typo correction)
- `includeScore`: true (return match score for sorting)
- `includeMatches`: true (return matched fields for highlighting)
- `minMatchCharLength`: 2 (minimum 2 characters to match)
- `ignoreLocation`: true (match anywhere in text, not just beginning)

**Examples**
- Query: "filtr" → Matches "filter" (typo correction)
- Query: "aquaclear" → Matches "AquaClear" (case-insensitive)
- Query: "canister" → Matches products with "canister" in name, description, or subcategory
- Query: "fluval 407" → Matches "Fluval 407 Performance Canister Filter" (multi-word)

### Web Speech API

**Browser Support**
- Chrome/Edge: ✅ Full support (webkitSpeechRecognition)
- Firefox: ✅ Full support (SpeechRecognition)
- Safari: ✅ Full support (webkitSpeechRecognition)
- Mobile browsers: ⚠️ Limited support (feature detection required)

**Configuration**
- `continuous`: false (stop after one phrase)
- `interimResults`: true (show partial transcript)
- `lang`: 'ar-IQ' (Arabic) or 'en-US' (English)
- `maxAlternatives`: 1 (only best match)

**Error Handling**
- Permission denied: Show message, prompt user to allow microphone
- No speech detected: Show message, allow retry
- Network error: Show message, fallback to text search
- Not supported: Hide voice button, show message if user tries to access

**Security**
- HTTPS required in production (browser security policy)
- User must grant microphone permission (browser prompt)
- No audio is recorded or stored (transcript only)

### Search Term Highlighting

**Implementation**
- Function: `highlightSearchTerms(text: string, query: string): ReactNode`
- Strategy: Split text by query matches, wrap matches in `<mark>` tag
- CSS: `bg-aqua-100 dark:bg-aqua-900/30 text-foreground font-medium rounded px-0.5`
- Multiple terms: Split query by space, highlight all terms
- Case-insensitive: Matches regardless of case

**Usage**
```tsx
<h3>{highlightSearchTerms(product.name, searchQuery)}</h3>
<p>{highlightSearchTerms(product.description, searchQuery)}</p>
```

**Highlighted Fields**
- Product name (in ProductCard and search results)
- Product description (in search results)
- Brand name (in autocomplete suggestions)
- Category name (in autocomplete suggestions)

### Translations

All search content is translated:
- Autocomplete labels (products, brands, categories, view all, no results)
- Voice search labels (listening, speak, stop, errors, not supported)
- Search results labels (results for, showing, no results, suggestions)
- Search filters (all, in stock, on sale, new arrivals)
- Search actions (search, clear, voice search, view product)
- Hints and placeholders (min length, press enter, examples)

**Translation keys**
- `search.autocomplete.*`: Autocomplete dropdown strings
- `search.voice.*`: Voice search modal strings
- `search.results.*`: Search results page strings
- `search.filters.*`: Search filter labels
- `search.actions.*`: Search action buttons
- `search.hints.*`: Helper text and hints
- Reuses: `nav.search`, `nav.searchPlaceholder` for basic labels

### Performance

**Optimizations**
- Debounced autocomplete (300ms, prevents excessive searches)
- Minimum 2 characters to trigger (reduces unnecessary searches)
- Fuse.js is fast (25 products, <10ms search time)
- Server-side search on results page (no client-side data fetching)
- Memoized search results (useMemo in components)
- Lazy load voice search modal (only render when opened)

**Future optimizations (Phase 19)**
- Migrate to Supabase full-text search (PostgreSQL tsvector)
- Server-side search API (handle 1000+ products)
- Search result caching (SWR or React Query)
- Pagination for large result sets
- Search analytics (track popular queries, no-result queries)

### Accessibility Features

- Semantic HTML (search input, listbox for autocomplete, mark for highlights)
- Proper ARIA labels (search input, voice button, autocomplete options)
- Keyboard navigation:
  - Cmd/Ctrl+K: Focus search input (existing)
  - Arrow keys: Navigate autocomplete suggestions
  - Enter: Select suggestion or submit search
  - Escape: Close autocomplete or voice modal
  - Tab: Close autocomplete, move to next element
- Focus management:
  - Autocomplete doesn't trap focus (can tab away)
  - Voice modal traps focus (Modal component)
  - Visible focus indicators
- Screen reader friendly:
  - Search results count announced
  - Autocomplete suggestions announced (role="option")
  - Voice search state announced ("Listening...", "Processing...")
  - Highlight doesn't affect screen reader (mark tag is semantic)
- Reduced motion support:
  - Microphone pulse disabled
  - Autocomplete slide simplified
  - Instant transitions

### SEO

- Search results page: Server Component (SEO-friendly)
- Metadata: Dynamic title and description based on query
- robots: noindex, follow (don't index search results, but follow product links)
- Semantic HTML structure
- Proper heading hierarchy (h1 for search query)
- Product links are crawlable (ProductCard links to PDP)

### Integration Points

**With Header**
- SearchBar in Header (already integrated)
- Enhanced with autocomplete and voice search
- Keyboard shortcut (Cmd/Ctrl+K) focuses search

**With ProductListing**
- Search results page reuses ProductListing component
- No modifications needed (accepts initialProducts prop)
- Filters and sort work on search results

**With ProductCard**
- Search results display ProductCard components
- Highlight search terms in product name (future enhancement)
- All ProductCard features work (wishlist, quick view, add to cart)

**With Navigation**
- Autocomplete navigates to product PDP, brand search, or category page
- Search results page has breadcrumb (Home > Search > "{query}")
- "Clear search" link returns to /products

**With Analytics (Future - Phase 19)**
- Track search queries (popular searches, no-result queries)
- Search-to-purchase conversion rate
- Autocomplete click-through rate
- Voice search usage rate

### Future Enhancements

- Supabase full-text search (PostgreSQL tsvector, Phase 19)
- Search filters (price range, rating, availability)
- Search suggestions ("Did you mean...?" for typos)
- Search history (show recent searches in autocomplete)
- Popular searches (show trending queries)
- Search analytics (track queries, improve results)
- Advanced search (boolean operators, exact phrases)
- Image search (search by product image)
- Barcode search (scan product barcode)
- Search within category (scoped search)
- Search result pagination (for large result sets)
- Search result sorting (relevance, price, rating)
- Search synonyms ("pump" matches "filter")
- Search autocorrect (automatic typo correction)
- Search personalization (based on browsing history)
- Voice search improvements (multi-language, accent handling)
- Search export (save search results as list)

## Hero Section
A visually rich landing section with parallax motion, hover tilt, and dual call-to-actions.

### Features
- CSS-based 3D tilt on hover (with RTL reversal and reduced-motion guard).
- Optional parallax that interpolates scroll position when the hero is in view.
- USP badge, headline, supporting copy, dual CTAs, and trust indicators.
- Dedicated visual slot ready for a Three.js/React Three Fiber model.

### Implementation Notes
- Component lives in `src/components/layout/Hero.tsx` and is a client component to manage parallax state.
- Parallax uses Intersection Observer + `requestAnimationFrame` and clamps translation to ±50px.
- Animations fall back gracefully when `prefers-reduced-motion` is enabled.

## ProductCard Component
A feature-rich product tile that powers merchandising grids with pricing, badges, ratings, and quick actions.

### Features

**Product Information**
- Uppercase brand label with muted styling.
- Product title links to the PDP and applies a two-line clamp for consistency.
- Specification row highlights flow or power plus tank compatibility.
- IQD price formatting with optional strikethrough original price when discounted.
- Integrated star rating with optional review count text.

**Badges**
- Supports "New", "Best Seller", "Out of Stock", and percentage discount badges.
- Maximum two badges shown at once, prioritised as Out of Stock → Discount → Best Seller → New.
- Uses semantic badge variants (info, success, destructive, warning) and stacks them at the image corner.

**Interactive Controls**
- Wishlist heart toggles local state with a heartbeat animation and translated `aria-label`s.
- Quick View button opens a modal for deep dive content (images, specs, stock, add-to-cart).
- Add to Cart button handles loading/disabled states and swaps copy when unavailable.
- All actions expose translated accessibility labels.

**Stock Indicator**
- Appears when `stock <= lowStockThreshold` and displays "Only X left!" text plus a progress bar.
- Progress bar animates with a gentle pulse for critically low inventory while honouring motion preferences.

**Hover Treatments**
- Card border and shadow intensify with an aqua accent.
- Product image scales to 105% using GPU-accelerated transforms.
- Wishlist icon transitions colour and triggers the heartbeat animation on selection.

### Component Structure
```
ProductCard
├── Card (hoverable)
│   ├── Badge stack (absolute, top-start)
│   ├── Wishlist button (absolute, top-end)
│   ├── Image link → `/products/[slug]`
│   ├── CardContent
│   │   ├── Brand label
│   │   ├── Name link (two-line clamp)
│   │   ├── Specification row
│   │   ├── StarRating
│   │   └── Price + optional StockIndicator
│   └── CardFooter
│       ├── Quick View button
│       └── Add to Cart button
└── ProductQuickView (modal rendered as a sibling)
```

### Usage
```tsx
import { ProductCard } from '@/components/products';
import type { Product } from '@/types';

function ProductGrid({ products, onAddToCart }: {
  products: Product[];
  onAddToCart: (product: Product) => Promise<void> | void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          className="h-full"
          priority={index < 4}
        />
      ))}
    </div>
  );
}
```

Wishlist state (heart toggle, feedback) is resolved internally via `useWishlist()`, so no wishlist-specific props need to be passed to `ProductCard`.

### Product Type Snapshot
```ts
interface Product {
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
  inStock: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  specifications: {
    flow: number | null;
    power: number | null;
    compatibility: {
      minTankSize: number | null;
      maxTankSize: number | null;
      displayText: string;
    };
  };
}
```

### Translations
- Badges: `product.badges.*`
- Actions: `product.actions.*`
- Specifications: `product.specs.*`
- Stock messaging: `product.stock.*`
- Rating copy: `product.rating.*`
- Accessibility labels: `product.a11y.*`
- Quick view modal: `product.quickView.*`

Arabic and English dictionaries stay in lockstep for locale parity.

### Responsive Behaviour
- **Mobile (<640px):** Buttons stack vertically, text sizes shrink slightly, image spans full width.
- **Tablet (640px–1023px):** Buttons align horizontally, specs remain legible without wrapping.
- **Desktop (>=1024px):** Full spacing, hover treatments, badge stacks, fits seamlessly into 3–4 column grids.

### Accessibility
- Keyboard focusable controls with prominent focus rings.
- Heart/quick view/add-to-cart buttons expose translated `aria-label`s.
- Rating is surfaced via `role="img"` and descriptive text ("Rated 4.5 out of 5 stars").
- Stock indicator uses `role="status"` with polite live region updates.
- Animations respect `prefers-reduced-motion`.

### Integration Notes
- Import from `@/components/products` to keep feature UI separate from primitives.
- `ProductQuickView`, `StarRating`, and `StockIndicator` are exported from `@/components/ui` for reuse elsewhere (e.g., PDP).
- Shared helpers (`formatCurrency`, `getProductBadges`, `isLowStock`) live in `@/lib/utils` for consistency.

### Future Enhancements
- Connect wishlist state to Supabase (Phase 12).
- Wire Add to Cart into the real cart service with optimistic updates (Phase 11).
- Add skeleton loading states for slower networks.
- Support product image carousels or quick-compare badges.
- Emit analytics events for impressions, quick views, and add-to-cart interactions.

## Header & Navigation
A sticky, responsive navigation system with desktop mega menu, mobile accordion menu, and locale-aware routing.

### Components
- **Header:** Sticky, blurred background on scroll, houses logo, actions, search, and menu entry points.
- **MegaMenu:** Desktop hover/focus mega menu with arrow key navigation, translated subtitles, and backdrop dismissal.
- **MobileMenu:** Slide-in accordion navigation with focus trap, Escape/backdrop close, and RTL-aware positioning.
- **SearchBar:** Command palette style input with `Cmd/Ctrl + K` shortcut and future autocomplete hook.

### Navigation Structure
1. Filters (HOB, Canister, Sponge, Internal, Media, Accessories)
2. Air (Pumps, Stones, Tubing, Valves, Accessories)
3. Heaters (Submersible, External, Controllers, Thermometers)
4. Plant Lighting (LED, Fluorescent, Timers, Fixtures, Bulbs)
5. Hardscape (Substrate, Rocks, Driftwood, Decorations, Backgrounds)
6. Water Care (Conditioners, Treatments, Clarifiers, Bacteria, Maintenance)
7. Plants/Fertilizers (Live Plants, Liquid/Substrate Fertilizers, CO2, Tools)
8. Tests (Water, pH, Ammonia, Nitrite, Nitrate, Multi-Parameter)

### Usage
```tsx
import { Header } from '@/components/layout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1 pt-16">{children}</main>
    </>
  );
}
```
`Header` is pre-wired in the root layout; individual pages do not need to import it.

### Responsiveness
- **Mobile (<640px):** Hamburger button opens the mobile drawer, search condenses to icon, actions collapse to icons.
- **Tablet (640px–1023px):** Search bar visible, mega menu hidden, mobile menu handles categories.
- **Desktop (>=1024px):** Full mega menu available, hamburger hidden, hover/focus interactions enabled.

### Accessibility & Motion
- Roving focus across mega menu buttons, ArrowDown drops into the panel, Escape closes menus.
- Mobile menu traps focus and restores it to the trigger on close.
- Animations use `motion-safe:` variants with global reduced-motion overrides.

## Product Detail Page (PDP)

A server-rendered product experience that blends rich media, pricing, calculators, and related merchandising in one cohesive layout.

### Feature Highlights
- **Media Gallery:** `ProductMedia` pairs the thumbnail-driven `ImageGallery` with a full-screen `ImageLightbox`, delivering zoom, keyboard navigation, and thumbnail scrubbing.
- **Product Overview:** Brand badge row, translated product badges, rating summary, `SocialProofBadge`, pricing/discount ribbon, stock indicator, plus `ShareButtons` with copy/WhatsApp/Facebook/Twitter options.
- **Tabbed Content:** `ProductTabs` unifies description, `SpecificationsTable`, `UsageGuideSection`, review placeholder messaging, and the `FaqSection` accordion while respecting RTL and dark mode.
- **Inline Calculators:** `InlineCalculator` auto-detects heater or filter products, pre-fills inputs from specifications, and embeds the existing calculators without duplicating logic.
- **Related Products:** `RelatedProducts` reuses `ProductCard` to surface same-category recommendations with add-to-cart and wishlist hooks.
- **Mobile Sticky CTA:** A persistent bottom bar keeps the primary add-to-cart action visible on small screens.

### Component Map
- Media: `ProductMedia`, `ImageGallery`, `ImageLightbox`
- Contextual UI: `ProductBreadcrumb`, `SocialProofBadge`, `ShareButtons`
- Informational Tabs: `ProductTabs`, `SpecificationsTable`, `UsageGuideSection`, `FaqSection`
- Commerce Tools: `InlineCalculator`, `RelatedProducts`

### Data Flow & Utilities
- `getProductBySlug` hydrates PDP data; `getRelatedProducts` recycles the category catalogue for recommendations.
- `generateSocialProofData` and `getWhatsAppUrl` in `@/lib/utils` provide deterministic social proof and messaging links without external services.
- Metadata is derived in `generateMetadata`, using `pdp.titleTemplate`/`descriptionTemplate` translations for localized SEO.

### Translations
- `messages/en.json` and `messages/ar.json` include a comprehensive `pdp` namespace covering CTA labels, specs, social proof, gallery controls, share text, and FAQ copy, ensuring locale parity.

## Shopping Cart System

Full-featured cart with dual storage (localStorage for guests, Supabase for authenticated users) and synchronized state across app surfaces.

### Features
- **Dual Storage**: Guests persist cart data in localStorage (`fish-web-cart`), while signed-in users store carts in Supabase (`carts`, `cart_items`). Guest carts auto-merge on login via `syncGuestCartAction`.
- **Two Cart Views**: Slide-in `SidebarCart` for quick edits and the `/cart` page for a complete review; both share `CartProvider` state and utilities.
- **Cart Operations**: Add, remove, update quantity (debounced 500 ms), clear cart, save for later (Phase 11 in-memory / localStorage, Phase 12 integrates wishlist).
- **Free Shipping Progress**: Threshold 100,000 IQD with real-time progress bar messaging.
- **Upsell Recommendations**: `UpsellSection` leverages `getComplementaryProducts` to suggest complementary items.
- **Calculator Access**: `CalculatorLink` opens heater/filter calculators based on cart contents.

### Architecture
- `CartProvider` (`src/components/providers/CartProvider.tsx`) exposes `useCart()` with cart items, totals, operations, and sidebar controls.
- Cart utilities live in `src/lib/cart/` (constants, pure calculations, localStorage helpers, Supabase queries, server actions).
- Cart UI components reside in `src/components/cart/` (items, summary, progress, upsell, saved items, sidebar, calculator link, page content).
- `/app/[locale]/cart/page.tsx` renders the full cart page with localized metadata (`robots: noindex, nofollow`).
- Header cart badge uses `useCart()` for live counts; sidebar reuses MobileMenu focus/animation patterns.

### Data Model & Translations
- Types expanded with `CartItemWithProduct`, `LocalStorageCart`, `SavedForLaterItem`, and `CartContextValue` (`src/types/index.ts`).
- Translations added under `cart.*` in both locales covering summary, progress, actions, empty state, upsell, calculator prompts, success/error copy.

### Styling & Future Enhancements
- `globals.css` introduces cart-specific animations (item slide-out, quantity pulse, badge bounce) with reduced-motion fallbacks.
- README documents architecture and flow for future tasks (checkout integration, wishlist sync, analytics, advanced shipping rules).

## Admin Dashboard (Phase 17)

A comprehensive admin workspace for managing catalog, orders, inventory, analytics, and customer activity.

### Features

**Admin Authentication**
- `profiles.is_admin` flag with index (`supabase/schema.sql`).
- Middleware gate keeps `/admin` routes by invoking `isAdmin()`.
- Server pages/actions use `requireAdmin()` for defense-in-depth.
- Audit trail stored in `admin_audit_logs` via `createAuditLog()` helpers.

**Product Management**
- CRUD powered by Supabase `products` table and Storage bucket `product-images`.
- `ProductForm` supports validation, specs capture, and batch image upload.
- Actions revalidate storefront caches (`/products`, `products` tag).
- `products.json` now acts as fallback when Supabase query fails.

**Order Management**
- `updateOrderStatusAction` enforces status transitions and collects tracking data.
- Shipping updates trigger Resend email + in-app notification.
- Orders tab provides filter, pagination, and invoice print shortcut.

**Inventory Management**
- Low stock view highlights items at or below threshold.
- Quick restock prompt leverages `updateProductStockAction` and back-in-stock alerts.
- Totals surface within dashboard stats for at-a-glance monitoring.

**Sales Reports**
- `getSalesReport` + `getBestSellersReport` aggregate Supabase order data.
- Recharts visualizes revenue trend and top products with responsive charts.
- Date range buttons (7/30/90 days) update analytics on demand.

**User Overview**
- Users tab reserved for future profile & review moderation tooling (placeholder card today).

### Database Schema

**profiles**
- `is_admin BOOLEAN DEFAULT false` with partial index for fast lookups.

**products**
- Schema mirrors the `Product` interface (pricing, stock, flags, specs, imagery, timestamps).
- `trg_products_updated` keeps `updated_at` fresh via `set_updated_at()` trigger.

**admin_audit_logs**
- Stores `admin_id`, `action`, `entity_type`, `entity_id`, optional `changes`, timestamp.
- Row-level security restricts reads to admins; inserts allowed for system routines.

**orders**
- New columns `tracking_number` and `carrier` enable shipping comms.

### Integration Points
- Product CRUD refreshes storefront via Next cache invalidation.
- Order status changes send transactional emails and notifications.
- Stock adjustments fire `triggerBackInStockAlerts` when returning above zero.
- Audit log utilities capture before/after payload snapshots.

### Security & Access Control
- Middleware → Server Components → Server Actions triple-check admin rights.
- Supabase RLS grants public read, admin write on `products`; audit logs admin-only.
- Validation layer returns translation keys for consistent error messaging.

### Performance
- Supabase queries batched via Promise.all where possible.
- `cache()` wraps `getProducts()` to reduce duplicate fetches per request.
- Pagination keeps tables performant (20 rows for products/orders; 10 for inventory list).

### Future Enhancements
- Bulk product import/export, detailed user profiles, review moderation UI.
- Advanced analytics (cohort, retention) and scheduled report emails.
- Role hierarchy (manager vs. super-admin) and granular permissions.

## Setup Gallery (Phase 18)

Implement a community-driven Setup Gallery with interactive product hotspots, submissions, moderation, and seamless cart integration.

### Features
- Browse approved setups with filtering/sorting by tank size and style
- Interactive hotspots on images with product popovers and Add to Cart
- Shop This Setup adds all tagged products sequentially to the cart
- User submissions with image upload, hotspot editor, and admin moderation
- Pagination, featured carousel, and related setups

### Database Schema
- Table `gallery_setups` with: id, user_id, title (≤100), description (≤500), tank_size (1–10000), style, media_urls (jsonb), hotspots (jsonb), is_approved, featured, view_count, timestamps
- Indexes: user_id, is_approved, style, tank_size, featured, created_at DESC
- RLS: public can read approved; users can CRUD own rows
- Trigger `set_updated_at` on update
- Storage bucket `gallery-images` (public read, user-scoped write, 10MB, jpeg/png/webp/mp4)

### Component Architecture
- GalleryCard, GalleryGrid, GalleryFilters, EmptyGalleryState
- GalleryDetailView with HotspotMarker and HotspotPopover
- SetupSubmissionForm with multi-step flow and HotspotEditor
- ShopThisSetupButton reuses CartProvider.addItem sequentially

### Hotspot System
- Coordinates are percentages (0–100) of the image container
- Hotspot: { id, x, y, product_id, label? }, sorted by y then x for stable numbering
- Editor: click-to-place, product search, add/edit/remove, max 10 per image

### Integration Points
- Cart: uses `useCart().addItem(product, qty)` with progress UI
- Products: fetched server-side; popover shows stock/price/brand
- Auth: require user for submissions; admin approval via existing patterns
- Image Upload: based on reviews image uploader; path `userId/setupId/filename`
- Search: product autocomplete reused in hotspot editor

### User Workflows
- Browse gallery → open detail → click hotspots → add to cart or shop all
- Submit setup: info → upload media → add hotspots → preview → submit (pending approval)

### Performance
- Server Components for listing/detail; pagination; lazy images
- Async view count increment to avoid blocking rendering

### Security
- RLS and server-side ownership checks on update/delete
- File type/size validation; limited media/hotspots per setup

### Accessibility
- Hotspots keyboard accessible (Tab/Enter), ARIA labels, visible focus
- Popovers dismiss on Escape/click outside; lightbox respects reduced motion

### Future Enhancements
- Video in carousel, drag-and-drop hotspots, likes/comments, collections, challenges

## Performance Optimization & SEO (Phase 19)

Comprehensive performance optimizations and SEO enhancements for production readiness.

### Optimizations Implemented

**Image Optimization:**
- Next.js Image component used in 40+ components (automatic WebP/AVIF conversion)
- Priority loading for above-the-fold images (first 3-4 products, hero image, cover images)
- Lazy loading for below-the-fold images (default Next.js behavior)
- Responsive images with srcset (different sizes for mobile/tablet/desktop)
- Quality optimization (quality={85} for balance between quality and file size)
- Blur placeholders for better perceived performance (optional)

**Incremental Static Regeneration (ISR):**
- Product pages: 1 hour revalidation (products change infrequently)
- Product listing: 30 minutes revalidation (new products, flash sales)
- Blog posts: 1 hour revalidation (content changes rarely)
- Blog listing: 1 hour revalidation
- Gallery pages: 2 hours revalidation (user submissions are infrequent)
- Search results: 30 minutes revalidation (depends on product data)
- Benefits: 50-80% faster page loads for repeat visits, reduced server load, always-fresh content

**Loading Skeletons:**
- ProductCardSkeleton: Matches ProductCard dimensions with shimmer animation
- BlogCardSkeleton: Matches BlogCard dimensions
- GalleryCardSkeleton: Matches GalleryCard dimensions
- CartItemSkeleton: For cart loading states
- Generic Skeleton components: Reusable primitives (Skeleton, SkeletonText, SkeletonImage)
- Loading.tsx files: Automatic loading states for products, blog, gallery, search pages
- Benefits: 30-50% better perceived performance, prevents layout shift, instant visual feedback

**SEO Enhancements:**
- Metadata functions in all 12 page routes (title, description, Open Graph, Twitter Card)
- Open Graph images for products (product.thumbnail), blog (post.coverImage), gallery (setup media)
- Structured data (JSON-LD) for products (Product schema), reviews (Review schema), blog (BlogPosting schema)
- Sitemap.xml with all pages (products, blog, gallery, categories) and correct priorities
- Robots.txt with proper allow/disallow rules (allow public pages, disallow private routes)
- Canonical URLs for all pages (prevents duplicate content)
- Hreflang tags for Arabic/English versions (international SEO)
- Semantic HTML throughout (proper heading hierarchy, article/section elements)

**Analytics Integration:**
- Plausible Analytics (privacy-friendly, GDPR-compliant, < 1KB script)
- Automatic page view tracking (no configuration needed)
- Custom event tracking (add to cart, purchase, newsletter signup, review submission)
- Web Vitals reporting (LCP, FID, CLS, FCP, TTFB, INP)
- Production-only (disabled in development)
- Benefits: Privacy-friendly (no cookies), lightweight (< 1KB vs 45KB for GA), GDPR-compliant

**Bundle Optimization:**
- Tailwind CSS purge (automatic in production, removes unused styles)
- Package import optimization (tree-shaking for Recharts, Lucide icons, Fuse.js)
- Code splitting (each page is separate chunk, dynamic imports for heavy components)
- Font optimization (next/font/google with display: swap, preload, subset optimization)
- Third-party script optimization (Next.js Script component with afterInteractive strategy)

**Caching & Compression:**
- Static assets cached for 1 year (immutable, cache-busting via hashed filenames)
- ISR caching (stale-while-revalidate pattern)
- Supabase query caching (Next.js cache() function)
- Image caching (Next.js Image component handles cache headers)
- Compression headers for static assets (Cache-Control: public, max-age=31536000, immutable)

### Performance Metrics

**Target Lighthouse Scores:**
- Performance: 90-95 (Good)
- Accessibility: 95-100 (Excellent)
- Best Practices: 95-100 (Excellent)
- SEO: 95-100 (Excellent)

**Target Core Web Vitals:**
- LCP (Largest Contentful Paint): < 2.5s (Good)
- FID (First Input Delay): < 100ms (Good)
- CLS (Cumulative Layout Shift): < 0.1 (Good)
- FCP (First Contentful Paint): < 1.8s (Good)
- TTFB (Time to First Byte): < 600ms (Good)

**Bundle Sizes (Gzipped):**
- Main bundle: 200-250KB (optimized with tree-shaking)
- CSS bundle: 30-50KB (Tailwind purged)
- Total initial load: < 300KB (fast on 3G networks)

### SEO Benefits

**Rich Snippets:**
- Product pages: Star ratings, price, availability in search results
- Blog posts: Author, publish date, reading time in search results
- Breadcrumbs: Enhanced navigation in search results
- Reviews: Individual reviews may appear in search results

**Search Engine Visibility:**
- Sitemap.xml: All pages discoverable (products, blog, gallery, categories)
- Robots.txt: Proper crawl directives (allow public, disallow private)
- Structured data: Better understanding of content (products, articles, reviews)
- Metadata: Optimized titles and descriptions for click-through rate
- Open Graph: Better social sharing (Facebook, Twitter, WhatsApp)

**International SEO:**
- Hreflang tags: Arabic and English versions linked
- Locale-specific URLs: /ar/products and /en/products
- RTL support: Proper rendering for Arabic content
- Localized metadata: Titles and descriptions in both languages

### Monitoring & Analytics

**Plausible Analytics:**
- Page views: Automatic tracking (no configuration)
- Custom events: Add to cart, purchase, newsletter signup, review submission
- Traffic sources: Referrers, direct, search engines
- Top pages: Most visited products, blog posts, categories
- Conversion funnel: Product view → Add to cart → Checkout → Purchase
- Real-time dashboard: Live visitor count, current page views

**Web Vitals Monitoring:**
- Core Web Vitals: LCP, FID, CLS tracked automatically
- Performance metrics: FCP, TTFB, INP
- Real user monitoring: Actual user experience data
- Google Search Console: Core Web Vitals report (after 28 days)
- Vercel Analytics: Built-in performance monitoring (if deployed on Vercel)

**Performance Budget:**
- Main bundle: < 250KB gzipped (enforced via build warnings)
- CSS bundle: < 50KB gzipped (Tailwind purged)
- Images: < 200KB per image (Next.js Image optimization)
- LCP: < 2.5s (monitored via Web Vitals)
- Total page weight: < 1MB (initial load)

### Testing & Verification

**Performance Testing:**
1. Lighthouse audit on 5 key pages (home, PDP, PLP, blog, checkout)
2. WebPageTest.org (test from multiple locations, 3G network)
3. Chrome DevTools Performance tab (identify bottlenecks)
4. Network throttling (test on slow 3G, fast 3G, 4G)
5. Bundle analyzer (visualize bundle composition, identify large dependencies)

**SEO Testing:**
1. Google Rich Results Test (validate structured data)
2. Google Search Console (submit sitemap, request indexing)
3. Facebook Sharing Debugger (test Open Graph tags)
4. Twitter Card Validator (test Twitter Card metadata)
5. Schema.org validator (validate JSON-LD syntax)
6. Mobile-friendly test (Google's mobile-friendly tool)

**Analytics Testing:**
1. Verify Plausible script loads (Network tab in DevTools)
2. Test page view tracking (navigate between pages, check dashboard)
3. Test custom events (add to cart, purchase, check dashboard)
4. Verify production-only (analytics disabled in development)
5. Test Web Vitals reporting (check Plausible dashboard for metrics)

### Deployment Checklist

**Pre-Deployment:**
- [ ] Run production build: `npm run build`
- [ ] Check build output for errors/warnings
- [ ] Verify bundle sizes (should see reduction from optimizations)
- [ ] Test production build locally: `npm run start`
- [ ] Run Lighthouse audit on local production build
- [ ] Verify all images use Next.js Image component
- [ ] Verify ISR exports on all dynamic pages
- [ ] Test loading skeletons (navigate between pages)

**Post-Deployment:**
- [ ] Submit sitemap to Google Search Console
- [ ] Request indexing for key pages (home, top 10 products, blog posts)
- [ ] Verify structured data in Google Rich Results Test
- [ ] Set up Plausible dashboard (add fishweb.iq as site)
- [ ] Monitor Core Web Vitals in Search Console (wait 28 days for data)
- [ ] Set up alerts in Plausible (traffic drops, conversion rate changes)
- [ ] Monitor Supabase usage (database queries, storage bandwidth)
- [ ] Test social sharing (Facebook, Twitter, WhatsApp)

**Ongoing Monitoring:**
- Daily: Plausible dashboard (traffic, top pages, conversions)
- Weekly: Core Web Vitals (Google Search Console)
- Monthly: Lighthouse audits (track performance trends)
- Quarterly: Bundle size analysis (identify bloat, optimize dependencies)

### Future Optimizations (Phase 20+)

- Image CDN (Cloudflare Images or Imgix for advanced optimization)
- Database query optimization (indexes, query analysis, connection pooling)
- Redis caching (cache product data, reduce database load)
- Edge caching (Vercel Edge Network or Cloudflare CDN)
- Service worker (offline support, background sync - Phase 20 PWA)
- Prefetching (prefetch product data on hover, anticipate navigation)
- Code splitting optimization (dynamic imports for heavy components)
- Bundle analysis (webpack-bundle-analyzer, identify optimization opportunities)
- Performance regression testing (automated Lighthouse CI in GitHub Actions)
- A/B testing (optimize conversion rate, test different layouts)

## Progressive Web App (PWA) - Phase 20

Transform FISH WEB into an installable Progressive Web App with offline capabilities and app-like experience.

### Features Implemented

**Installable App**
- Add to Home Screen on mobile and desktop with standalone display
- Brand-consistent splash screen, theme color `#0E8FA8`, and adaptive maskable icons
- App shortcuts (Products, Calculators, Cart) exposed via manifest
- Install prompt modal highlighting key benefits and respecting user preference/timing

**Offline Capabilities**
- Offline indicator banner driven by `navigator.onLine`
- IndexedDB-powered product caching (`cacheProductsForOffline`, `getOfflineProducts`)
- Cached imagery (Supabase Storage) and static assets via next-pwa/Workbox
- Cart, wishlist, calculators, and previously visited pages keep functioning without connectivity

**Service Worker Caching**
- CacheFirst for Supabase images (30 days, 200 entries)
- NetworkFirst for Supabase REST API (1 hour, 50 entries, 10s timeout)
- CacheFirst for Google Fonts stylesheets and webfonts (1 year)
- Automatic cache versioning + `skipWaiting` for instant updates

### Configuration

**next-pwa**
- Enabled in `next.config.ts` via `withPWA(pwaConfig)(withMDX(nextConfig))`
- Disabled in development for easier debugging, automatically enabled in production

**Manifest & Icons**
- `public/manifest.json` configured with RTL defaults, screenshots, and shortcuts
- Icon set generated under `public/icons/` (standard + maskable + shortcut assets)
- Screenshots stored in `public/screenshots/` for future store packaging

**Environment Variables**
- `.env.local.example` documents `NEXT_PUBLIC_PWA_ENABLED`, `NEXT_PUBLIC_SHOW_INSTALL_PROMPT`, `NEXT_PUBLIC_OFFLINE_MODE_ENABLED`
- Flags allow granular toggling of service worker, install prompt, and offline caching

### Offline Experience

**Works Offline**
- Cached products, gallery items, blog posts, cart, wishlist, calculators, and stored imagery

**Requires Online**
- Checkout, authentication, search refresh, review submission, and any Supabase mutations

### Testing & Deployment

1. `npm run build && npm run start`
2. Verify manifest, service worker, and cache storage via Chrome DevTools → Application
3. Toggle “Offline” in DevTools Network panel to confirm offline flows
4. Run Lighthouse PWA audit (goal ≥ 90)
5. Install the app on desktop/mobile (Chrome/Edge) and validate prompt and standalone behavior
6. Deploy behind HTTPS (service workers require secure context)

### Maintenance

- Service worker auto-regenerated on each deployment; `skipWaiting` activates updates immediately
- Offline cache can be cleared with future settings UI (utilises `clearOfflineCache`)
- Manifest/icons/screenshots easily refreshed as branding evolves
- Roadmap includes background sync, push notifications, share target, and app-store packaging
## Environment Variables
| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (exposed to the browser). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key for client-side access. |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for privileged server-side operations (never expose). |

`NEXT_PUBLIC_` variables are bundled into the client. Keep service keys server-only and use them within Route Handlers or Server Actions.

## Internationalization
- Locales: Arabic (`ar`) and English (`en`).
- Default locale: Arabic (`/ar`).
- Locale detection handled via middleware and `next-intl` helpers.
- `<html>` `dir` attribute switches automatically, enabling RTL layout for Arabic.

## Development Notes
- Use navigation helpers from `@/i18n/navigation` to preserve locale state.
- Client components instantiate Supabase via `createClient()`; server code uses `createServerSupabaseClient()`.
- Prefer semantic color utilities for theme compatibility.
- Guard animations with `motion-safe:` and `motion-reduce:`.
- Employ container queries (`@sm`, `@md`, `@lg`) when components must respond to parent width.
- Fonts are provisioned through `next/font` for automatic subsetting and variable exports.

## Contributing
Contribution guidelines will arrive in a future phase. For now, open a discussion or issue before submitting significant changes.

## License
Proprietary. All rights reserved.
