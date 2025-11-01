# Overview

FISH WEB is a modern, RTL-first e-commerce platform for premium aquarium equipment in Iraq. Built with Next.js 14 App Router, it provides a full-featured online store with bilingual support (Arabic/English), comprehensive product filtering, user authentication, shopping cart management, blog content, interactive calculators, and administrative tools. The application emphasizes accessibility, performance, and a seamless user experience for aquarium enthusiasts.

**Deployment Platform**: Replit (migrated from Vercel on 2025-11-01)

# Recent Changes

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

**Database**: Supabase (PostgreSQL)
- Row Level Security (RLS) policies for data access control
- Real-time subscriptions for live updates
- Database schema includes:
  - `products` - Product catalog
  - `profiles` - Extended user data (linked to auth.users)
  - `cart_items` - Shopping cart persistence
  - `wishlist_items` - Saved products
  - `saved_addresses` - User shipping addresses
  - `orders` - Order management
  - `reviews` - Product reviews
  - `notifications` - In-app notifications
  - `saved_calculations` - Calculator results
  - `gallery_setups` - User-submitted aquarium setups
  - Marketing tables: `flash_sales`, `bundles`, `loyalty_points`, `referrals`, `newsletter_subscribers`

**Authentication**
- Supabase Auth with multiple providers:
  - Email/password
  - Google OAuth
  - Phone/OTP (configured but implementation varies)
- Session management via `@supabase/ssr`
- Middleware-based session refresh
- Cookie-based auth state persistence

**Server Actions** (in `src/lib/`)
- `auth/actions.ts` - Sign up, sign in, password updates
- `cart/cart-actions.ts` - Add/remove items, update quantities
- `wishlist/wishlist-actions.ts` - Wishlist management
- `admin/*-actions.ts` - Admin product, order, inventory management
- `marketing/*-actions.ts` - Newsletter, loyalty, referral operations

**Data Fetching**
- Server Components fetch data directly from Supabase
- Client Components use browser Supabase client
- `createServerSupabaseClient()` for authenticated server requests
- `createBrowserSupabaseClient()` for client-side queries

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
- **Supabase**: Database, authentication, storage, real-time subscriptions
- **Resend**: Transactional email delivery (newsletter welcome emails)
- **Plausible**: Privacy-focused web analytics

**Key NPM Packages**
- `@supabase/supabase-js`, `@supabase/ssr` - Backend integration
- `next-intl` - Internationalization
- `next-themes` - Dark mode
- `fuse.js` - Client-side search
- `recharts` - Admin analytics charts
- `lucide-react` - Icon library
- `@mdx-js/react`, `next-mdx-remote` - Blog content
- `gray-matter` - Frontmatter parsing
- `reading-time` - Blog reading estimates
- `rehype-*`, `remark-*` - MDX plugins

**Storage**
- Supabase Storage for product images and review uploads
- Local storage for cart state persistence
- Session storage for temporary form data

**Email Templates**
- HTML templates in `src/lib/email/templates/`
- Bilingual support (Arabic RTL, English LTR)
- Resend API integration for delivery