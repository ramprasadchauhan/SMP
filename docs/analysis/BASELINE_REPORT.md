# Baseline report (before modernization)

Recorded on 2026-11-01 against commit `f061d23` on branch `main`, before any change. Only commands that were actually run are reported.

## Environment

| Item | Value |
|------|-------|
| OS | Windows 11 |
| Node / npm | v22.14.0 / 11.6.2 (`engines` pins 22.13.0) |
| Git | `main`, 2 uncommitted files: `client/package-lock.json`, `client/src/components/ProtectedPage.jsx` (adds a token-validation `useEffect`; preserved in `docs/implementation/preserved-uncommitted-ProtectedPage.patch`) |
| Database | MongoDB Atlas (`mongodb+srv`, not local), database `sheymp` — treated as shared/production: **no writes were made to it** |
| Running processes | The owner's own `npm run dev` (nodemon API) and Vite dev server were running during the work; they were not stopped |

## Dependencies

- Installed (root): express 4.21.2, mongoose 8.10.1, jsonwebtoken 9.0.2, bcryptjs 2.4.3, multer 1.4.5-lts.1, cloudinary 2.0.3, dotenv 16.4.5. No dev dependencies, no tests.
- Installed (client): react 18.2, vite 5.2.6, antd 5.15.3, react-router-dom 6.22.3, @reduxjs/toolkit, axios 1.6.8, moment 2.30.1, tailwind 3.4.1, plus `"mern-smp": "file:.."` (the server package linked into the client).
- `npm audit --omit=dev` (root): **9 vulnerabilities (1 critical, 7 high, 1 moderate)** — proxy-addr, path-to-regexp, qs, body-parser, jws, lodash, cloudinary, mongoose.
- `npm audit` (client): **29 vulnerabilities (1 low, 9 moderate, 18 high, 1 critical)**, incl. axios, @remix-run/router, form-data, moment, esbuild/vite tooling.

## Build, lint, tests

| Check | Command | Result |
|-------|---------|--------|
| Client lint | `npx eslint . --ext js,jsx` | **57 problems (46 errors, 11 warnings)** |
| Client build | `npx vite build` | Succeeds. **One 1,122 kB JS chunk (357 kB gzip)** + 8.7 kB CSS; Vite chunk-size warning |
| Tests | – | None exist |

## API behaviour (original server, run on a spare port)

| Probe | Result |
|-------|--------|
| Server start | Starts, logs "MongoDb is connected" |
| `GET /api/user/get-current-user` without token (development) | 401 JSON `Token is required` |
| `GET /admin` (development) | 404 HTML (no SPA fallback; Vite serves the client in dev) |
| `GET /api/user/get-current-user` with `NODE_ENV=production` | **200 `text/html` (index.html)** — with and without a valid token. Root cause of the production blank screen / logout loop (C4) |
| `POST /api/auth/login` with the owner-supplied admin and test-user development credentials | Both **succeed** (read-only operation in the original code). The credentials are intentionally not recorded in the repository |

## Data shape (read-only inspection)

| Collection | Docs | Indexes | Notes |
|------------|-----:|---------|-------|
| users | 10 | `_id`, `email` unique | 1 admin, 9 users, all active, all bcrypt-hashed, no uppercase emails |
| products | 8 | `_id` only | 7 approved, 1 pending; categories include one `Electronics` (capitalised) |
| bids | 6 | `_id` only | `mobile` stored as int or double |
| notifications | 4 | `_id` only | 3 read, 1 unread |

No orphaned products or bids. Migration dry run (new script, read-only) reports 1 category to lowercase and 12 indexes to create.

## Pre-existing failures (separate from anything introduced later)

All items in [BUGS_AND_GAPS.md](BUGS_AND_GAPS.md) existed at baseline. Notably: blank screen on refresh (C5) and in production (C4); unauthenticated privilege escalation (C1); password-hash exposure (C3); blocked users keep access (H1).
