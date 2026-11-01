# Target architecture (implemented)

The current state of the system. For the original design see [PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md); for collections and indexes see [DATABASE_DESIGN.md](DATABASE_DESIGN.md); for endpoints see [../api/API_DOCUMENTATION.md](../api/API_DOCUMENTATION.md).

The design stays deliberately small: a modular Express monolith and a single-page React client served from the same origin. No new infrastructure (Redis, queues, WebSockets) was introduced, because nothing in the workload needs it.

## Backend (`api/`)

```
api/
  index.js            boot: connect DB (fail fast) → listen → graceful shutdown
  app.js              createApp(): helmet, compression, request context, JSON, cookies,
                      /api → [cors?, rate limit, CSRF guard] → /v1 routes → JSON 404,
                      then (production) static client + SPA fallback, then error handler
  config/             env.js (zod-validated env), dbConfig.js, cloudinaryConfig.js
  constants/          roles, statuses, moderation transitions, categories, audit actions
  middleware/         auth (requireAuth / optionalAuth / requireRole), validate (zod),
                      csrf, rateLimit, upload (multer memory), requestContext, errorHandler
  validators/         zod schemas per module (body / query / params)
  routes/             index.js (v1 router) + auth, user, product, bid, notification
  controllers/        thin: read req.valid.*, call service, send envelope
  services/           business rules: auth, session, user, product, bid, notification,
                      dashboard (aggregations), audit
  models/             User, Product, Bids, Notification, AuditLog
  utils/              AppError, asyncHandler, response, logger, csv, query, transaction
  scripts/            migrate.js (idempotent, dry-run default), dev-memory.js, fixtures.js
  tests/              Vitest + Supertest against an in-memory replica set
```

**Responsibilities.** Routes declare path + middleware order only. Controllers never touch Mongoose. Services own every rule (ownership, transitions, last-admin protection, notifications, audit) and use `runInTransaction` for multi-document writes (status change + audit + notification; product delete + bids). No repository layer: Mongoose models already are that abstraction here.

### Request lifecycle

1. `requestContext` assigns/propagates `X-Request-Id`, logs one structured line on finish (method, path without query, status, duration, user id).
2. `helmet` (CSP allowing Cloudinary images), `compression`, `express.json({ limit: 100kb })`, `cookie-parser`.
3. `/api`: optional CORS (explicit allow-list only), `apiLimiter` (300/min/IP), `csrfGuard` (unsafe methods need `X-Requested-With: XMLHttpRequest` unless Bearer auth).
4. Route middleware: `requireAuth`/`optionalAuth` → `requireRole` → `validate(schema)` → controller.
5. Errors → `errorHandler`: maps `AppError`, Mongoose validation/cast/duplicate errors and JSON parse errors to `{ success:false, code, message, details?, requestId }`. Unknown errors become a generic 500 (stack only outside production).
6. Query strings use Express's `simple` parser, so `?a[$ne]=x` can never become an object.

### Authentication and session lifecycle

- `POST /auth/login` verifies bcrypt (constant-time path for unknown emails), refuses blocked accounts (403 after the password check), records `lastLoginAt`, and sets an **HttpOnly, SameSite=Lax, Secure-in-production** cookie `smp_session` containing a JWT `{ userId, tv }` (HS256, `SESSION_TTL_HOURS`, default 24h).
- Every authenticated request loads the user (`lean`, indexed by `_id`) and rejects if: token invalid/expired (401), user missing or `tokenVersion` ≠ `tv` (401 `SESSION_REVOKED`), status ≠ active (403 `ACCOUNT_BLOCKED`).
- Blocking a user and changing a password increment `tokenVersion`, revoking all existing sessions immediately. Logout clears the cookie.
- Bearer tokens are still accepted for API tooling; existing legacy tokens (`{ userId }`, no `tv`) remain valid until expiry while `tokenVersion` is 0.
- **Why not refresh tokens?** A single 24h session with server-side revocation meets the requirements; refresh-token rotation would add storage and complexity without a use case.

### Authorization matrix

