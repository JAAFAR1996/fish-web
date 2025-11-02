# Supabase to Neon Postgres Migration Status

## Overview
This project is currently in the process of migrating from Supabase to Replit's Neon Postgres database. The migration involves transitioning from Supabase's managed services to self-managed authentication and direct PostgreSQL access via Drizzle ORM.

## What's Been Completed ✅

### 1. Database Setup
- ✅ Installed Drizzle ORM (`drizzle-orm`, `@neondatabase/serverless`, `ws`)
- ✅ Installed auth dependencies (`bcryptjs`, `jsonwebtoken`, `jose`)
- ✅ Created comprehensive Drizzle schema (`server/schema.ts`) mirroring all Supabase tables
- ✅ Added database scripts to `package.json`:
  - `npm run db:generate` - Generate migrations
  - `npm run db:push` - Push schema to database
  - `npm run db:studio` - Open Drizzle Studio
- ✅ Successfully pushed schema to Neon Postgres database
- ✅ Database connection configured via `DATABASE_URL` environment variable

### 2. Schema Coverage
The following tables have been created in Neon Postgres:
- User management: `users`, `profiles`, `sessions`
- E-commerce: `products`, `carts`, `cart_items`, `orders`, `order_items`
- Shipping: `saved_addresses`, `shipping_rates`
- Marketing: `flash_sales`, `bundles`, `coupons`, `loyalty_points`, `referrals`, `newsletter_subscribers`
- Community: `reviews`, `helpful_votes`, `wishlists`, `notify_me_requests`, `gallery_setups`
- Admin: `admin_audit_logs`
- User tools: `saved_calculations`, `notifications`

## What Still Needs Migration ⚠️

### 1. Authentication System (HIGH PRIORITY)
**Current State**: Using Supabase Auth with:
- Email/password authentication
- Google OAuth
- Session management via `@supabase/ssr`
- Cookie-based auth state

**Required Changes**:
- [ ] Create custom session-based authentication using the `users` and `sessions` tables
- [ ] Replace `src/lib/auth/actions.ts` - sign up/sign in logic
- [ ] Replace `src/lib/auth/utils.ts` - session validation helpers
- [ ] Replace `src/lib/auth/middleware.ts` - session refresh middleware
- [ ] Replace `src/components/providers/SupabaseAuthProvider.tsx` - auth context
- [ ] Implement password hashing with `bcryptjs`
- [ ] Implement JWT session tokens with `jose`
- [ ] Optional: Set up OAuth providers (Google) manually

**Files to Update**:
```
src/lib/auth/
├── actions.ts          - Server actions for auth
├── middleware.ts       - Session validation
├── utils.ts            - Helper functions
└── session.ts          - NEW: Session management utilities

src/components/providers/
└── SupabaseAuthProvider.tsx  - Auth context provider
```

### 2. Database Query Migration (MEDIUM PRIORITY)
**Current State**: All database queries use Supabase client:
- `createServerSupabaseClient()` for server-side queries
- `createBrowserSupabaseClient()` for client-side queries
- Supabase RLS policies for data access control

**Required Changes**:
- [ ] Replace all `supabase.from('table')` queries with Drizzle queries
- [ ] Implement server-side-only data access (no browser client)
- [ ] Move all data fetching to Server Components or Server Actions
- [ ] Re-implement access control logic in application layer

**Affected Areas**:
- All files in `src/lib/*/actions.ts` (cart, wishlist, admin, marketing, etc.)
- Server Components that fetch data
- API routes

### 3. File Storage Migration (MEDIUM PRIORITY)
**Current State**: Using Supabase Storage for:
- Product images (`product-images` bucket)
- Review images (`review-images` bucket)
- Gallery images (`gallery-images` bucket)

**Options**:
1. **Use Replit Object Storage** (Recommended)
   - Native Replit service
   - Simple API
   - Good for this use case
   
