# Overview

FISH WEB is a modern, RTL-first e-commerce platform for premium aquarium equipment in Iraq. Built with Next.js 14 App Router, it provides a full-featured online store with bilingual support (Arabic/English), comprehensive product filtering, user authentication, shopping cart management, blog content, interactive calculators, and administrative tools. The application emphasizes accessibility, performance, and a seamless user experience for aquarium enthusiasts.

**Deployment Platform**: Replit (migrated from Vercel on 2025-11-01)

# Recent Changes

**2025-11-01**: Began Supabase to Neon Postgres Migration
- ✅ Installed Drizzle ORM and dependencies (`drizzle-orm`, `@neondatabase/serverless`, `ws`)
- ✅ Created comprehensive Drizzle schema (`server/schema.ts`) with all tables
- ✅ Added database management scripts (`db:push`, `db:generate`, `db:studio`)
- ✅ Successfully pushed database schema to Neon Postgres
- ⚠️ **Migration In Progress**: Authentication system still uses Supabase Auth
- ⚠️ **Migration In Progress**: Database queries still use Supabase client
- 📝 See `MIGRATION_STATUS.md` for detailed migration progress and next steps

**2025-11-01**: Migrated from Vercel to Replit
- Configured dev/start scripts to bind to port 5000 with host 0.0.0.0
- Added Cache-Control headers for development (no-store) to prevent caching issues in Replit's iframe
- Fixed middleware matcher pattern for compatibility with Replit routing
- Added `allowedDevOrigins: ['*']` to next.config.mjs for Replit iframe compatibility
- Removed `typedRoutes` experimental feature (not supported without turbopack)
- Disabled turbopack mode for better compatibility
- Configured deployment settings for Replit autoscale

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: Next.js 14 with App Router and React 18
- TypeScript strict mode for type safety
- Server Components by default with selective Client Components
- Streaming and Suspense for optimal loading states
- File-based routing with locale-prefixed paths (`/ar`, `/en`)

**Styling & UI**
- Tailwind CSS with custom design system (aqua, sand, coral color palettes)
- RTL-first design with automatic direction switching
- Dark mode support via `next-themes`
- Custom component library in `src/components/ui/`
- Container queries and typography plugins

**State Management**
- React Context providers for global state (Auth, Cart, Wishlist, Notifications)
- Server Actions for mutations
- Client-side caching via React hooks
- Local storage for cart persistence

**Internationalization**
- `next-intl` for translations with locale routing
- Separate message files (`messages/ar.json`, `messages/en.json`)
- Dynamic locale switching without page reload
- RTL/LTR automatic layout adjustment

**Component Organization**
```
src/components/
├── ui/           - Reusable primitives (Button, Input, Modal, etc.)
├── layout/       - Navigation, Header, Footer
├── products/     - Product cards, filters, PDP components
├── cart/         - Shopping cart UI
├── auth/         - Authentication forms
├── account/      - User account management
├── admin/        - Admin dashboard
├── calculators/  - Interactive aquarium calculators
├── blog/         - MDX blog components
└── providers/    - Context providers
```

## Backend Architecture

**Database**: Neon Postgres (via Replit) with Drizzle ORM
- PostgreSQL 15+ with connection pooling
- Schema defined in `server/schema.ts`
- Migrations managed via `drizzle-kit`
- Database schema includes:
  - User management: `users`, `profiles`, `sessions`
  - E-commerce: `products`, `carts`, `cart_items`, `orders`, `order_items`
  - Shipping: `saved_addresses`, `shipping_rates`
  - Marketing: `flash_sales`, `bundles`, `coupons`, `loyalty_points`, `referrals`, `newsletter_subscribers`
  - Community: `reviews`, `helpful_votes`, `wishlists`, `notify_me_requests`, `gallery_setups`
  - Admin: `admin_audit_logs`
  - User tools: `saved_calculations`, `notifications`

**Database Management Scripts**:
- `npm run db:push` - Push schema changes to database
- `npm run db:generate` - Generate migration files
- `npm run db:studio` - Open Drizzle Studio UI

**Authentication** ⚠️ *Migration in progress*
- Currently: Supabase Auth with:
  - Email/password authentication
  - Google OAuth
  - Session management via `@supabase/ssr`
  - Cookie-based auth state
