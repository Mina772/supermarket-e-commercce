# API Reference

Base URL: `/api/v1` — interactive Swagger UI is served at `/api/docs`.

## Conventions

- **Format:** JSON. All responses use a consistent envelope.
  ```jsonc
  // success
  { "success": true, "message": "OK", "data": <payload>, "meta": { /* pagination */ } }
  // error
  { "success": false, "message": "Human readable error", "errors": [ /* field issues */ ] }
  ```
- **Auth:** send the access token as `Authorization: Bearer <token>`. Refresh tokens are set/read via an httpOnly cookie; call `POST /auth/refresh` to rotate.
- **Pagination:** list endpoints accept `?page`, `?limit`, `?sort` (e.g. `-createdAt`), plus resource-specific filters. `meta` returns `{ total, page, limit, totalPages, hasNext, hasPrev }`.
- **RBAC roles:** `customer` < `manager` < `admin`. Staff = manager|admin.
- **Errors:** `400` validation, `401` unauthenticated, `403` forbidden, `404` not found, `409` conflict, `429` rate-limited, `500` server.

## Auth — `/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | – | Create account, returns user + access token, sets refresh cookie |
| POST | `/auth/login` | – | Authenticate |
| POST | `/auth/refresh` | cookie | Rotate refresh token, issue new access token |
| POST | `/auth/logout` | user | Invalidate refresh token |
| GET  | `/auth/me` | user | Current profile |
| PATCH| `/auth/me` | user | Update profile |
| POST | `/auth/change-password` | user | Change password |
| POST | `/auth/forgot-password` | – | Request reset email |
| POST | `/auth/reset-password` | – | Reset with token |
| POST | `/auth/verify-email` | – | Verify email with token |

## Products — `/products`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/products` | – | List with filters: `search, category, brand, minPrice, maxPrice, minRating, inStock, onDeal, featured, sort, page, limit` |
| GET | `/products/featured` | – | Featured products |
| GET | `/products/best-sellers` | – | Best sellers |
| GET | `/products/deals` | – | On-deal products |
| GET | `/products/flash-sales` | – | Active flash sales |
| GET | `/products/:idOrSlug` | – | Product detail |
| GET | `/products/:idOrSlug/related` | – | Related products |
| POST | `/products` | manager | Create product |
| PATCH | `/products/:id` | manager | Update product |
| DELETE | `/products/:id` | admin | Delete product |

## Categories — `/categories` · Brands — `/brands`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/categories` | – | List (`?featured=true`) |
| GET | `/categories/:idOrSlug` | – | Detail |
| POST/PATCH/DELETE | `/categories/:id` | manager/admin | Manage |
| GET | `/brands` | – | List |
| GET | `/brands/:idOrSlug` | – | Detail |

## Cart — `/cart` (auth required)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/cart` | View cart with computed totals |
| POST | `/cart/items` | Add `{ productId, quantity }` |
| PATCH | `/cart/items/:productId` | Update quantity |
| DELETE | `/cart/items/:productId` | Remove item |
| DELETE | `/cart` | Clear cart |
| POST | `/cart/coupon` | Apply `{ code }` |
| DELETE | `/cart/coupon` | Remove coupon |

## Orders — `/orders` (auth required)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/orders/checkout` | user | Place order `{ shippingAddress, paymentMethod, notes? }` |
| GET | `/orders` | user | My orders (paginated) |
| GET | `/orders/:id` | user | Order detail |
| POST | `/orders/:id/cancel` | user | Cancel (pending/paid) — restocks |
| GET | `/orders/admin/all` | staff | All orders (`?status`) |
| PATCH | `/orders/:id/status` | staff | Transition status (state-machine guarded) |

## Reviews — `/reviews`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/reviews/product/:productId` | – | Approved reviews for a product |
| POST | `/reviews` | user | Create `{ product, rating, title, comment }` (pending moderation) |
| GET | `/reviews` | staff | Moderation queue (`?status`) |
| PATCH | `/reviews/:id/moderate` | staff | `{ status: approved|rejected }` |
| DELETE | `/reviews/:id` | admin | Delete |

## Coupons — `/coupons`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/coupons/validate/:code` | user | Validate a code |
| GET/POST/PATCH/DELETE | `/coupons` `/coupons/:id` | staff | Manage coupons |

## Addresses — `/addresses` (auth) · Notifications — `/notifications` (auth)
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/addresses` | List / create |
| PATCH/DELETE | `/addresses/:id` | Update / remove |
| GET | `/notifications` | List (with unread count) |
| PATCH | `/notifications/:id/read` | Mark read |
| PATCH | `/notifications/read-all` | Mark all read |

## Users — `/users` (staff)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users` | staff | List/search users |
| PATCH | `/users/:id/role` | admin | Change role |
| PATCH | `/users/:id/status` | admin | Enable/disable |
| GET | `/users/me/wishlist` | user | Wishlist products |
| POST/DELETE | `/users/me/wishlist/:productId` | user | Add / remove |
| GET | `/users/me/recently-viewed` | user | Recently viewed |

## Inventory — `/inventory` (staff)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/inventory/low-stock` | Products below threshold |
| GET | `/inventory/out-of-stock` | Out-of-stock products |
| POST | `/inventory/adjust/:productId` | `{ change, reason, reference? }` with history |

## Analytics — `/analytics` (staff)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/analytics/dashboard` | KPI summary |
| GET | `/analytics/sales?days=30` | Daily revenue/orders series |
| GET | `/analytics/top-products?limit=10` | Best sellers |
| GET | `/analytics/orders-by-status` | Count per status |

## Uploads — `/uploads` (staff) · Health — `/health`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/uploads` | Multipart image upload (multer) |
| GET | `/health` | Liveness/readiness probe |
