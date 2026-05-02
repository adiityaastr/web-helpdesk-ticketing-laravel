#!/bin/sh
set -e

# ------------------------------------------------------------------
# Create .env from .env.example if missing
# ------------------------------------------------------------------
if [ ! -f /var/www/html/.env ]; then
    echo "==> Creating .env from .env.example..."
    cp /var/www/html/.env.example /var/www/html/.env
fi

# ------------------------------------------------------------------
# Fix permissions (storage & bootstrap/cache must be writable)
# ------------------------------------------------------------------
chown -R www-data:www-data /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/bootstrap/cache

if [ -d /var/www/html/storage ]; then
    mkdir -p /var/www/html/storage/framework/cache/data
    mkdir -p /var/www/html/storage/framework/sessions
    mkdir -p /var/www/html/storage/framework/views
    mkdir -p /var/www/html/storage/logs
    mkdir -p /var/www/html/storage/app/public
    chown -R www-data:www-data /var/www/html/storage
    chmod -R 775 /var/www/html/storage
fi

# ------------------------------------------------------------------
# Install PHP dependencies (skip if vendor already exists)
# ------------------------------------------------------------------
if [ ! -f /var/www/html/vendor/autoload.php ]; then
    echo "==> Installing PHP dependencies..."
    composer install --no-interaction --optimize-autoloader
fi

# ------------------------------------------------------------------
# Generate APP_KEY if empty
# ------------------------------------------------------------------
if ! grep -q '^APP_KEY=.\+' /var/www/html/.env 2>/dev/null; then
    echo "==> Generating application key..."
    php artisan key:generate --force
fi

# ------------------------------------------------------------------
# Storage symlink (so uploaded files are accessible via URL)
# ------------------------------------------------------------------
echo "==> Creating storage symlink..."
php artisan storage:link 2>/dev/null || true

# ------------------------------------------------------------------
# Wait for database, then run migrations + seeders
# ------------------------------------------------------------------
echo "==> Waiting for database..."
until php artisan migrate --force 2>/dev/null; do
    echo "    Retrying in 2s..."
    sleep 2
done

echo "==> Seeding database..."
php artisan db:seed --force 2>/dev/null || true

echo "==> Setup complete, starting PHP-FPM..."

# ------------------------------------------------------------------
# Start PHP-FPM via the official Docker entrypoint
# ------------------------------------------------------------------
exec docker-php-entrypoint php-fpm
