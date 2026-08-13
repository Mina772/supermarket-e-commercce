#!/usr/bin/env bash
# Seed the database with the demo catalogue (120 products, 12 categories, 40 brands).
# Usage:  ./scripts/seed.sh            (local dev — runs in backend/)
#         COMPOSE=1 ./scripts/seed.sh  (inside docker compose)
set -euo pipefail

if [[ "${COMPOSE:-0}" == "1" ]]; then
  echo "▶ Seeding via docker compose…"
  docker compose exec api npm run seed
else
  echo "▶ Seeding local backend…"
  cd "$(dirname "$0")/../backend"
  npm run seed
fi

echo "✅ Seed complete."
echo "   Admin:    admin@supermarket.local / Admin@12345"
echo "   Manager:  manager@supermarket.local / Manager@12345"
echo "   Customer: customer@supermarket.local / Customer@12345"
