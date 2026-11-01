# Bugs and gaps (pre-modernization)

Findings from reading the original code (commit `f061d23`) and probing the running API. Each item is marked **Verified** (reproduced or proven from code paths) or **Suspected**. All items below are fixed unless the status column says otherwise.

Severity: **Critical** = exploitable by any visitor or causes total failure; **High** = data exposure, privilege issues or broken core flows; **Medium** = incorrect behaviour with a workaround; **Low** = polish.

## Critical

| # | Finding | Evidence | Impact | Status |
|---|---------|----------|--------|--------|
| C1 | **Unauthenticated privilege escalation.** `PUT /api/user/update-user-status/:id` had no auth middleware and passed `req.body` straight to `findByIdAndUpdate`. | `api/routes/user.route.js`, `user.controller.js` | Anyone could set any user's `role` to `admin`, change `email`/`password` hash, or unblock themselves. | Fixed: admin-only `PATCH /users/:id/status` and `/role`, strict body schema. Tested. |
| C2 | **Unauthenticated product moderation.** `PUT /api/product/update-product-status/:id` had no auth. | `product.route.js` | Anyone could approve/block any listing. | Fixed: admin-only, validated transitions. Tested. |
| C3 | **Password hashes leaked.** `GET /api/user/get-all-users` (any logged-in user) returned full user documents including bcrypt hashes; `POST /api/product/get-products` (no auth) populated full `seller` documents including hashes and emails. | Controllers return raw documents | Offline cracking of every password; email harvesting. | Fixed: `password` is `select: false`, explicit serializers, seller projection. Tested. |
| C4 | **Blank screen / logout loop in production.** With `NODE_ENV=production`, `app.get("*")` (SPA fallback) was registered **before** the API routers, so every `GET /api/...` returned `index.html` with HTTP 200. The client then read `response.success` as `undefined`, showed an empty error toast and logged the user out on every page. | Verified by running the original server with `NODE_ENV=production`: `GET /api/user/get-current-user` → `200 text/html`, even with a valid token. | Production app unusable after login. | Fixed: API mounted first, SPA fallback last, `/api/*` 404 returns JSON; client rejects HTML API responses. Covered by E2E (runs the production build). |
| C5 | **Blank screen on refresh/deep link.** In the committed `ProtectedPage`, nothing restored the user on mount and the component rendered `user && (...)`, so a refresh rendered nothing. An uncommitted local change added the restore effect but kept `user && ...` (still blank while loading and permanently blank if `/get-current-user` returned `data: null`). | `client/src/components/ProtectedPage.jsx` (HEAD vs working tree) | Blank page on refresh/direct navigation. | Fixed: auth bootstrap with explicit `idle/loading/authenticated/unauthenticated/error` states, guards that render a loader, error boundary. The uncommitted change was preserved in `docs/implementation/preserved-uncommitted-ProtectedPage.patch`. |

## High

