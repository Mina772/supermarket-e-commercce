# Folder Structure

Full project tree (excluding `node_modules`, build output and VCS metadata).

```
supermarket-enterprise/
├── .github/workflows/ci.yml        # CI: lint, type-check, test, build images
├── backend/                        # Express + TypeScript REST API
│   ├── src/
│   │   ├── config/env.ts           # Zod-validated environment
│   │   ├── infra/                  # logger (Winston), db (Mongoose + retry)
│   │   ├── common/                 # errors, constants (RBAC), utils, types
│   │   │   └── utils/              # apiResponse, jwt, password, pricing engine, …
│   │   ├── middlewares/            # auth, rbac, validate, rateLimit, security, error
│   │   ├── modules/                # feature modules (model · service · routes · …)
│   │   │   ├── auth/  users/  products/  categories/  brands/
│   │   │   ├── cart/  orders/  reviews/  coupons/  addresses/
│   │   │   └── notifications/  inventory/  analytics/  uploads/  health/
│   │   ├── seed/                   # offline-capable seeder + bundled data.json
│   │   ├── docs/openapi.ts         # Swagger spec
│   │   ├── routes.ts app.ts index.ts
│   ├── tests/                      # unit + integration (Jest, Supertest, mongodb-memory-server)
│   ├── uploads/                    # runtime image uploads
│   ├── Dockerfile  .env.example  tsconfig.json  jest.config.js  …
│
├── frontend/                       # Next.js 14 App Router (storefront + admin)
│   ├── public/                     # placeholder + OG assets
│   ├── src/
│   │   ├── app/
│   │   │   ├── (shop)/             # storefront: home, products, product/[slug],
│   │   │   │                       #   categories, brands, deals, cart, checkout, compare
│   │   │   ├── (auth)/             # login, register, forgot-password
│   │   │   ├── account/            # profile, orders, orders/[id], addresses, wishlist
│   │   │   ├── admin/              # dashboard, products, orders, categories,
│   │   │   │                       #   inventory, coupons, reviews, customers
│   │   │   ├── layout.tsx          # root layout + SEO metadata
│   │   │   └── sitemap.ts robots.ts manifest.ts error.tsx loading.tsx not-found.tsx
│   │   ├── components/
│   │   │   ├── ui/                 # design-system primitives
│   │   │   ├── shared/  product/  home/  layout/  admin/
│   │   ├── hooks/                  # React Query hooks
│   │   ├── lib/                    # api-client, api service, utils, order-status
│   │   ├── store/                  # Zustand stores (auth, ui, compare)
│   │   ├── providers/  config/  styles/  types/
│   ├── Dockerfile  next.config.mjs  tailwind.config.ts  .env.example  …
│
├── nginx/nginx.conf                # reverse-proxy gateway (gzip, cache, rate-limit)
├── scripts/seed.sh                 # convenience seeding script
├── docs/                           # INSTALLATION, DEPLOYMENT, API, ARCHITECTURE, ENVIRONMENT, FOLDER_STRUCTURE
├── docker-compose.yml              # mongo + api + web + gateway
├── .env.example  .gitignore  LICENSE  README.md
```

## Module anatomy (backend)

Each feature under `backend/src/modules/<feature>/` follows the same shape:

```
<feature>/
├── <feature>.model.ts        # Mongoose schema, indexes, virtuals
├── <feature>.service.ts      # business logic (present where non-trivial)
├── <feature>.controller.ts   # HTTP handlers (or inline in routes for simple CRUD)
├── <feature>.routes.ts       # Express router + Zod validation wiring
└── <feature>.validation.ts   # Zod schemas (where applicable)
```

Simple CRUD modules (categories, brands, addresses, etc.) keep handlers inline in
`*.routes.ts` and lean on the shared `common/utils/crud.factory.ts` to stay DRY;
richer domains (auth, products, orders, cart) split out dedicated service/controller layers.
```
