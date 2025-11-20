# Comprehensive Testing Checklist

Use this document as the canonical test plan after the Supabase → Drizzle/JWT/R2 migration. Sections follow the major user journeys and subsystems. Mark each item as ✅ (pass), ⚠️ (risk), or 🚧 (pending) when executing regression cycles.

---

## 1. Authentication & Session Management
- [ ] Email signup with valid data (happy path).
- [ ] Duplicate email signup gracefully rejected.
- [ ] Password policy enforced (min length, confirmation mismatch).
- [ ] Email signin success + session cookie set.
- [ ] Invalid password attempt returns translated error.
- [ ] Signout clears cookie + server session (verify DB token deleted).
- [ ] Session persistence between browser restarts.
- [ ] Session expiry (manually shorten token expiry and confirm refresh redirects).
- [ ] Admin access denied for non-admin user on `/admin`.
- [ ] JWT tampering detected (modify cookie, expect rejection).

## 2. Browsing & Search
- [ ] Home page renders featured sections for both locales.
- [ ] Category listing filters (in stock, price sort) behave correctly.
- [ ] Search autocomplete (≥2 chars) returns product/brand/category groupings.
- [ ] Search results page highlights terms and paginates correctly.
- [ ] Voice search button hidden on unsupported browsers.
- [ ] Fuse.js fallback used when DB search unavailable (simulate failure).

## 3. Cart Experience
- [ ] Guest can add/update/remove products from cart.
- [ ] Quantity validation prevents exceeding stock.
- [ ] Free-shipping progress bar updates in real time.
- [ ] Saved-for-later retains items between sessions (localStorage).
- [ ] Authenticated user cart persists via Drizzle tables.
- [ ] Guest cart merges into account on login (no duplicates).
- [ ] Sidebar cart interactions mirror main cart page.
- [ ] Cart revalidation triggers on server action completion.

## 4. Checkout Flow
- [ ] Authenticated user can proceed from cart to checkout.
- [ ] Shipping address CRUD (create, edit, delete, set default).
- [ ] Loyalty points application + balance update.
- [ ] Coupon/bundle discounts reflected in totals.
- [ ] Successful order writes `orders`, `order_items`, `transactions`.
- [ ] Confirmation page accessible via `/checkout/confirmation`.
- [ ] Emails (order confirmation, HTML rendering) sent via Resend.
- [ ] Failed payment / validation surfaces translated errors.

## 5. Reviews System
- [ ] Submit review with rating, copy, and images (enforces limits).
- [ ] Multiple image upload (validate size/type) uses R2 keys.
- [ ] Review edit allowed within 30-day window.
- [ ] Helpful/not helpful toggles tracked per user.
- [ ] Admin approval flow updates `isApproved` state.
- [ ] PDP aggregates ratings + review counts accurately.
- [ ] Image deletion from R2 when review removed.

## 6. Gallery (Community Setups)
- [ ] Browse gallery list filters (style, tank size, featured).
- [ ] Setup detail respects approval rules (non-owner cannot view unapproved).
- [ ] Hotspot popovers show correct product data + add-to-cart integration.
- [ ] New submission with hotspots uploads media to R2.
- [ ] Admin approval / feature toggles update listings.
- [ ] View counter increments once per visit.
- [ ] “Shop this setup” enqueues distinct products to cart.

## 7. Marketing Systems
- Loyalty Points:
  - [ ] Points awarded on qualifying orders.
  - [ ] Redemption reduces balance and logs transaction.
  - [ ] Expired points routine runs without errors.
- Referrals:
  - [ ] Referral link applies credit to new signups.
  - [ ] Reward issued when referred order completes.
- Flash Sales & Bundles:
  - [ ] Flash sale pricing overrides base price on PDP/cart.
  - [ ] Bundles apply group discount + inventory check.
- Coupons:
  - [ ] Percentage & fixed coupons obey usage rules (global, per-user).
- Newsletter:
  - [ ] Newsletter subscription writes to DB + triggers Resend welcome email.

