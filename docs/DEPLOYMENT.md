# Deployment Guide

Production deployment options for the Supermarket Enterprise platform.

## 1. Self-hosted with Docker Compose + Nginx

The included `docker-compose.yml` is production-shaped: multi-stage images, health checks, an Nginx gateway with gzip, caching and rate limiting.

```bash
cp .env.example .env         # production secrets
docker compose up --build -d
docker compose exec api npm run seed   # first deploy only
```

### Hardening checklist
- [ ] Strong, unique `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` (32+ random bytes).
- [ ] Strong `MONGO_ROOT_PASSWORD`; do **not** expose port `27017` publicly (remove the mongo `ports:` mapping).
- [ ] Terminate TLS at Nginx or an upstream load balancer (add a `443` server block + certs, e.g. via Certbot / Let's Encrypt).
- [ ] Set `CLIENT_URL` and `NEXT_PUBLIC_SITE_URL` to your real HTTPS domain.
- [ ] Set `COOKIE_DOMAIN` to your apex domain so refresh cookies scope correctly.
- [ ] Put MongoDB on a managed service or a replica set with backups.
- [ ] Ship logs (Winston → stdout) to your log aggregator.

### Enabling HTTPS (sketch)
Add to `nginx/nginx.conf`:
```nginx
server {
  listen 443 ssl http2;
  server_name your-domain.com;
  ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
  # ...same location blocks as the :80 server...
}
```
Mount your certs into the `gateway` service and redirect `:80` → `:443`.

## 2. Split deployment (managed platforms)

| Component | Suggested host |
|-----------|----------------|
| Frontend (Next.js) | Vercel / Netlify / Cloud Run |
| Backend (Express)  | Render / Railway / Fly.io / ECS / Cloud Run |
| Database           | MongoDB Atlas |

### Frontend on Vercel
1. Import the `frontend/` directory as the project root.
2. Set env vars: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SITE_NAME`.
3. Build command `npm run build`, output handled automatically (App Router).

### Backend on Render/Railway
1. Root = `backend/`. Build `npm install && npm run build`. Start `npm start`.
2. Env vars: `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_URL`, `COOKIE_DOMAIN`, `NODE_ENV=production`.
3. Run the seed once via a one-off job: `npm run seed:prod`.

> When frontend and backend live on different domains, ensure the backend `CLIENT_URL` matches the frontend origin (CORS) and cookies use `SameSite=None; Secure`.

## 3. CI/CD

`.github/workflows/ci.yml` runs on every push/PR:
1. **backend** — install, lint, type-check, Jest tests.
2. **frontend** — install, lint, type-check, `next build`.
3. **docker** — build both images with Buildx.

Extend the `docker` job with `docker/login-action` + `push: true` to publish to GHCR/Docker Hub, then trigger your deploy (SSH `docker compose pull && up -d`, or a platform deploy hook).

## 4. Scaling notes
- The API is stateless — scale horizontally behind the gateway; keep refresh-token revocation working via the `tokenVersion` field (already implemented).
- Add a Redis layer for rate-limit counters and response caching when running multiple API replicas.
- Enable MongoDB replica set to unlock multi-document transactions (checkout already degrades gracefully to conditional updates on standalone Mongo).
- Serve `next/image` through a CDN and set long-cache headers (Nginx already does for `/_next/static`).
