# Original architecture (as found)

This document records the architecture **before** modernization (commit `f061d23`). The implemented, current architecture is described in [TARGET_ARCHITECTURE.md](TARGET_ARCHITECTURE.md). Defects referenced as C1, H3… are listed in [../analysis/BUGS_AND_GAPS.md](../analysis/BUGS_AND_GAPS.md).

## What the product is

Although the README called it "MERN SMP", the code implements a **second-hand marketplace** ("Shey MP", Cloudinary folder `sheymp`, database `sheymp`):

- Users register, list pre-owned items (price, category, age in years, bill/warranty/box/accessories flags, photos).
- New listings are `pending` until an admin approves them; admins can reject, block and unblock listings.
- Other users browse approved listings and place **bids** (amount, message, phone number).
- Sellers receive in-app **notifications** for new bids and moderation decisions.
- Admins can block/unblock users.

## Stack

| Layer | Technology (original versions) |
|-------|-------------------------------|
| Runtime | Node 22 (engines `22.13.0`; machine has 22.14.0), npm 11 |
| API | Express 4.21 (ESM), Mongoose 8.10, jsonwebtoken 9, bcryptjs 2.4, multer 1.4.5-lts, cloudinary 2.0 |
| DB | MongoDB Atlas (`mongodb+srv`), database `sheymp`: users (10), products (8), bids (6), notifications (4) |
| Client | React 18.2 + Vite 5.2, React Router 6.22, Redux Toolkit (user + global loader), Ant Design 5.15, Tailwind 3 (preflight off), axios, moment, Remixicon via CDN |
| Tests / lint | none / ESLint 8 (57 problems) |

## Module map (original)

```
api/
  index.js                 express app + listen; SPA fallback registered before API routes (C4)
  config/dbConfig.js       mongoose.connect, errors only logged
  config/cloudinaryConfig.js
  routes/*.js              auth, user, product, bid(Route), notification
  controllers/*.js         all business logic + DB access, no validation
  models/*.js              User, Product, Bids, Notification (no enums/indexes)
  utils/verifyToken.js     JWT check, writes req.body.userId, logs token (H9)
  utils/error.js           errorHandler(status, message)
client/src/
  main.jsx, App.jsx        routes: /, /product/:id, /profile, /admin, /login, /register
  components/ProtectedPage header + auth check + notification modal (C5)
  pages/                   Home, ProductInfo, Profile(Products, UserBids), admin/(Admin, AdminProducts, Users), Login, Register
  apiCalls/*.js            axios wrappers returning error.response.data (crash on network errors)
  redux/                   userSlice, loadersSlice (global spinner)
```

## Request lifecycle (original)

`express.json()` → (production: `express.static` + `app.get("*")` **first**) → router → optional `verifyToken` → controller → Mongoose → `res.json({ success, message, data })`. Errors went to a single handler that echoed `err.message` (including internal messages) with `statusCode`.

## Authentication lifecycle (original)

1. `POST /api/auth/login` → JWT `{ userId }` signed for 1 day, returned in the body.
2. Client stored it in `localStorage` and sent `Authorization: Bearer`.
3. `verifyToken` verified the signature only: blocked users and deleted users stayed authorized until expiry (H1).
4. On page load, `ProtectedPage` called `GET /api/user/get-current-user`; render was gated on `user && ...` (C5).
5. Logout removed the token locally only.

## Data access lifecycle (original)

Controllers queried models directly with request bodies as filters (`Bids.find(req.body-derived filters)`), returned full documents (including password hashes, C3), and loaded entire collections (no pagination, M2).

## Frontend routing lifecycle (original)

`BrowserRouter` with every page wrapped in `ProtectedPage`. Admin route protection happened in a `useEffect` after render. No 404 route, no error boundary, no lazy loading (1.12 MB single JS chunk).

## Weaknesses summary

- Business logic, authorization and data shaping mixed in controllers; no validation layer.
- Authorization missing on several mutating endpoints (C1, C2, H3, H4).
- Inconsistent response codes (500 for "user not found", 200 for failures).
- No pagination, indexes, health checks, structured logging or graceful shutdown.
- UI: global blocking spinner, `window.confirm`, inconsistent styles, desktop-only layout.
