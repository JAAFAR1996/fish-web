# Known Issues & Limitations

This document captures outstanding gaps discovered after the Supabase → Drizzle/JWT/R2 migration. Each item notes priority and recommended follow-up actions.

---

## Priority Summary

| Category | Priority | Notes |
| --- | --- | --- |
| Critical user journeys | ⚠️ Medium | Functional but missing UX polish or automation. |
| Security & auth gaps | ⚠️ Medium | OAuth/phone/password reset still backlog. |
| Operational tooling | ⚠️ Medium | Monitoring, backups, automated tests pending. |
| Nice-to-have enhancements | 🔜 Low | Analytics depth, CMS, mobile app, multi-currency. |

Legend: 🔴 High · ⚠️ Medium · 🔜 Low

---

## Incomplete Cleanup (⚠️)
- Residual Supabase notes exist in older design docs; ensure future readers reference updated README.
- Remove unused environment variables from deployment pipelines.
- Verify infrastructure dashboards (Supabase, old buckets) are decommissioned to avoid costs.

**Next Steps:** Audit CI/CD secrets and config maps; delete legacy resources after backup confirmation.

---

## OAuth Providers (⚠️)
- Google / Apple OAuth removed during migration.
- Users relying on social login must transition to email/password.

**Next Steps:** Implement OAuth flow using NextAuth or custom OAuth handler tied to existing users table.

---

## Phone Authentication (🔜)
- SMS-based login/OTP (planned for Iraqi carriers) deferred.
- Current flow exposes phone inputs in UI but disabled.

**Next Steps:** Decide on SMS provider (Twilio, AWS SNS) and integrate with auth pipeline including rate limiting.

---

## Email Verification & Password Reset (⚠️)
- Email verification now handled via manual token routes; needs end-to-end QA + resend capability.
- Password reset flow not re-implemented post-migration.

**Next Steps:** Build request/confirm reset routes, secure token storage, and Resend templates.

---

## Admin User Management (⚠️)
- No UI for promoting/demoting admins or viewing users beyond placeholders.
- Deleting users does not cascade to all related data (requires caution).

**Next Steps:** Add admin-facing user table with actions; implement soft-delete and data retention policies.

---

## Bulk Operations (🔜)
- Product import/export, CSV order reconciliation, and bulk price updates missing.

**Next Steps:** Define preferred format (CSV, Google Sheets) and implement background job processing with progress feedback.

---

## Realtime vs. Polling (🔜)
- System relies on server actions + revalidation; no realtime subscriptions.

**Next Steps:** Evaluate WebSockets or SSE for live inventory/admin dashboards, or queue-based notifications.

---

## Image Optimization (⚠️)
- R2 delivers raw assets; no automatic resizing/thumbnails.

**Next Steps:** Introduce Cloudflare Images, Imgix, or Next.js Image Optimization with edge caching.

---

## Database Backups & Disaster Recovery (⚠️)
- Neon PITR is enabled but restore runbooks not documented.

**Next Steps:** Document backup cadence, create manual restore drill, and mirror production data to staging periodically.

---

## Error Monitoring & Logging (⚠️)
- Console logging only; no structured log aggregation or alerting.

**Next Steps:** Integrate Sentry or Logtail; emit structured events from server actions.

---

## Rate Limiting (⚠️)
- Upload endpoints protected by in-memory limiter; not clustered aware.

**Next Steps:** Move limiter to durable store (Redis, Upstash) and extend to auth-sensitive routes.

---

## Automated Testing Coverage (⚠️)
- Limited unit tests; no E2E automation.

**Next Steps:** Implement Playwright suite + CI gate, add Vitest/Jest coverage for core utilities.

---

## Analytics Depth (🔜)
- Plausible handles page views; lacks funnel/retention insights.

**Next Steps:** Extend custom events, consider Snowplow or Segment for deeper analytics.

---

## CMS / Content Workflow (🔜)
- Blog uses MDX files; no editor-friendly CMS.

**Next Steps:** Evaluate headless CMS (Sanity, Contentful) or Git-based CMS with preview pipeline.

---

## Mobile App Strategy (🔜)
- No native or React Native app; PWA covers basics.

**Next Steps:** Monitor PWA adoption, gather user feedback before investing in native app.

---

## Multi-Currency & Localization (🔜)
- Pricing fixed in IQD; no currency conversion or localized payment methods.

**Next Steps:** Explore currency APIs and cart recalculation flows; evaluate payment gateway support.

---

## Recommended Next Steps
1. Ship password reset + email verification polish (keeps auth parity with legacy system).
2. Stand up automated E2E tests covering signup → checkout → admin review.
3. Add observability stack (Sentry/log aggregation + Neon/R2 monitoring dashboards).
4. Plan image optimization roll-out (Cloudflare Images or Next.js Image route proxy).
5. Document backup/restore drills and run quarterly tests.

**Last Updated:** 2025-11-04