- Target: Custom session-based auth with JWT tokens
  - Password hashing with `bcryptjs`
  - Session tokens with `jose`
  - Server-side session validation

**Server Actions** (in `src/lib/`)
- `auth/actions.ts` - Sign up, sign in, password updates
- `cart/cart-actions.ts` - Add/remove items, update quantities
- `wishlist/wishlist-actions.ts` - Wishlist management
- `admin/*-actions.ts` - Admin product, order, inventory management
- `marketing/*-actions.ts` - Newsletter, loyalty, referral operations

**Data Fetching** ⚠️ *Migration in progress*
- Current: Supabase client for all database operations
  - Server Components use `createServerSupabaseClient()`
  - Client Components use `createBrowserSupabaseClient()`
- Target: Drizzle ORM with server-only queries
  - All database access through `server/db.ts`
  - No client-side database queries
  - Server Actions and Server Components only

## Key Features

**E-commerce**
- Product catalog with advanced filtering (category, brand, tank size, flow rate)
- Real-time search with Fuse.js fuzzy matching
- Shopping cart with saved-for-later functionality
- Wishlist with move-to-cart capability
- Product reviews with image uploads
- Flash sales, bundles, and upsell recommendations

**Marketing & Loyalty**
- Loyalty points system with earning and redemption
- Referral program with unique codes and tracking
- Newsletter subscription with bilingual email templates (Resend integration)
- Flash sales with countdown timers
- Product bundles with automatic detection

**User Experience**
- Interactive calculators (heater wattage, filter flow rate, salinity)
- MDX-powered blog with categories and related posts
- User-submitted aquarium gallery with approval workflow
- Progressive Web App (PWA) with offline support
- Notification center with in-app and email preferences

**Admin Dashboard**
- Product CRUD with image uploads to Supabase Storage
- Order management with status tracking
- Inventory monitoring with low-stock alerts
- Sales reports with charts (Recharts)
- User management interface

## Security & Performance

**Security Measures**
- Content Security Policy (CSP) with nonce-based script execution
- CSP violation reporting endpoint (`/api/security/csp-report`)
- Row Level Security on all database tables
- Input validation on forms and server actions
- CSRF protection via SameSite cookies

**Performance Optimizations**
- Next.js Image optimization with priority loading
- Font optimization (Cairo for Arabic, Inter for English)
- Static site generation where applicable
- Dynamic imports for code splitting
- `next-pwa` for service worker and caching
- Plausible Analytics for privacy-focused tracking

**Middleware Pipeline**
- Request ID generation for logging
- CSP nonce injection
- Locale detection and routing
- Session validation and refresh
- Security headers application

## External Dependencies

**Third-Party Services**
- **Neon Postgres** (via Replit): Primary database
- **Supabase** ⚠️ *Being phased out*: Currently used for auth and storage
- **Resend**: Transactional email delivery (newsletter welcome emails)
- **Plausible**: Privacy-focused web analytics

**Key NPM Packages**
- `drizzle-orm`, `@neondatabase/serverless` - Database ORM and connection
- `drizzle-kit` - Database migrations and schema management
- `bcryptjs` - Password hashing
- `jose`, `jsonwebtoken` - JWT tokens for authentication
- `@supabase/supabase-js`, `@supabase/ssr` ⚠️ *Being phased out*
- `next-intl` - Internationalization
- `next-themes` - Dark mode
- `fuse.js` - Client-side search
- `recharts` - Admin analytics charts
- `lucide-react` - Icon library
- `@mdx-js/react`, `next-mdx-remote` - Blog content
- `gray-matter` - Frontmatter parsing
- `reading-time` - Blog reading estimates
- `rehype-*`, `remark-*` - MDX plugins

**Storage** ⚠️ *Migration pending*
- Current: Supabase Storage for product images, review uploads, gallery images
- Target: Replit Object Storage or external service (S3, Cloudflare R2)
- Local storage for cart state persistence
- Session storage for temporary form data

**Email Templates**
- HTML templates in `src/lib/email/templates/`
- Bilingual support (Arabic RTL, English LTR)
- Resend API integration for delivery