2. **External Service** (Alternative)
   - AWS S3, Cloudflare R2, or similar
   - More setup required
   - Better for production scale

3. **Local File System** (Development only)
   - Quick temporary solution
   - Not suitable for production

**Required Changes**:
- [ ] Choose storage solution
- [ ] Update image upload logic in admin actions
- [ ] Update image URL references
- [ ] Migrate existing images (if any)

### 4. Email Service (LOW PRIORITY)
**Current State**: Using Resend for newsletter emails

**Status**: ✅ No changes needed - Resend integration can remain as-is

### 5. Environment Variables
**Current Requirements**:
```env
# Supabase (to be removed)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_URL=

# Database (already set)
DATABASE_URL=

# New requirements
JWT_SECRET=                    # For session tokens
SESSION_COOKIE_NAME=auth_token # Optional, defaults to 'auth_token'

# Optional
RESEND_API_KEY=               # For emails (if using)
```

### 6. Code Removal
After migration is complete:
- [ ] Remove `@supabase/supabase-js` package
- [ ] Remove `@supabase/ssr` package
- [ ] Delete `src/lib/supabase/` directory
- [ ] Remove Supabase environment variable references
- [ ] Update `src/lib/env.ts` and `src/lib/env.server.ts`

## Migration Approach Recommendations

### Phase 1: Authentication (Start Here)
1. Create a new auth system in parallel with Supabase
2. Test thoroughly with a few test users
3. Switch over authentication when ready
4. Keep Supabase auth active temporarily as fallback

### Phase 2: Database Queries
1. Start with one feature area (e.g., cart)
2. Convert queries to Drizzle one file at a time
3. Test each conversion thoroughly
4. Move to next feature area

### Phase 3: File Storage
1. Set up new storage solution
2. Update upload logic
3. Optionally migrate existing files
4. Update URL references

### Phase 4: Cleanup
1. Remove Supabase packages
2. Clean up environment variables
3. Remove unused code
4. Test entire application

## Helpful Resources

### Drizzle ORM
- [Drizzle Queries](https://orm.drizzle.team/docs/rqb)
- [Neon Serverless](https://orm.drizzle.team/docs/get-started-postgresql#neon-serverless)

### Authentication
- [Next.js Authentication Patterns](https://nextjs.org/docs/app/building-your-application/authentication)
- [Jose JWT Library](https://github.com/panva/jose)
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js)

### Replit Services
- [Replit Database](https://docs.replit.com/hosting/databases/postgresql)
- [Replit Object Storage](https://docs.replit.com/hosting/deployments/object-storage)

## Testing Checklist

Before considering migration complete:
- [ ] Users can sign up with email/password
- [ ] Users can log in and session persists
- [ ] Users can log out
- [ ] Cart functionality works (add, remove, update)
- [ ] Wishlist functionality works
- [ ] Order placement works
- [ ] Product reviews can be submitted
- [ ] Admin can manage products
- [ ] Images upload and display correctly
- [ ] All protected routes require authentication
- [ ] Session expires correctly
- [ ] No Supabase errors in console

## Current Blockers

1. **Supabase Environment Variables Missing**: The application expects Supabase credentials but they're not configured. This will prevent the app from running until:
   - Migration is completed, OR
   - Supabase credentials are provided temporarily

## Next Steps

1. **Decision Required**: Do you want to:
   - A) Complete the full migration to custom auth (recommended for long-term)
   - B) Set up Supabase credentials temporarily to keep the app running while planning migration
   - C) Start with a minimal auth system and expand gradually

2. **If proceeding with migration**:
   - Start with authentication system implementation
   - Test thoroughly with Drizzle database
   - Migrate queries incrementally

3. **If using Supabase temporarily**:
   - Provide Supabase project credentials
   - Keep current implementation working
   - Plan migration timeline

---

**Last Updated**: 2025-11-01
**Status**: Database schema ready, awaiting authentication implementation
