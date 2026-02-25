#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT_DIR/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/daily-refresh-$(date +%F).log"

# Redirect all output to rotating daily log (stdout and stderr)
exec > >(tee -a "$LOG_FILE") 2>&1

echo "============================================================"
echo "Daily Refresh Started: $(date)"
echo "Log file: $LOG_FILE"
echo "============================================================"

cd "$ROOT_DIR/scraper"
echo "[1/3] 🛍️ Running Shopify TechMarkIt scraper..."
# Use incremental mode by default; pass --full on Sundays or when forced
DOW=$(date +%u)
SCRAPER_ARGS=""
if [ "${FORCE_FULL:-0}" = "1" ]; then
  SCRAPER_ARGS="--full"
elif [ "$DOW" -eq 7 ]; then
  SCRAPER_ARGS="--full"
fi
node run-shopify-scraper.js $SCRAPER_ARGS

cd "$ROOT_DIR/backend"
echo "[2/3] 📦 Importing scraped data into database..."
npm run import-data

echo "[3/3] ✅ Daily refresh completed at $(date)"

# Prune logs older than 14 days
find "$LOG_DIR" -name 'daily-refresh-*.log' -type f -mtime +14 -print -delete || true

echo "============================================================"

