# Test strategy

## Principles

- Tests never touch the shared Atlas database. The API suite and the E2E server use `mongodb-memory-server` (a **single-node replica set**, so transactional code paths run for real).
- Fixtures (`api/scripts/fixtures.js`) create known accounts with a fixture-only password; owner-supplied credentials are never used in automated tests.
- Rate limiting is disabled only via `RATE_LIMIT_ENABLED=false` in test configuration; no security control is bypassed in code.

## Layers

| Layer | Tooling | Location | What it covers |
|-------|---------|----------|----------------|
| API integration | Vitest 3 + Supertest + mongodb-memory-server | `api/tests/*.test.js` | Every endpoint group through the real Express app: auth (login, invalid/expired/tampered/legacy tokens, logout, CSRF, register, password policy, change password + revocation), blocking enforcement, user listing (pagination, filters, sorting validation, injection, CSV), status/role rules and audit, marketplace filters and visibility, ownership, mass assignment, uploads (type, unconfigured storage), moderation transitions and notifications, bids privacy, notification ownership, dashboard aggregates and scoping, health/readiness, headers, JSON 404 |
| Client unit/component | Vitest 3 + Testing Library + jsdom | `client/src/**/*.test.{js,jsx}` | Route guards (loading state, redirect, error/retry, 403), API client (credentials, CSRF header, error normalisation, HTML-response guard, 401 vs 403 handling, timeouts), login form (validation, no prefill, error, success, session notice), error boundary (fallback, reset on navigation) |
| End-to-end | Playwright (local Chrome channel) | `client/e2e/app.spec.js` | Runs the **production build served by Express** (the configuration that originally failed): unauthenticated redirect, admin login, refresh, deep links, user search + pagination + block/unblock, normal user denied admin pages, live session revocation when blocked, logout + back button, 404, marketplace filters + detail + refresh |

## Commands

```bash
npm test                                   # API
npm run test:client                        # client
npm run build --prefix client && npm run test:e2e
npm run lint --prefix client
```

## Results

Recorded from actual runs on 2026-11-01 (Windows 11, Node 22.14.0). See the final section of the implementation log for the build output.

| Suite | Result |
|-------|--------|
| API (`npm test`) | **64 / 64 passed** (3 files, ~60 s including in-memory MongoDB start) |
| Client (`npm run test:client`) | **18 / 18 passed** (4 files) |
| E2E (`npm run test:e2e`) | **8 / 8 passed**, two consecutive runs (~1.1 min). Two issues found and fixed along the way: a test selector, and a real UX gap (a blocked user reloading the page was sent to login without an explanation) |
| Lint (`npm run lint --prefix client`) | **0 problems** (baseline: 57) |
| Client build | Succeeds. Initial load ≈ 280 kB gzip (main 203 kB + React vendor 77 kB) vs 357 kB single chunk before; tables, charts and each page load on demand. Vite still warns that the main chunk (616 kB raw, mostly Ant Design core used by the shell) exceeds 500 kB |

Manual browser checks (production build, in-memory data): login, admin dashboard, users table, marketplace; widths 1440 px and 390 px (no horizontal overflow; tables switch to card lists); light and dark themes. Only console error: the expected 401 from the session probe before sign-in.

Notes: the first E2E run downloads a 442 MB MongoDB binary for `mongodb-memory-server` (the web-server timeout allows 10 minutes for this).

## Not covered (known)

- Real Cloudinary uploads (requires credentials; covered up to the provider call, plus the 503 path).
- Visual regression and automated accessibility scanning (manual checks were done in the browser at several widths and in both themes).
- Load/performance testing.
