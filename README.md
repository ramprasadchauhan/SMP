# SMP Marketplace

A moderated marketplace for buying and selling pre-owned goods, built with MongoDB, Express, React and Node.

- **Sellers** list items with photos and condition details; listings go live after admin approval.
- **Buyers** browse, filter and place bids; sellers are notified and see buyer contact details.
- **Administrators** moderate listings, manage users and roles, and review an audit log, with a live dashboard.

## Stack

| | |
|---|---|
| API | Node 22, Express 4, Mongoose 8, zod validation, JWT in an HttpOnly cookie, Helmet, rate limiting, Cloudinary uploads |
| Client | React 18, Vite 5, React Router 6, Ant Design 5 + Tailwind (layout), TanStack Query, Redux Toolkit, Recharts |
| Tests | Vitest + Supertest + mongodb-memory-server (API), Vitest + Testing Library (client), Playwright (E2E, uses local Chrome) |

## Getting started

Prerequisites: Node 22, npm 10+, a MongoDB database (Atlas or local) — or none at all with the in-memory mode below.

```bash
npm install
npm install --prefix client
cp .env.example .env        # then fill in MONGO and JWT_SECRET (and Cloudinary for photo uploads)
```

### Run against your database

```bash
npm run dev          # API on http://localhost:8000 (nodemon)
npm run dev:client   # client on http://localhost:5173, proxies /api to :8000
```

### Run with a throw-away database (no setup, nothing touches your real data)

```bash
npm run dev:memory   # API + in-memory MongoDB seeded with demo data on :8000
npm run dev:client
```

Demo accounts (in-memory mode only) are listed in `api/scripts/fixtures.js` (`admin@smp.test`, `seller@smp.test`, `buyer@smp.test`, …; password in `FIXTURE_PASSWORD`).

### Production

```bash
npm run build                      # installs both packages, builds client/dist
NODE_ENV=production npm start      # serves API + client from one origin
```

Behind HTTPS. Set `TRUST_PROXY=1` behind a single reverse proxy. See [docs/architecture/TARGET_ARCHITECTURE.md](docs/architecture/TARGET_ARCHITECTURE.md#deployment-shape).

## Database migration (existing databases)

```bash
npm run db:migrate           # dry run: shows what would change (read-only)
npm run db:migrate:apply     # back up first; idempotent, never deletes
```

Lowercases legacy emails/categories, fixes the old `"panding"` status typo and creates indexes. Details: [docs/architecture/DATABASE_DESIGN.md](docs/architecture/DATABASE_DESIGN.md#migration-apimigratejs).

## Tests

```bash
npm test                     # API: 64 integration tests on an in-memory replica set
npm run test:client          # client unit/component tests
npm run build --prefix client && npm run test:e2e   # Playwright E2E against the production build
```

The first API test run downloads a MongoDB binary for `mongodb-memory-server` (cached afterwards). E2E uses the installed Google Chrome (`PW_CHANNEL` to override).

## Environment variables

See [.env.example](.env.example) (API) and [client/.env.example](client/.env.example). The API validates its configuration at startup and exits with a clear message if something required is missing. Client `VITE_*` variables are public — never put secrets there.

## Project layout

```
api/        Express API: routes → controllers → services → models (see docs/architecture)
client/     React SPA: app/, routes/, layouts/, features/, components/, services/, store/
docs/       analysis, architecture, API reference (+ openapi.yaml), security, testing, implementation log
```

## Documentation

- [Implementation log](docs/implementation/IMPLEMENTATION_LOG.md) — what changed and why
- [Baseline report](docs/analysis/BASELINE_REPORT.md) · [Bugs and gaps](docs/analysis/BUGS_AND_GAPS.md) · [Feature inventory](docs/analysis/FEATURE_INVENTORY.md)
- [Original architecture](docs/architecture/PROJECT_ARCHITECTURE.md) · [Current architecture](docs/architecture/TARGET_ARCHITECTURE.md) · [Database design](docs/architecture/DATABASE_DESIGN.md)
- [API documentation](docs/api/API_DOCUMENTATION.md) · [Security audit](docs/security/SECURITY_AUDIT.md) · [Test strategy](docs/testing/TEST_STRATEGY.md)

## Known limitations

- No password reset by email (no email provider configured).
- Removing a photo detaches it from the listing but does not delete it from Cloudinary.
- Dashboard day buckets are UTC.
