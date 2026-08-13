# Environment Variables

## Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `NODE_ENV` | – | `development` | `development` \| `production` \| `test` |
| `PORT` | – | `5000` | API listen port |
| `MONGODB_URI` | ✅ | – | MongoDB connection string |
| `JWT_ACCESS_SECRET` | ✅ | – | Secret for signing access tokens (32+ chars) |
| `JWT_REFRESH_SECRET` | ✅ | – | Secret for signing refresh tokens (32+ chars) |
| `JWT_ACCESS_EXPIRES_IN` | – | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRES_IN` | – | `7d` | Refresh token TTL |
| `CLIENT_URL` | ✅ | `http://localhost:3000` | Allowed CORS origin (frontend) |
| `COOKIE_DOMAIN` | – | `localhost` | Domain scope for the refresh cookie |
| `RATE_LIMIT_WINDOW_MS` | – | `900000` | Rate-limit window (15 min) |
| `RATE_LIMIT_MAX` | – | `300` | Max requests per window per IP |
| `BCRYPT_SALT_ROUNDS` | – | `12` | Password hashing cost |
| `SEED_ADMIN_EMAIL` | – | `admin@supermarket.local` | Seed admin login |
| `SEED_ADMIN_PASSWORD` | – | `Admin@12345` | Seed admin password |
| `UPLOAD_DIR` | – | `uploads` | Local upload directory |
| `LOG_LEVEL` | – | `info` | Winston log level |

> Env is validated at boot with Zod (`src/config/env.ts`). Missing required vars stop startup with a clear error.

## Frontend (`frontend/.env`)

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | `http://localhost:5000/api/v1` | Base URL of the REST API |
| `NEXT_PUBLIC_SITE_URL` | – | `http://localhost:3000` | Canonical site URL (SEO, sitemap) |
| `NEXT_PUBLIC_SITE_NAME` | – | `FreshMart` | Brand name shown in UI/metadata |

> `NEXT_PUBLIC_*` vars are inlined into the client bundle — never put secrets here.

## Root (`.env` for docker-compose)

Consumed by `docker-compose.yml` to wire the four services together. See
[`.env.example`](../.env.example). Key values: `MONGO_ROOT_USER`,
`MONGO_ROOT_PASSWORD`, `MONGO_DB`, the two `JWT_*_SECRET`s, `CLIENT_URL`,
`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`.

## Generating strong secrets

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Run twice — once for `JWT_ACCESS_SECRET`, once for `JWT_REFRESH_SECRET`.
