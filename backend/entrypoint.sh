#!/bin/sh
set -e

echo "Running database migrations..."
alembic upgrade head

if [ "$SEED_DATA" = "true" ]; then
    echo "Seeding initial data..."
    python scripts/seed.py
fi

echo "Starting server..."
exec uvicorn main:app --reload --host 0.0.0.0 --port 8000