| Capability | Visitor | User | Admin |
|-----------|:------:|:----:|:-----:|
| Browse approved listings / view approved listing | ✓ | ✓ | ✓ |
| View own non-approved listing | – | owner | ✓ (any) |
| Create listing | – | ✓ (always `pending`, seller = self) | ✓ |
| Edit / delete listing, manage photos | – | owner | ✓ (any; delete audited) |
| Approve / reject / block / unblock listing | – | – | ✓ (validated transitions, audited, seller notified) |
| Place bid | – | ✓ (approved listings, not own) | ✓ |
| See bidders' contact details | – | seller of that listing | ✓ |
| See bid amounts on a listing | – | if seller enabled it | ✓ |
| Own notifications (list/read/delete) | – | ✓ | ✓ |
| Dashboard | – | personal metrics | marketplace metrics |
| List/export users, view user detail | – | – | ✓ |
| Block/unblock users, change roles | – | – | ✓ (not self; never removes the last active admin) |
| Audit log | – | – | ✓ |

The UI hides unauthorized actions, but the API is authoritative for every row above.

## Frontend (`client/src/`)

```
main.jsx                 theme applied before paint, root ErrorBoundary, Providers
app/                     App.jsx (routes, lazy pages, session restore), Providers.jsx
                         (Redux, TanStack Query, antd theme bridge, session watcher), theme.js
routes/guards.jsx        RequireAuth, RequireRole, GuestOnly
layouts/                 AppLayout (sidebar, header, breadcrumbs, notifications, theme,
                         user menu), AuthLayout, navigation config, NotificationCenter
features/                auth, dashboard, marketplace, selling, account, admin
components/              ui.jsx (PageHeader, StatusTag, RoleTag, UserCell, StatCard,
                         EmptyState, QueryError, Toolbar, ProductThumb), ErrorBoundary,
                         ListPagination, FullPageLoader, PageSkeleton, Logo
services/                apiClient.js (axios instance, ApiError, interceptors), endpoints.js
store/                   authSlice (session state machine), uiSlice (theme, sidebar)
hooks/                   useUrlState (filters/pagination in the URL), useDebouncedValue
constants/, utils/       labels, formatting, form helpers, guarded localStorage
```

**State split.** Redux holds only client state: the session state machine and UI preferences. Server data lives in TanStack Query (caching, `keepPreviousData` pagination, invalidation after mutations, one retry for transient failures, none for 4xx). This replaced the global loader slice and ad-hoc `useEffect` fetching.

### Startup / refresh lifecycle (fix for the blank screen)

1. `main.jsx` renders immediately; `App` dispatches `restoreSession()` once (`status: loading`).
2. `RequireAuth` renders a labelled loader while `idle|loading`; `GuestOnly` does the same for /login.
3. `GET /auth/me` → `authenticated` (render route), 401 → `unauthenticated` (redirect to `/login` with `from`), other failures → `error` (retry screen; the user is **not** logged out because the server was briefly unreachable).
4. Any later 401 session code or `ACCOUNT_BLOCKED` triggers the session watcher: query cache cleared, `signedOut({ notice })`, guards redirect and the login page explains why.
5. A response that is HTML instead of JSON is rejected as `UNEXPECTED_RESPONSE` (defence against the original production misconfiguration).
6. Render errors are caught by a root boundary and a per-page boundary that resets on navigation.

### Routes

`/login`, `/register` (guest only) · `/dashboard` · `/marketplace`, `/marketplace/:id` · `/my-products` · `/my-bids` · `/account` · `/admin/users`, `/admin/products`, `/admin/audit-logs` (admin) · legacy redirects `/` → `/dashboard`, `/admin` → `/admin/products`, `/profile` → `/my-products`, `/product/:id` → `/marketplace/:id` (these paths are stored in existing notifications) · `*` → 404.

### Design system

Ant Design 5 remains the component library (already in the project, covers tables, forms, overlays, accessibility). Tailwind is used only for layout utilities. Colour, surface and border tokens are CSS variables (`src/index.css`) mirrored into the antd theme (`app/theme.js`), so light and dark themes apply to every surface, table, modal, dropdown and chart. Icons: `@ant-design/icons` only.

## Deployment shape

`npm run build` installs both packages and builds `client/dist`; `npm start` with `NODE_ENV=production` serves API and client from one process/origin. Put the app behind HTTPS, set `TRUST_PROXY=1` behind one proxy, keep `MONGO_AUTO_INDEX=false` and run `npm run db:migrate:apply` once per release that adds indexes.
