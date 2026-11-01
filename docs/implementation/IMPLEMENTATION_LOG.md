# Implementation log

Chronological record of the modernization (2026-11-01). Decisions are explained where they were not obvious. Results of test runs are recorded in [../testing/TEST_STRATEGY.md](../testing/TEST_STRATEGY.md#results).

## Stage A — Investigation

- Read every source file in `api/` and `client/src/`, both package manifests and lockfile state, git status/history.
- Ran the original API on spare ports in development and production mode; reproduced the production blank-screen root cause (C4).
- Verified the owner-supplied development credentials with the original (read-only) login endpoint.
- Inspected the Atlas database read-only: collection counts, field types, indexes, enum values, orphans.
- Recorded results in `docs/analysis/BASELINE_REPORT.md`, `BUGS_AND_GAPS.md`, `FEATURE_INVENTORY.md`, `docs/architecture/PROJECT_ARCHITECTURE.md`.
- **Decision:** the database is a remote Atlas cluster that looks like the live one, so all mutating tests run against `mongodb-memory-server`; the migration was only run in dry-run mode.

## Stage B/C — Backend

| Change | Files | Why |
|--------|-------|-----|
| `createApp()` split from boot; API mounted before the SPA fallback; JSON 404 for `/api/*` | `api/app.js`, `api/index.js` | Fixes C4; testable app |
| Env validation (zod) with actionable messages | `config/env.js` | Fail fast on bad config |
| Fail-fast DB connect, readiness probe, graceful shutdown, unhandled-rejection logging | `index.js`, `config/dbConfig.js`, `controllers/system.controller.js` | Operability |
| Versioned router `/api/v1` with RESTful modules | `routes/*` | Consistent contracts; old routes were insecure and only used by the bundled client, which was migrated in the same change |
| Services layer; thin controllers | `services/*`, `controllers/*` | Business rules in one place |
| zod validators for every endpoint (strict objects, coercion, enums, ObjectId checks, caps) | `validators/*`, `middleware/validate.js` | Mass assignment, injection, input errors |
| Auth middleware: cookie or Bearer, per-request user/status/tokenVersion check | `middleware/auth.js`, `services/session.service.js` | H1, H9 |
| CSRF header guard, rate limits, Helmet, compression, request ids, structured logger with redaction | `middleware/*`, `utils/logger.js` | Hardening, observability |
| Central error handler with stable `code`s | `middleware/errorHandler.js`, `utils/AppError.js` | Consistent errors, no leaks |
| Models: enums, lengths, required refs, `select:false` password, new `tokenVersion`/`lastLoginAt`/`statusChanged*`, indexes; `notificationModal.js` → `notificationModel.js`, `bidRoute.js` → `bid.route.js` | `models/*` | Integrity, performance |
| Audit log model + service | `models/auditLogModel.js`, `services/audit.service.js` | Accountability |
| Dashboard aggregations (`$facet`, daily buckets, previous-period deltas) | `services/dashboard.service.js` | Real metrics |
| Transactions helper with standalone fallback | `utils/transaction.js` | Multi-document consistency |
| CSV export with formula-injection protection | `utils/csv.js` | Safe exports |
| Uploads: memory storage, MIME/size checks, upload_stream to Cloudinary, atomic 10-image cap | `middleware/upload.js`, `services/product.service.js` | M8 |
| Idempotent migration (dry run by default), fixtures, in-memory dev server | `scripts/*` | Safe data changes, demos, E2E |
| Dependencies upgraded within majors; added zod, helmet, express-rate-limit, cookie-parser, compression; dev: vitest, supertest, mongodb-memory-server, nodemon | `package.json` | 0 production advisories |

**Decisions**
- *Express 4 kept* (Express 5 offers nothing needed here; 4.22 has the security fixes).
- *zod* chosen once for both validation and env parsing (no Joi alongside).
- *No repository layer, no Redis, no WebSockets*: not justified by the workload.
- *Custom JSON logger instead of Pino*: ~40 lines, redaction built in, one less dependency; swap for Pino if log volume grows.
- *Cookie sessions*: moved fully (login, register, logout, me, all requests, CSRF header) rather than half-migrating; Bearer kept for tooling.
- *Password policy* applies only to new passwords, so existing 6-character passwords keep working.
- *Indexes are not auto-built* (`MONGO_AUTO_INDEX=false`) so starting the app never alters the shared database.

## Stage D/E/F — Frontend

| Change | Files |
|--------|-------|
| New structure: `app/`, `routes/`, `layouts/`, `features/*`, `components/`, `services/`, `store/`, `hooks/`, `utils/`, `constants/` | `client/src/**` |
| Session state machine + guards + error boundaries (blank-screen fix) | `store/authSlice.js`, `routes/guards.jsx`, `components/ErrorBoundary.jsx`, `app/App.jsx` |
| API client: cookie credentials, CSRF header, timeouts, `ApiError` normalisation, HTML-response guard, session-ended handler (401 vs 403 distinguished) | `services/apiClient.js`, `services/endpoints.js` |
| TanStack Query for server state; Redux reduced to auth + UI prefs; global spinner removed | `app/Providers.jsx`, `store/*` |
| Design tokens (CSS variables) mirrored into antd theme; light/dark; reduced motion; focus rings; thin scrollbars; skip link | `index.css`, `app/theme.js`, `tailwind.config.js` |
| App shell: collapsible sidebar, mobile drawer, breadcrumbs, notification center, theme toggle, user menu | `layouts/*` |
| Pages: login/register, dashboard (admin + user, Recharts), marketplace + detail + bid modal, my listings (form, photo manager, bids drawer), bids (placed/received), account settings, admin users (+ drawer, actions), product moderation, audit log, 403, 404 | `features/**`, `pages/*` |
| URL-driven filters/pagination, debounced search, responsive card lists below `md` | `hooks/useUrlState.js`, feature pages |
| Route-level code splitting + vendor chunks | `app/App.jsx`, `vite.config.js` |
| Removed: `moment`, CDN Remixicon, `mern-smp` self-dependency, old pages/components/apiCalls/redux | `package.json`, deleted files |

The owner's uncommitted edit to `ProtectedPage.jsx` was saved to `preserved-uncommitted-ProtectedPage.patch` before that component was replaced; its intent (validate the session on load) is implemented by `restoreSession`.

## Stage G — Testing and hardening

See [TEST_STRATEGY.md](../testing/TEST_STRATEGY.md#results). API 64/64, client 18/18, E2E 8/8 (production build served by Express with an in-memory database), lint clean.

Fixes made during verification:
- Account status is now checked before the session version, and session restore carries the reason to the login page, so a blocked user who reloads sees "Your account has been blocked" instead of a silent redirect (found by E2E).
- Dashboard trend switched from smoothed areas to stacked daily bars after visual review (discrete counts).
- Removed the forced Ant Design vendor chunk: initial load dropped from ~420 kB to ~280 kB gzip.
- Notification links validated as same-origin paths (React Router 6 open-redirect advisory).

## Not done / deferred

See "Remaining gaps" in [BUGS_AND_GAPS.md](../analysis/BUGS_AND_GAPS.md#remaining-gaps-not-fixed-by-decision) and the final report.
