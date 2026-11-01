# API documentation (v1)

Base path: `/api/v1`. All bodies are JSON unless noted. The schemas below are enforced by the zod validators in `api/validators/` (unknown fields are rejected with 422).

## Conventions

**Success envelope**

```json
{ "success": true, "message": "optional human message", "data": {}, "meta": {} }
```

`meta` appears on list endpoints: `{ "page": 1, "limit": 10, "total": 42, "totalPages": 5 }` (plus endpoint-specific keys).

**Error envelope**

```json
{ "success": false, "code": "VALIDATION_ERROR", "message": "Enter a valid email address",
  "details": [{ "location": "body", "field": "email", "message": "Enter a valid email address" }],
  "requestId": "6a0c…" }
```

| Status | Typical `code` values |
|-------:|----------------------|
| 400 | `BAD_REQUEST`, `INVALID_ID`, `INVALID_JSON`, `SELF_LOCKOUT`, `OWN_PRODUCT`, `INVALID_FILE_TYPE`, `FILE_REQUIRED` |
| 401 | `AUTH_REQUIRED`, `INVALID_CREDENTIALS`, `INVALID_SESSION`, `SESSION_EXPIRED`, `SESSION_REVOKED` |
| 403 | `FORBIDDEN`, `ACCOUNT_BLOCKED`, `CSRF_CHECK_FAILED` |
| 404 | `NOT_FOUND`, `ROUTE_NOT_FOUND` |
| 409 | `EMAIL_TAKEN`, `DUPLICATE`, `INVALID_TRANSITION`, `LAST_ADMIN` |
| 413 | `PAYLOAD_TOO_LARGE` |
| 422 | `VALIDATION_ERROR` |
| 429 | `RATE_LIMITED` |
| 5xx | `INTERNAL_ERROR`, `UPLOAD_FAILED` (502), `UPLOADS_DISABLED` (503) |

**Authentication.** Browser clients use the HttpOnly `smp_session` cookie set by login/register. Tools may send `Authorization: Bearer <jwt>` instead.
**CSRF.** Every `POST/PATCH/DELETE` must include `X-Requested-With: XMLHttpRequest` unless it uses a Bearer token.
**Rate limits.** 300 requests/min/IP on `/api`; 20 per 15 min/IP on login, register and change-password.
**Pagination.** `page` ≥ 1, `limit` 1–100 (defaults per endpoint). Multi-value filters repeat the key: `?category=home&category=books`.
**Request id.** Every response carries `X-Request-Id` (you may send your own, 8–64 chars `[A-Za-z0-9._-]`).

Legend: 🔓 public · 🔑 signed in · 🛡️ admin.

## System

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | 🔓 | Liveness `{ status: "ok", uptimeSeconds }` |
| GET | `/health/ready` | 🔓 | Readiness: pings MongoDB. 200 `{ status: "ready", database: "up" }` or 503 |

## Auth

| Method | Path | Auth | Body | Result |
|--------|------|------|------|--------|
| POST | `/auth/register` | 🔓 | `{ name (2–80), email, password (8–128, letter + digit) }` | 201 `{ user }`, sets cookie. 409 `EMAIL_TAKEN` |
| POST | `/auth/login` | 🔓 | `{ email, password }` | 200 `{ user }`, sets cookie. 401 `INVALID_CREDENTIALS`, 403 `ACCOUNT_BLOCKED` |
| POST | `/auth/logout` | 🔓 | – | Clears cookie |
| GET | `/auth/me` | 🔑 | – | `{ user }` |
| PATCH | `/auth/me` | 🔑 | `{ name }` | `{ user }` |
| POST | `/auth/change-password` | 🔑 | `{ currentPassword, newPassword }` | Revokes other sessions, re-issues cookie |

`user` shape: `{ _id, name, email, role, status, profilePicture, lastLoginAt, statusChangedAt, createdAt, updatedAt }`. Password hashes and `tokenVersion` are never returned.

```bash
curl -i -c jar.txt -H "Content-Type: application/json" -H "X-Requested-With: XMLHttpRequest" \
  -d '{"email":"you@example.com","password":"<password>"}' http://localhost:8000/api/v1/auth/login
curl -b jar.txt http://localhost:8000/api/v1/auth/me
```

## Users 🛡️

| Method | Path | Query / body | Notes |
|--------|------|--------------|-------|
| GET | `/users` | `q` (name/email, literal match), `role`, `status`, `sort` = `createdAt\|name\|email\|lastLoginAt`, `order` = `asc\|desc`, `page`, `limit` (default 10) | Paginated list |
| GET | `/users/export` | same filters (no paging) | CSV, ≤ 5 000 rows, formula-injection safe |
| GET | `/users/:id` | – | `{ user, stats: { products: {status: n}, bidsPlaced, bidsReceived }, activity: [auditLog] }` |
| PATCH | `/users/:id/status` | `{ status: "active" \| "blocked" }` | Not on self (`SELF_LOCKOUT`). Blocking revokes sessions. Audited. |
| PATCH | `/users/:id/role` | `{ role: "user" \| "admin" }` | Not on self; never demotes the last active admin (`LAST_ADMIN`). Audited. |

