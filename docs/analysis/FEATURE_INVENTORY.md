# Feature inventory

Discovered from the code (not the screenshot). For every feature: where it lives, who may use it, what it did before, what it does now, and how it is tested. Bug ids refer to [BUGS_AND_GAPS.md](BUGS_AND_GAPS.md).

Legend: **Existing** = present before modernization (verified in code) · **New** = added in this work.

## Authentication

| | Before | Now |
|---|---|---|
| Screens | `/login`, `/register` (antd forms) | Same routes, redesigned split layout, inline validation, password toggle, confirm-password, session/blocked notices |
| API | `POST /api/auth/login`, `/register` | `POST /api/v1/auth/login`, `/register`, `/logout`, `GET/PATCH /auth/me`, `POST /auth/change-password` |
| Model | users | users (+ `tokenVersion`, `lastLoginAt`) |
| Behaviour | JWT in localStorage; blocked users kept access (H1); errors 500 (H7) | HttpOnly cookie, server-side revocation, generic credential errors, auto sign-in after registration |
| Known issues | C5, H7–H9 | Forgot-password not implemented (no email service) |
| Tests | none | `api/tests/auth.test.js` (22), `LoginPage.test.jsx`, `guards.test.jsx`, E2E login/refresh/logout/back-button |

## Session restore and route protection (Existing, rebuilt)

Before: `ProtectedPage` wrapper with `user && ...` (blank screen, C4/C5). Now: `restoreSession` state machine, `RequireAuth`/`RequireRole`/`GuestOnly`, loader + retry screen, 403 and 404 pages, root and per-page error boundaries, legacy URL redirects. Tests: `guards.test.jsx`, `ErrorBoundary.test.jsx`, `apiClient.test.js`, E2E deep-link + refresh.

## Marketplace browsing (Existing)

| | Before | Now |
|---|---|---|
| Screen | `/` Home: grid + checkbox filters; search box did nothing (M3) | `/marketplace`: debounced search, category/age/price filters (drawer on mobile), sort, server pagination, URL-persisted state, skeletons, empty state |
| API | `POST /api/product/get-products` (public, leaked seller hashes C3, age bug M1) | `GET /api/v1/products` (approved only, public seller fields) |
| Tests | – | `products.test.js` marketplace block; E2E filters |

## Product detail and bidding (Existing)

Before: `/product/:id`, `BidModal` posting `buyer/seller` from the client and creating notifications client-side (H3/H4). Now: `/marketplace/:id` with gallery, condition details, seller card, bid list respecting privacy (H5), bid modal with validation; owner/non-approved states explained. API `GET /products/:id`, `GET|POST /products/:id/bids`. Permissions: any signed-in user except the owner, approved listings only. Tests: bids block in `products.test.js`, E2E detail + refresh.

## Seller listings (Existing: Profile → Products tab)

Before: unpaginated table, `window.confirm` deletes, image upload to any product id, edit of any product (H3). Now: `/my-products` with search, status segments, sort, pagination, create/edit modal (validated, "submitted for review" flow), photo manager (drag-and-drop, progress, cover, remove with confirm, 10-image/5 MB limits), bids drawer with contact details, delete confirmation. API `/products/mine`, `POST/PATCH/DELETE /products/:id`, `/products/:id/images`. Tests: ownership block in `products.test.js`.

## Bids overview (Existing: Profile → My Bids tab)

Before: bids placed only. Now: `/my-bids` with "Bids I placed" and "Bids on my listings" tabs, pagination, expandable messages. API `/bids/mine`, `/bids/received`.

## Notifications (Existing)

Before: modal opened from the header, all notifications loaded, anyone could create/delete any notification (H4). Now: header popover with unread badge, mark-one/mark-all read, delete, deep link (legacy `/admin`, `/profile` targets still work), 60-second polling while the tab is visible. Server-generated on: new listing (to admins), moderation decision (to seller), new bid (to seller). Tests: notifications block.

## Admin: product moderation (Existing: Admin → Products tab)

Before: unpaginated table, text links, unauthenticated status endpoint (C2). Now: `/admin/products` with status segments and counts, search, category and seller filters, sort, pagination, primary action button + action menu, confirmations for destructive actions, delete, CSV export, mobile list. Transitions validated server-side, seller notified, audit entry recorded.

## Admin: user management (Existing: Admin → Users tab)

Before: unpaginated table returning password hashes (C3), unauthenticated block endpoint accepting any field (C1), no session revocation (H1). Now: `/admin/users` with debounced search, role/status filters, sortable columns, page-size selector, avatar cells, status/role tags with icons, action menu (view, block/unblock, grant/remove admin), confirmation dialogs, detail drawer (stats, history), CSV export, mobile card list. Self-lockout and last-admin protection. Tests: `users.test.js` (13), E2E block/unblock + session revocation.

## New features

| Feature | Screen | API | Why |
|---------|--------|-----|-----|
| Dashboard (admin) | `/dashboard` | `GET /dashboard/summary` | Real aggregates: users (total/active/blocked/new, Δ vs previous period), listings by status/category, bids and offer volume, daily trend, newest users, recent listings, admin activity, review-queue call-out |
| Dashboard (user) | `/dashboard` | same (scoped) | Personal listings by status, bids placed/received with trend, latest offers, unread count |
| Audit log | `/admin/audit-logs` | `GET /audit-logs` | Accountability for blocking, role changes, moderation, admin deletes |
| Role management | Users page | `PATCH /users/:id/role` | Promote/demote with safeguards |
| CSV export | Users, moderation | `/users/export`, `/products/manage/export` | Filter-aware, formula-injection safe, 5 000-row cap |
| Account settings | `/account` | `PATCH /auth/me`, `POST /auth/change-password` | Edit name, change password (signs out other devices) |
| Dark theme | everywhere | – | Token-based; persisted per browser |
| Health checks | – | `/health`, `/health/ready` | Liveness vs MongoDB readiness for hosting platforms |

## Deliberately not built

Bulk selection (no bulk workflow exists and single actions are audited individually), admin "create user" (self-registration covers onboarding), global cross-module search (two modules each have their own search), real-time transport (polling suffices), forgot-password (needs an email provider).
