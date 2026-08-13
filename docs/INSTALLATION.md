# Installation Guide

This guide walks you through running the Supermarket Enterprise platform locally and with Docker.

## Prerequisites

| Tool           | Version           |
|----------------|-------------------|
| Node.js        | ≥ 20.x            |
| npm            | ≥ 10.x            |
| MongoDB        | ≥ 6.x (local dev) |
| Docker Engine  | ≥ 24 (optional)   |
| Docker Compose | v2 (optional)     |

## Option A — Docker Compose (recommended)

1. **Clone & configure**
   ```bash
   cd supermarket-enterprise
   cp .env.example .env
   # edit .env — set strong MONGO_ROOT_PASSWORD, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
   ```

2. **Build & run the full stack**
   ```bash
   docker compose up --build -d
   ```
   This starts four services: `mongo`, `api`, `web`, and the `gateway` (Nginx).

3. **Seed the catalogue** (optional but recommended)
   ```bash
   docker compose exec api npm run seed
   ```

4. **Open the app**
   - Storefront: <http://localhost> (Nginx) or <http://localhost:3000>
   - API: <http://localhost/api/v1> or <http://localhost:5000/api/v1>
   - API docs (Swagger): <http://localhost:5000/api/docs>

5. **Stop**
   ```bash
   docker compose down          # keep data
   docker compose down -v       # also remove Mongo volume
   ```

## Option B — Local development (no Docker)

### 1. Start MongoDB
Run a local MongoDB instance (or use MongoDB Atlas) and note the connection string.

### 2. Backend
```bash
cd backend
cp .env.example .env
# set MONGODB_URI, JWT secrets
npm install
npm run seed        # loads 120 products / 12 categories / 40 brands
npm run dev         # starts API on http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env
# NEXT_PUBLIC_API_URL should point to the backend, e.g. http://localhost:5000/api/v1
npm install
npm run dev         # starts Next.js on http://localhost:3000
```

## Verifying the install

```bash
curl http://localhost:5000/api/v1/health
# → { "success": true, "data": { "status": "ok", ... } }
```

Log in at <http://localhost:3000/login> with the demo admin account
(`admin@supermarket.local` / `Admin@12345`) and open **Admin Dashboard**.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `ECONNREFUSED` to Mongo | Ensure Mongo is running and `MONGODB_URI` is correct. |
| Seeder can't reach product APIs | It automatically falls back to the bundled `src/seed/data.json`. |
| CORS errors in browser | Set `CLIENT_URL` (backend) to the exact frontend origin. |
| Refresh-token loop / 401s | Confirm `COOKIE_DOMAIN` matches your host and clocks are in sync. |
| Images not loading | Add the image host to `images.remotePatterns` in `frontend/next.config.mjs`. |