## Products

| Method | Path | Auth | Query / body | Notes |
|--------|------|------|--------------|-------|
| GET | `/products` | 🔓 | `q`, `category` (multi), `age` (multi: `0-2,3-5,6-8,9-12,13+`), `minPrice`, `maxPrice`, `sort` = `newest\|oldest\|price_asc\|price_desc`, `page`, `limit` (default 12) | Approved listings only; seller `{ _id, name }` |
| GET | `/products/mine` | 🔑 | `q`, `status`, `sort` = `createdAt\|name\|price`, `order`, paging | Caller's listings, any status |
| GET | `/products/manage` | 🛡️ | `q`, `status`, `category`, `seller`, `sort` (+`status`), `order`, paging | `meta.statusCounts` per status; seller name + email |
| GET | `/products/manage/export` | 🛡️ | same filters | CSV |
| GET | `/products/:id` | 🔓/🔑 | – | Non-approved listings are 404 unless owner/admin. Seller email only when signed in. |
| POST | `/products` | 🔑 | `{ name 2–120, description 10–2000, price ≥ 0, category, age 0–100 int, billAvailable?, warrantyAvailable?, accessoriesAvailable?, boxAvailable?, showBidsOnProductPage? }` | 201; always `pending`, seller = caller; admins notified |
| PATCH | `/products/:id` | 🔑 owner/🛡️ | any subset of the create fields | `seller` / `status` cannot be set |
| DELETE | `/products/:id` | 🔑 owner/🛡️ | – | Deletes its bids too (transaction). Admin deletes are audited. |
| PATCH | `/products/:id/status` | 🛡️ | `{ status }` | Allowed transitions only (409 `INVALID_TRANSITION`). Seller notified, audited. |
| POST | `/products/:id/images` | 🔑 owner/🛡️ | `multipart/form-data`, field `file` (JPEG/PNG/WebP/GIF ≤ 5 MB) | Max 10 images. 503 when Cloudinary is not configured. |
| DELETE | `/products/:id/images` | 🔑 owner/🛡️ | `{ url }` | Removes the URL from the listing |

## Bids

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/products/:id/bids` | 🔑 | `{ bidAmount > 0, message 1–500, mobile }`. Approved listings only, not your own. Seller notified. |
| GET | `/products/:id/bids` | 🔑 | Seller/admin: all bids with buyer email + phone (`meta.privileged: true`). Others: names/amounts only if `showBidsOnProductPage`, otherwise `meta.visible: false`. |
| GET | `/bids/mine` | 🔑 | Bids the caller placed (product + seller name) |
| GET | `/bids/received` | 🔑 | Bids on the caller's listings (product + buyer contact) |

## Notifications 🔑 (own only)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/notifications?unread=true&page&limit` | `meta.unreadCount` |
| PATCH | `/notifications/read-all` | `{ updated }` |
| PATCH | `/notifications/:id/read` | 404 if not yours |
| DELETE | `/notifications/:id` | 404 if not yours |

## Dashboard 🔑

`GET /dashboard/summary?days=7|30|90|365` (default 30). Days are UTC calendar days; the window includes today.

- **Admin** (`data.scope = "admin"`): `users { total, active, blocked, admins, newInRange, newInPreviousRange }`, `products { total, byStatus, byCategory[], newInRange, newInPreviousRange }`, `bids { total, inRange, inPreviousRange, volumeInRange }`, `trend [{ date, users, products, bids }]`, `recentUsers`, `recentProducts`, `recentActivity`.
- **User** (`scope = "user"`): `products { total, byStatus }`, `bidsPlaced`, `bidsReceived` (`total/inRange/inPreviousRange`), `unreadNotifications`, `trend [{ date, bidsPlaced, bidsReceived }]`, `recentBidsReceived`.

## Audit logs 🛡️

`GET /audit-logs?action=&targetType=user|product&page&limit` (default 20) → entries `{ actor, actorName, action, targetType, targetId, targetLabel, changes, requestId, createdAt }`.

## Removed legacy endpoints

The unversioned `/api/auth|user|product|bid|notification/...` routes were replaced; the bundled client was migrated in the same change. Mapping: `get-current-user` → `GET /auth/me`; `get-all-users` → `GET /users`; `update-user-status/:id` → `PATCH /users/:id/status`; `get-products` (POST) → `GET /products`, `/products/mine`, `/products/manage`; `add-product` → `POST /products`; `edit-product/:id` → `PATCH /products/:id`; `delete-product/:id` → `DELETE /products/:id`; `update-product-status/:id` → `PATCH /products/:id/status`; `upload-product-image` → `POST /products/:id/images`; `place-new-bid` → `POST /products/:id/bids`; `get-all-bids` → `GET /products/:id/bids`, `/bids/mine`, `/bids/received`; `notify` → removed (server-generated only); `get-all-notification` → `GET /notifications`; `read-all-notification` → `PATCH /notifications/read-all`; `delete-notification/:id` → `DELETE /notifications/:id`.

A machine-readable summary is in [openapi.yaml](openapi.yaml).