| # | Finding | Evidence | Status |
|---|---------|----------|--------|
| H1 | Blocking did not end existing sessions: `verifyToken` only checked the JWT signature; blocked users kept full access for up to 24 h. | `utils/verifyToken.js` | Fixed: user status is checked on every request and blocking increments `tokenVersion` (revokes all sessions). Tested. |
| H2 | Admin page protection was client-only (`Admin.jsx` redirect in `useEffect`); `GET /get-all-users` was available to any user. | `pages/admin/Admin.jsx` | Fixed: `requireRole("admin")` on every admin endpoint; 403 page in the UI. |
| H3 | Mass assignment on product create/edit and bids: the client chose `seller`, `status`, `buyer`; anyone could edit/delete **any** product (no ownership check). | `addProduct`, `editProduct`, `deleteProduct`, `newBid` | Fixed: server sets owner/status, ownership checks, strict schemas. Tested. |
| H4 | Anyone could create notifications for any user (`POST /api/notification/notify`) and delete anyone's notification by id. | `notification.controller.js` | Fixed: notifications are server-generated only; read/delete scoped to owner. Tested. |
| H5 | Bid listing (`POST /api/bid/get-all-bids`) returned every bid with buyer emails/phones to any user; filter values came straight from the body (operator injection possible). | `bid.controller.js` | Fixed: seller/admin see contact details; others only when the seller opted in, without contact data. |
| H6 | `addProduct` notified admins with `role: "asmin"` (typo), so admins were never notified; had it matched, `req.user.name` was undefined and would have crashed. | `product.controller.js` | Fixed. |
| H7 | Login error codes: unknown email returned 500 "User not exist" (user enumeration + wrong status); blocked state revealed before password check. | `auth.controller.js` | Fixed: generic 401; blocked disclosed only after a correct password (403). |
| H8 | `register` called `next()` on missing fields and **continued executing** (double response / crash). | `auth.controller.js` | Fixed: schema validation. |
| H9 | JWT in `localStorage` (readable by any XSS) and token printed to server logs on every request (`console.log("token ", token)`). | `verifyToken.js`, `Login.jsx` | Fixed: HttpOnly SameSite=Lax cookie, CSRF header check, logger redacts secrets. |
| H10 | Vulnerable dependencies: 9 production advisories (1 critical `proxy-addr`, `path-to-regexp` ReDoS, `qs`, `jws`, `cloudinary`, `multer`, `mongoose`), 29 in the client tree. | `npm audit` | Fixed for production deps (0 remaining). See SECURITY_AUDIT.md for remaining dev-only items. |

## Medium

| # | Finding | Status |
|---|---------|--------|
| M1 | Age filter loop overwrote `filters.age` so only the **last** selected range applied. | Fixed (`$or` of ranges). Tested. |
| M2 | No pagination anywhere: users, products, bids, notifications loaded whole collections. | Fixed: server-side pagination with page-size caps. |
| M3 | Home search box was non-functional (no handler). | Fixed: debounced server-side search. |
| M4 | Product status default was the typo `"panding"`. | Fixed default; migration script corrects legacy docs (0 found in current DB). |
| M5 | Category stored with inconsistent case (`Electronics` vs `electronics`), breaking filters. | Schema lowercases; migration fixes 1 legacy document (dry run verified). |
| M6 | Vite proxy pointed to `:8000` while the server defaulted to `:8500` when `PORT` was unset. | Defaults aligned to 8000; proxy target configurable. |
| M7 | DB connection errors were only logged; the server kept serving requests that hung. | Fixed: fail fast on startup, readiness endpoint. |
| M8 | Image upload wrote temp files to disk, no type/size checks, any product id accepted. | Fixed: memory storage, MIME allow-list, 5 MB cap, ownership check, 10-image cap. |
| M9 | Bid `mobile` stored as Number (drops leading zeros/`+`). | Stored as string going forward; old numeric values normalised on read. |
| M10 | Global spinner overlay for every request; errors swallowed (`return new Error(...)` without throwing in admin pages). | Fixed: per-view loading/error/empty states. |
| M11 | `client/package.json` depended on the root package (`"mern-smp": "file:.."`), pulling the server into the client tree. | Removed. |
| M12 | No error boundary: any render exception (e.g. product whose seller was deleted → `product.seller._id`) blanked the app. | Fixed: root and per-page boundaries; null-safe rendering. |

## Low

- `moment` (deprecated, large) → replaced by `dayjs` (already an antd dependency).
- Remixicon loaded from a CDN at runtime → replaced by bundled `@ant-design/icons`.
- 57 ESLint problems in the original client.
- No tests, no `.env.example`, no README for the real project.

## Remaining gaps (not fixed, by decision)

| Gap | Reason | Recommendation |
|-----|--------|----------------|
| Forgot/reset password | No email delivery service is configured. | Add an email provider, then a token-based reset flow. |
| Cloudinary asset deletion when a photo is removed | URL → public_id mapping is not stored for legacy images. | Store `public_id` on upload, then destroy on removal. |
| Owner edits do not send an approved listing back to review | Business-rule change; needs owner sign-off. | Decide whether edits to price/description require re-approval. |
| Admin "create user" | Self-registration exists; no requirement found. | Add only if onboarding requires it. |
