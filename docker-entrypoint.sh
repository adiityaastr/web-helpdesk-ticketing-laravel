#!/bin/bash
set -e

log()  { echo "[$(date '+%H:%M:%S')] $*"; }
warn() { echo "[$(date '+%H:%M:%S')] [WARN] $*"; }

APP_DIR="/var/www/html"

log "============================================"
log " Helpdesk Ticketing — Container Init"
log "============================================"

log "Step 1/8 — Copy .env if missing"
if [ ! -f "$APP_DIR/.env" ]; then
    if [ -f "$APP_DIR/.env.docker" ]; then
        cp "$APP_DIR/.env.docker" "$APP_DIR/.env"
        log "  -> Copied .env.docker -> .env"
    elif [ -f "$APP_DIR/.env.example" ]; then
        cp "$APP_DIR/.env.example" "$APP_DIR/.env"
        log "  -> Copied .env.example -> .env"
    fi
fi

log "Step 2/8 — Storage directories"
mkdir -p "$APP_DIR/storage/framework/cache/data" \
         "$APP_DIR/storage/framework/sessions" \
         "$APP_DIR/storage/framework/views" \
         "$APP_DIR/storage/logs" \
         "$APP_DIR/storage/app/public"
chmod -R 775 "$APP_DIR/storage" "$APP_DIR/bootstrap/cache" 2>/dev/null || true

log "Step 3/8 — Composer install"
if [ ! -f "$APP_DIR/vendor/autoload.php" ]; then
    composer install --no-interaction --no-progress --optimize-autoloader
    log "  -> Dependencies installed"
else
    log "  -> vendor/ exists, skipping"
fi

log "Step 4/8 — Application key"
if ! grep -q '^APP_KEY=.\+' "$APP_DIR/.env" 2>/dev/null; then
    php artisan key:generate --force
    log "  -> Key generated"
else
    log "  -> Key exists"
fi

log "Step 5/8 — Storage symlink"
php artisan storage:link 2>/dev/null || true

log "Step 6/8 — Database migrations"
RETRIES=30
until php artisan migrate --force 2>/dev/null; do
    RETRIES=$((RETRIES-1))
    if [ $RETRIES -le 0 ]; then
        warn "   Database unreachable after 30 attempts"
        break
    fi
    sleep 2
done
log "  -> Migrations done"

log "Step 7/8 — Database seed"
if ! php artisan tinker --execute="echo \App\Models\User::count();" 2>/dev/null | grep -q '[1-9]'; then
    php artisan db:seed --force 2>/dev/null || true
    log "  -> Seeded"
else
    log "  -> Already seeded, skipping"
fi

log "Step 8/8 — Cache warmup"
php artisan optimize 2>/dev/null || true
php artisan event:cache 2>/dev/null || true

log "============================================"
log " Setup complete — starting PHP-FPM"
log "============================================"

exec docker-php-entrypoint php-fpm
