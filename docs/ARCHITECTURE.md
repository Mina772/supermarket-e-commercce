# Architecture

## Overview

A decoupled two-tier application: a **Next.js 14 App Router** frontend and a **Node.js/Express REST API**, backed by **MongoDB**. In production an **Nginx** gateway fronts both and terminates TLS. Everything is containerized and orchestrated by Docker Compose.

```
                 ┌────────────────────────────────────────────┐
   Browser  ───▶ │  Nginx gateway (:80/:443)                   │
                 │   ├── /            → web  (Next.js :3000)    │
                 │   ├── /_next/...   → web  (cached static)    │
                 │   └── /api/...     → api  (Express :5000)    │
                 └───────────────┬───────────────┬─────────────┘
                                 │               │
                          ┌──────▼─────┐   ┌─────▼──────┐
                          │  Next.js   │   │  Express   │
                          │  SSR/ISR   │   │  REST API  │
                          └────────────┘   └─────┬──────┘
                                                 │
                                          ┌──────▼──────┐
                                          │  MongoDB    │
                                          └─────────────┘
```

## Backend — Clean, feature-based architecture

```
backend/src/
├── config/            # Zod-validated environment loader
├── infra/             # Cross-cutting infra: logger (Winston), db (Mongoose w/ retry)
├── common/            # Shared kernel
│   ├── errors/        # AppError + typed subclasses
│   ├── constants/     # roles + permission matrix (RBAC)
│   ├── utils/         # apiResponse, asyncHandler, pagination, password, jwt,
│   │                  #   pricing engine, crud factory, audit log
│   └── types/         # express request augmentation
├── middlewares/       # error, notFound, auth, rbac, validate, rateLimit, security
├── modules/           # One folder per feature (bounded context)
│   └── <feature>/     #   model · service · controller · routes · validation
├── routes.ts          # Versioned aggregation (/api/v1)
├── app.ts             # Express app assembly (security → routes → errors)
├── index.ts           # Bootstrap + graceful shutdown
├── docs/openapi.ts    # Swagger spec
└── seed/              # Offline-capable data seeder + bundled dataset
```

**Layering per module**
- **Model** — Mongoose schema, indexes, virtuals (`finalPrice`, `inStock`).
- **Service** — business logic; pure, testable, DB-aware. No `req`/`res`.
- **Controller / route** — HTTP concerns only: parse → validate (Zod) → call service → format via `apiResponse`.
- **Validation** — Zod schemas guard every mutating endpoint.

**Design principles applied**
- **SOLID** — services depend on abstractions; single-responsibility modules; a generic `crud.factory` keeps controllers DRY (Open/Closed).
- **DRY / KISS** — one pricing engine (`common/utils/pricing.ts`) is the single source of truth for tax, shipping and coupon math, reused by both cart and checkout.
- **Dependency injection** — services are instantiated and injected where useful; the DB connection and logger are shared singletons.

### Cross-cutting concerns
- **Auth** — bearer access token (short-lived) + refresh token in httpOnly cookie. Revocation via a monotonic `tokenVersion` on the user.
- **RBAC** — `authorize(...roles)` and `requirePermission(permission)` middlewares backed by a static role→permission matrix.
- **Security** — Helmet, CORS allow-list, express-rate-limit, HPP, mongo-sanitize, XSS-clean, per-request IDs, audit logging of sensitive actions.
- **Validation & errors** — Zod at the edge; a central error middleware maps `AppError` subclasses and Mongoose/Zod errors to the response envelope.
- **Observability** — Winston structured logging to stdout; `/health` probe.

### Notable domain logic
- **Checkout** uses `findOneAndUpdate` with a conditional stock predicate and a compensating rollback, so it is correct on **standalone MongoDB** (no transactions required) while remaining transaction-ready on a replica set.
- **Order lifecycle** is a guarded **state machine** (`pending → paid → processing → shipping → delivered`, with `cancelled`/`refunded` branches); cancel/refund restock inventory and write history.
- **Inventory** adjustments are append-only with reason/reference for auditability.

## Frontend — App Router, feature-oriented

```
frontend/src/
├── app/
│   ├── (shop)/        # Storefront route group (Navbar + Footer + CartSheet)
│   ├── (auth)/        # Split-screen auth layout
│   ├── account/       # Auth-guarded customer dashboard
│   ├── admin/         # Role-guarded admin dashboard
│   ├── layout.tsx     # Root: fonts, SEO metadata, Providers
│   ├── sitemap.ts robots.ts manifest.ts   # SEO
│   └── error/loading/not-found
├── components/
│   ├── ui/            # Primitives (button, card, input, sheet, dropdown…)
│   ├── shared/        # rating, price, pagination, empty-state, status badge
│   ├── product/       # card, grid, carousel, gallery, filters, detail, reviews
│   ├── home/          # hero, category grid
│   ├── layout/        # navbar, footer, cart-sheet, theme-toggle
│   └── admin/         # stat-card, data-table
├── hooks/             # React Query hooks (products, cart, wishlist, storefront)
├── lib/               # api-client (axios + refresh rotation), api service, utils
├── store/             # Zustand (auth, ui, compare)
├── providers/         # React Query + theme + toaster
├── config/            # site config
├── styles/            # Tailwind design tokens (light/dark, glass)
└── types/             # Domain models mirroring API responses
```

**State strategy**
- **Server state** → TanStack Query (caching, background refetch, optimistic-friendly). Query keys centralized in `lib/query-keys.ts`.
- **Client/UI state** → Zustand (auth session, cart drawer, compare list persisted to localStorage).
- **Forms** → React Hook Form + Zod resolver for type-safe validation.

**Auth flow (frontend)**
- Access token kept in memory + localStorage; attached by the Axios request interceptor.
- On `401`, a response interceptor performs a single in-flight refresh, queues concurrent requests, then replays them — transparent to the UI.

**Performance & SEO**
- SSR/ISR where beneficial; `generateMetadata` + Schema.org JSON-LD on product pages; `next/image` optimization; route-level code splitting; skeletons for perceived performance; Nginx long-cache for static assets.

**Accessibility**
- Semantic landmarks, skip-link, focus-visible rings, ARIA labels on icon buttons, keyboard-operable menus/sheets (Radix), dark mode with adequate contrast.

## Data model (high level)

```
User 1─* Order        Order *─1 User
User 1─1 Cart         Cart  *─* Product (items)
User 1─* Address      Product *─1 Category
User *─* Product      Product *─1 Brand
   (wishlist)         Product 1─* Review *─1 User
Coupon               InventoryHistory *─1 Product
Notification *─1 User AuditLog
```

## Request lifecycle (example: add to cart)

1. `ProductCard` → `useCartMutations().addItem.mutate({ productId })`.
2. Axios `POST /api/v1/cart/items` with bearer token.
3. `auth` → `validate(Zod)` → `cartService.addItem` (stock check, price snapshot).
4. Pricing engine recomputes totals; response envelope returned.
5. React Query invalidates the `cart` key → Navbar badge + CartSheet update.
