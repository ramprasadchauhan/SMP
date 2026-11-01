# Database design

MongoDB via Mongoose 8. Collection names are unchanged from the original project, so existing data keeps working. No field was renamed or removed.

## Collections

### `users`

| Field | Type | Notes |
|-------|------|-------|
| `name` | String, required, trimmed, ≤ 80 | |
| `email` | String, required, **unique**, trimmed, lowercased | Validator lowercases on input; migration lowercases legacy values. |
| `password` | String, required, `select: false` | bcrypt (10 rounds). Never serialized. |
| `role` | enum `user` \| `admin`, default `user` | |
| `status` | enum `active` \| `blocked`, default `active` | Checked on every authenticated request. |
| `profilePicture` | String | Unused by the UI; kept for compatibility. |
| `tokenVersion` | Number, default 0, `select: false` | **New.** Incremented on block / password change to revoke sessions. Missing on legacy docs = 0. |
| `lastLoginAt` | Date | **New.** |
| `statusChangedAt`, `statusChangedBy` | Date, ObjectId → users | **New.** Set when an admin changes status. |
| `createdAt`, `updatedAt` | Date | timestamps |

Indexes: `{ email: 1 }` unique (pre-existing) · `{ role: 1, status: 1 }` · `{ createdAt: -1 }`.

### `products`

| Field | Type | Notes |
|-------|------|-------|
| `name` ≤ 120, `description` ≤ 2000 | String, required | |
| `price` | Number ≥ 0 | |
| `category` | enum `electronics, fashion, home, sports, books`, lowercased | One legacy doc has `Electronics`; migration lowercases it. |
| `age` | Number ≥ 0 (years) | |
| `images` | [String] ≤ 10 | Cloudinary `secure_url`s. |
| `billAvailable`, `warrantyAvailable`, `accessoriesAvailable`, `boxAvailable`, `showBidsOnProductPage` | Boolean | |
| `seller` | ObjectId → users, **required** (was misspelled `require`) | |
| `status` | enum `pending, approved, rejected, blocked`, default `pending` (was `"panding"`) | Transitions: pending→approved/rejected, approved→blocked, rejected→approved, blocked→approved. |

Indexes: `{ status: 1, createdAt: -1 }` (marketplace, moderation) · `{ seller: 1, createdAt: -1 }` (my listings) · `{ category: 1, status: 1 }`.

### `bids`

`product`, `seller`, `buyer` (ObjectIds, now required), `bidAmount` (≥ 1), `message` (≤ 500), `mobile` (**String** going forward; legacy numeric values are converted with `String()` when read, no rewrite needed).
Indexes: `{ product: 1, createdAt: -1 }` · `{ buyer: 1, createdAt: -1 }` · `{ seller: 1, createdAt: -1 }`.

### `notifications`

`title`, `message`, `onClick` (in-app path), `user` (required), `read`. Index `{ user: 1, createdAt: -1 }`. Created only by the server.

### `auditlogs` (new)

`actor`, `actorName` (snapshot), `action` (`user.status_changed`, `user.role_changed`, `product.status_changed`, `product.deleted`), `targetType`, `targetId`, `targetLabel`, `changes` (`{ field: { from, to } }`), `requestId`, `createdAt`. Append-only; admins read via `/audit-logs`. No passwords, tokens or request bodies are stored. No TTL is set (retention is a business decision; add a TTL index on `createdAt` if required).
Indexes: `{ createdAt: -1 }` · `{ targetType: 1, targetId: 1, createdAt: -1 }` · `{ action: 1, createdAt: -1 }`.

## Consistency

Multi-document writes use `runInTransaction` (Mongoose `withTransaction`): user status/role change + audit; product status change + audit + seller notification; bid + seller notification; product delete + its bids + audit. Atlas (replica set) gets full atomicity; on a standalone `mongod` the helper falls back to sequential writes. Tests run on a single-node replica set so the transactional path is exercised.

## Migration (`api/scripts/migrate.js`)

- **Dry run by default** (`npm run db:migrate`): counts what would change and which indexes are missing. Read-only.
- **Apply** (`npm run db:migrate:apply`): lowercases emails (skips and reports any that would collide), lowercases categories, fixes `"panding"`, then `createIndexes()` (never drops indexes).
- Idempotent: re-running changes nothing. No deletes.
- Dry run against the current Atlas database (2026-11-01): 0 emails, **1 category**, 0 status typos to fix; 12 indexes to create.
- **Rollback:** take an Atlas snapshot (or `mongodump`) first. Data changes are case-only and reversible from the backup; created indexes can be dropped individually with `db.collection.dropIndex(name)`.
- Not run against the shared database during this work, because that requires the owner's authorization.

`MONGO_AUTO_INDEX` defaults to `false` so starting the app never changes a shared database; tests and the in-memory dev server enable it.