## 8. Admin Dashboard
- [ ] Product CRUD (create/edit/delete) persists and revalidates storefront.
- [ ] Inventory restock updates stock counts and triggers back-in-stock notifications if configured.
- [ ] Order status transitions (pending → confirmed → shipped → delivered) enforce allowed graph.
- [ ] Tracking details send shipping update email + notification.
- [ ] Sales reports render with accurate sums for date ranges.
- [ ] Audit log records entity changes with before/after data.
- [ ] Access control: non-admin blocked from admin pages/actions.

## 9. Notifications System
- [ ] In-app notifications list for order updates + marketing events.
- [ ] Mark-as-read and clear-all actions persist.
- [ ] Notify-me (back in stock) request deduplication (email + authenticated).
- [ ] Email delivery for notify-me once stock replenished.

## 10. Calculators
- [ ] Heater calculator outputs correct wattage recommendations.
- [ ] Filter calculator validates tank size and suggests options.
- [ ] Saved calculations persist per user.
- [ ] Locale translations render correctly on calculators page.

## 11. Internationalization
- [ ] Locale switcher maintains current route (`/ar` ↔ `/en`).
- [ ] All major flows translated (auth errors, cart, checkout, admin).
- [ ] Numeric formats (currency, date) respect locale.
- [ ] RTL layout validated on mobile + desktop.

## 12. PWA & Offline
- [ ] Service worker registered in production build.
- [ ] Install prompt shown once per browser session.
- [ ] Offline browsing for cached products, cart, wishlist works (DevTools offline).
- [ ] Fallback UI for actions requiring network (checkout, auth).
- [ ] App shortcuts launch correct pages.
- [ ] Manifest + icons validated via Lighthouse PWA audit.

## 13. Performance & SEO
- [ ] Lighthouse Performance ≥ 90 for both locales (desktop/mobile).
- [ ] CLS < 0.1 across homepage, PDP, checkout.
- [ ] `sitemap.xml` + `robots.txt` accessible and correct.
- [ ] Open Graph/Twitter cards render with valid metadata.
- [ ] Structured data tests pass (Product, Review, BlogPosting).

## 14. Error Handling & Security
- [ ] 404/500 pages localized and informative.
- [ ] Rate limiter blocks rapid upload abuse (`checkUploadRateLimit`).
- [ ] Input validation prevents SQL injection / XSS (test malicious payloads).
- [ ] Sensitive routes require CSRF-safe server actions only (no GET mutations).
- [ ] R2 credentials never exposed client-side (network tab verification).
- [ ] JWT secret rotation invalidates prior sessions.

## 15. Database Integrity
- [ ] Foreign keys enforced (orders→users, reviews→products).
- [ ] Cascading deletes behave as expected (delete user → cleanup).
- [ ] Background cron/resolver jobs (e.g., loyalty expiration) respect transactions.
- [ ] Drizzle migrations align with actual schema (`npm run db:studio` sanity check).

## 16. Cross-Browser & Responsive
- [ ] Chrome (desktop/mobile), Safari (iOS), Firefox, Edge smoke tests.
- [ ] Responsive breakpoints (320px, 768px, 1024px, 1440px).
- [ ] Touch gestures (carousel swipe, hotspot pan) on mobile.
- [ ] Voice search fallback on Safari/Firefox (button hidden).

## 17. Post-Migration Verification
- [ ] No Supabase packages in `package.json`.
- [ ] `src/lib/supabase/` removed; imports resolved.
- [ ] Environment variables updated (`DATABASE_URL`, `JWT_SECRET`, `R2_*`, etc.).
- [ ] R2 uploads succeed for reviews/gallery/admin products.
- [ ] Search API uses Postgres(Fuse) path and returns `source` field correctly.
- [ ] Supabase URLs absent from CSP headers and service worker runtime caching.

## 18. Automated Testing Recommendations
- [ ] Add Jest or Vitest unit tests for auth, cart, pricing utilities.
- [ ] Implement Playwright E2E suite covering signup, cart→checkout, admin CRUD.
- [ ] Integrate Lighthouse CI in pipeline for performance regressions.
- [ ] Schedule nightly database integrity checks (Drizzle + SQL assertions).
- [ ] Monitor Resend email delivery with mocked tests in CI (dry-run).

---

**Last Updated:** 2025-11-04
