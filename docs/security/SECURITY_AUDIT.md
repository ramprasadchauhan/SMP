# Security audit

Scope: the API (`api/`), the React client (`client/`) and their dependencies, reviewed against the OWASP API Top 10 and the checklist in the modernization brief. Detailed defect descriptions are in [../analysis/BUGS_AND_GAPS.md](../analysis/BUGS_AND_GAPS.md).

## Threat model (short)

Public marketplace: anonymous visitors, registered users (buyers/sellers), administrators. Assets: account credentials, personal contact data (emails, phone numbers in bids), moderation integrity, admin privileges. Main threats: privilege escalation, data exposure between users, account takeover (credential stuffing, token theft via XSS), CSRF on cookie sessions, injection into MongoDB queries, abuse of uploads.

## Findings and fixes

| Area | Finding (before) | Fix (now) | Verified by |
|------|------------------|-----------|-------------|
| Broken function-level auth | Unauthenticated user-status and product-status endpoints (C1, C2); admin APIs open to any user (H2) | `requireAuth` + `requireRole("admin")` on every admin route | `users.test.js`, `products.test.js` (403/401 cases), E2E |
| Broken object-level auth | Any user could edit/delete any product, read any bids, delete any notification (H3–H5) | Ownership checks in services; owner-scoped filters; 404 for hidden objects | ownership/bids/notifications tests |
| Mass assignment / privilege escalation | Bodies passed directly to `findByIdAndUpdate`/`new Model(req.body)`; role settable (C1) | zod `strictObject` schemas (unknown keys → 422); `seller`/`status`/`buyer` set server-side; role only via admin endpoint | "rejects arbitrary fields", "self-assign role" tests |
| Sensitive data exposure | Password hashes in user lists and populated sellers (C3); bidder contact data to everyone (H5) | `select: false` on `password`, explicit serializer, seller projections, privileged bid view | "never exposes password hashes", CSV test |
| NoSQL injection | Body-derived filters (`get-all-bids`) | Validation of every input; `simple` query parser (no nested objects); regex input escaped | "operator injection", "nested query objects", "regex characters" tests |
| Authentication | User enumeration via 500 "User not exist"; blocked status revealed pre-password (H7) | Generic 401; constant-time path with dummy hash; blocked → 403 only after valid password | auth tests |
| Session management | JWT in localStorage; no revocation; token logged (H1, H9) | HttpOnly + SameSite=Lax + Secure (prod) cookie; `tokenVersion` revocation on block/password change; status re-checked per request; logger redacts token/password/cookie keys | blocking + change-password tests, E2E |
| CSRF | n/a before (header tokens) | Cookie sessions + SameSite=Lax + required `X-Requested-With` header on unsafe methods | CSRF test |
| Brute force | No rate limiting | 20/15 min/IP on credential endpoints, 300/min/IP on API | configuration (disabled in tests) |
| Security headers | none; `X-Powered-By` exposed | Helmet (CSP with Cloudinary image allow-list, HSTS, nosniff, frame-ancestors, etc.) | header test |
| CORS | none (same origin) | Off by default; optional explicit allow-list (`CORS_ORIGINS`), never `*` with credentials | code review |
| File upload | Disk storage, no type/size checks, any product (M8) | Memory storage, MIME allow-list, 5 MB, 1 file, ownership, 10-image cap with atomic guard | upload tests |
| Error handling | Internal messages echoed | Generic 500 in production; stack only in development; request id for correlation | error handler review |
| Password policy | none | New passwords: 8–128 chars with a letter and a digit. Existing passwords (e.g. 6 digits) still sign in — policy applies only when setting a password, so nobody is locked out | register/change-password tests |
| Spreadsheet injection | n/a | CSV export prefixes `= + - @ \t \r` cells with `'` and quotes fields | CSV test |
| Secrets | `.env` git-ignored (verified, never committed) | `.env.example` with placeholders; env validated at startup; client env documented as public | review |
| XSS | React escaping; no `dangerouslySetInnerHTML` found | unchanged; CSP `script-src 'self'` adds defence in depth; removed third-party CDN stylesheet | grep review |

## Dependency audit (2026-11-01)

**API (production dependencies):** before 9 advisories (1 critical `proxy-addr`, 7 high incl. `path-to-regexp`, `jws`, `multer`, `cloudinary`, `mongoose`); after targeted upgrades within the same major versions (express 4.22, mongoose 8.24, multer 2.5, cloudinary 2.11, jsonwebtoken 9.0.3): **0 vulnerabilities** (`npm audit --omit=dev`).

**Client:** before 29 advisories. After upgrades: production dependencies have **2 moderate** advisories, both in React Router 6 (fix requires the breaking v7 upgrade): an SSR-only issue that does not apply to this SPA, and an open redirect when backslash paths are passed to `navigate`/`<Link>`. The app navigates only to its own route constants, same-origin `location.state`, and server-generated notification paths, which are now validated as same-origin before navigating. Remaining full-tree findings (19) are build/test tooling only (Vite 5/esbuild dev server, vitest 3, eslint 8 dependencies) and are not shipped. API dev tooling (vitest 3) has 5 test-only advisories.

## Residual risks / recommendations

0. Upgrade React Router to v7 and the toolchain (Vite 6+, Vitest 4, ESLint 9) in a dedicated change to clear the remaining advisories.

1. Run `npm run db:migrate:apply` (after a backup) so the new indexes exist in production; until then queries are correct but unindexed.
2. Set `TRUST_PROXY` correctly behind a proxy or rate limits key on the proxy's IP.
3. Rotate `JWT_SECRET` if the previous value was short or shared; rotating signs everyone out once.
4. Consider storing Cloudinary `public_id` to delete removed photos.
5. Add account lockout/2FA for administrators if the threat model grows.
6. Content Security Policy keeps `style-src 'unsafe-inline'` because Ant Design injects styles at runtime; acceptable given `script-src 'self'`.
