#!/bin/sh
set -e

# sslmode が未指定の場合のみ付与
DB_URL="${DATABASE_URL}"
case "$DB_URL" in
  *sslmode=*) ;;
  *\?*) DB_URL="${DB_URL}&sslmode=disable" ;;
  *)    DB_URL="${DB_URL}?sslmode=disable" ;;
esac

echo "Running database migrations..."
/usr/local/bin/migrate \
  -path /app/migrations \
  -database "$DB_URL" \
  up

echo "Starting server..."
exec ./server
