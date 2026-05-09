# Web Helpdesk Ticketing System - Deployment & Setup Guide

## 📦 Deployment & Setup Guide

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Docker Setup](#docker-setup)
4. [Database Setup](#database-setup)
5. [Environment Configuration](#environment-configuration)
6. [Production Deployment](#production-deployment)
7. [Maintenance & Monitoring](#maintenance--monitoring)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

**Minimum:**
- CPU: 2 cores
- RAM: 2GB
- Storage: 10GB
- OS: Linux, macOS, or Windows (with WSL2)

**Recommended:**
- CPU: 4+ cores
- RAM: 4GB+
- Storage: 20GB+
- OS: Ubuntu 20.04 LTS or later

### Required Software

- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Git**: 2.30+
- **Node.js**: 18+ (for local development)
- **PHP**: 8.3+ (for local development)
- **Composer**: 2.0+ (for local development)

### Installation

#### macOS
```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Docker Desktop
brew install --cask docker

# Install Git
brew install git

# Install Node.js
brew install node

# Install PHP
brew install php@8.3

# Install Composer
brew install composer
```

#### Ubuntu/Debian
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt install git -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y

# Install PHP
sudo apt install php8.3 php8.3-fpm php8.3-mysql php8.3-redis -y

# Install Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```

#### Windows (WSL2)
```powershell
# Enable WSL2
wsl --install

# Install Ubuntu 20.04
wsl --install -d Ubuntu-20.04

# Then follow Ubuntu/Debian instructions in WSL terminal
```

---

## Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/web-helpdesk-ticketing-laravel.git
cd web-helpdesk-ticketing-laravel
```

### 2. Copy Environment File

```bash
cp .env.example .env
```

### 3. Update .env for Local Development

```env
APP_NAME="Web Helpdesk"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=helpdesk
DB_USERNAME=root
DB_PASSWORD=root

CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=cookie

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=log
MAIL_FROM_ADDRESS=noreply@helpdesk.local
```

### 4. Install PHP Dependencies

```bash
composer install
```

### 5. Install Node Dependencies

```bash
npm install
```

### 6. Generate Application Key

```bash
php artisan key:generate
```

### 7. Create Database

```bash
# Using MySQL CLI
mysql -u root -p
CREATE DATABASE helpdesk;
EXIT;

# Or using Laravel
php artisan migrate:fresh
```

### 8. Run Migrations

```bash
php artisan migrate
```

### 9. Seed Database (Optional)

```bash
php artisan db:seed
```

### 10. Create Storage Link

```bash
php artisan storage:link
```

### 11. Start Development Server

```bash
# Terminal 1: Start Laravel server
php artisan serve

# Terminal 2: Start Vite dev server
npm run dev

# Terminal 3: Start Queue Worker
php artisan queue:work

# Terminal 4: Start Redis (if not running as service)
redis-server
```

**Access Application:**
- Web: http://localhost:8000
- API: http://localhost:8000/api/v1
- Vite: http://localhost:5173

---

## Docker Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/web-helpdesk-ticketing-laravel.git
cd web-helpdesk-ticketing-laravel
```

### 2. Copy Environment File

```bash
cp .env.example .env
```

### 3. Update .env for Docker

```env
APP_NAME="Web Helpdesk"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=helpdesk
DB_USERNAME=helpdesk
DB_PASSWORD=helpdesk_password

CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=cookie

REDIS_HOST=redis
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=log
```

### 4. Build and Start Containers

```bash
# Build images
docker compose build

# Start containers
docker compose up -d

# Verify containers are running
docker compose ps
```

### 5. Install Dependencies Inside Container

```bash
# Install PHP dependencies
docker compose exec app composer install

# Install Node dependencies
docker compose exec app npm install

# Generate app key
docker compose exec app php artisan key:generate
```

### 6. Setup Database

```bash
# Run migrations
docker compose exec app php artisan migrate

# Seed database (optional)
docker compose exec app php artisan db:seed

# Create storage link
docker compose exec app php artisan storage:link
```

### 7. Build Frontend

```bash
docker compose exec app npm run build
```

### 8. Start Development

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f app

# Stop services
docker compose down
```

**Access Application:**
- Web: http://localhost:8000
- API: http://localhost:8000/api/v1
- Adminer (DB): http://localhost:8080
- MailHog: http://localhost:8025

---

## Database Setup

### Initial Setup

```bash
# Run all migrations
php artisan migrate

# Or with Docker
docker compose exec app php artisan migrate
```

### Seed Sample Data

```bash
# Run seeders
php artisan db:seed

# Or specific seeder
php artisan db:seed --class=CategorySeeder

# With Docker
docker compose exec app php artisan db:seed
```

### Fresh Database

```bash
# Reset and migrate
php artisan migrate:fresh

# Reset, migrate, and seed
php artisan migrate:fresh --seed

# With Docker
docker compose exec app php artisan migrate:fresh --seed
```

### Backup Database

```bash
# MySQL dump
mysqldump -u helpdesk -p helpdesk > backup_$(date +%Y%m%d_%H%M%S).sql

# With Docker
docker compose exec db mysqldump -u helpdesk -phelpdesk_password helpdesk > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database

```bash
# From backup
mysql -u helpdesk -p helpdesk < backup_20260509_050000.sql

# With Docker
docker compose exec -T db mysql -u helpdesk -phelpdesk_password helpdesk < backup_20260509_050000.sql
```

---

## Environment Configuration

### .env Variables

```env
# Application
APP_NAME=Web Helpdesk
APP_ENV=production
APP_DEBUG=false
APP_URL=https://helpdesk.example.com
APP_KEY=base64:xxxxx

# Database
DB_CONNECTION=mysql
DB_HOST=db.example.com
DB_PORT=3306
DB_DATABASE=helpdesk
DB_USERNAME=helpdesk_user
DB_PASSWORD=strong_password

# Cache
CACHE_DRIVER=redis
CACHE_TTL=3600

# Queue
QUEUE_CONNECTION=redis
QUEUE_FAILED_TABLE=failed_jobs

# Redis
REDIS_HOST=redis.example.com
REDIS_PASSWORD=redis_password
REDIS_PORT=6379

# Mail
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=465
MAIL_USERNAME=your_username
MAIL_PASSWORD=your_password
MAIL_FROM_ADDRESS=noreply@helpdesk.example.com
MAIL_FROM_NAME="Web Helpdesk"

# Session
SESSION_DRIVER=cookie
SESSION_LIFETIME=120

# Logging
LOG_CHANNEL=stack
LOG_LEVEL=debug

# Sanctum
SANCTUM_STATEFUL_DOMAINS=helpdesk.example.com
SANCTUM_GUARD=web
```

### Production Configuration

```env
APP_ENV=production
APP_DEBUG=false
LOG_LEVEL=warning
CACHE_DRIVER=redis
SESSION_DRIVER=cookie
QUEUE_CONNECTION=redis
```

---

## Production Deployment

### 1. Server Setup

#### Ubuntu 20.04 LTS

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y \
  curl \
  git \
  nginx \
  mysql-server \
  redis-server \
  php8.3-fpm \
  php8.3-mysql \
  php8.3-redis \
  php8.3-curl \
  php8.3-mbstring \
  php8.3-xml \
  php8.3-zip \
  composer \
  certbot \
  python3-certbot-nginx

# Start services
sudo systemctl start nginx
sudo systemctl start mysql
sudo systemctl start redis-server
sudo systemctl enable nginx mysql redis-server
```

### 2. Clone and Setup Application

```bash
# Create app directory
sudo mkdir -p /var/www/helpdesk
cd /var/www/helpdesk

# Clone repository
sudo git clone https://github.com/yourusername/web-helpdesk-ticketing-laravel.git .

# Set permissions
sudo chown -R www-data:www-data /var/www/helpdesk
sudo chmod -R 755 /var/www/helpdesk
sudo chmod -R 775 /var/www/helpdesk/storage
sudo chmod -R 775 /var/www/helpdesk/bootstrap/cache

# Install dependencies
sudo -u www-data composer install --no-dev --optimize-autoloader

# Install Node dependencies
sudo -u www-data npm install --production

# Build frontend
sudo -u www-data npm run build

# Setup environment
sudo cp .env.example .env
sudo nano .env  # Edit configuration

# Generate key
sudo -u www-data php artisan key:generate

# Run migrations
sudo -u www-data php artisan migrate --force

# Create storage link
sudo -u www-data php artisan storage:link
```

### 3. Configure Nginx

Create `/etc/nginx/sites-available/helpdesk`:

```nginx
server {
    listen 80;
    server_name helpdesk.example.com;
    root /var/www/helpdesk/public;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/helpdesk /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Setup SSL Certificate

```bash
# Using Let's Encrypt
sudo certbot --nginx -d helpdesk.example.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### 5. Configure Queue Worker

Create `/etc/systemd/system/helpdesk-queue.service`:

```ini
[Unit]
Description=Helpdesk Queue Worker
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/helpdesk
ExecStart=/usr/bin/php /var/www/helpdesk/artisan queue:work redis --sleep=3 --tries=3
Restart=unless-stopped
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable helpdesk-queue
sudo systemctl start helpdesk-queue
```

### 6. Configure Cron Job

Add to crontab:
```bash
sudo crontab -e

# Add this line
* * * * * cd /var/www/helpdesk && php artisan schedule:run >> /dev/null 2>&1
```

### 7. Setup Monitoring

```bash
# Install Supervisor for process management
sudo apt install supervisor -y

# Create config
sudo nano /etc/supervisor/conf.d/helpdesk.conf
```

Content:
```ini
[program:helpdesk-queue]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/helpdesk/artisan queue:work redis --sleep=3 --tries=3
autostart=true
autorestart=true
numprocs=1
redirect_stderr=true
stdout_logfile=/var/log/helpdesk-queue.log
user=www-data
```

Start:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start helpdesk-queue:*
```

---

## Maintenance & Monitoring

### Regular Backups

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/helpdesk"
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
mysqldump -u helpdesk -p$DB_PASSWORD helpdesk | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Application backup
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /var/www/helpdesk

# Keep only last 30 days
find $BACKUP_DIR -type f -mtime +30 -delete
```

Schedule with cron:
```bash
0 2 * * * /usr/local/bin/backup-helpdesk.sh
```

### Log Monitoring

```bash
# View application logs
tail -f /var/www/helpdesk/storage/logs/laravel.log

# View queue logs
tail -f /var/log/helpdesk-queue.log

# View Nginx logs
tail -f /var/log/nginx/error.log
```

### Performance Monitoring

```bash
# Check disk usage
df -h

# Check memory usage
free -h

# Check CPU usage
top

# Check MySQL status
sudo systemctl status mysql

# Check Redis status
redis-cli ping
```

### Cache Management

```bash
# Clear all cache
php artisan cache:clear

# Clear specific cache
php artisan cache:forget key_name

# Clear config cache
php artisan config:clear

# Clear view cache
php artisan view:clear
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Error

```bash
# Check MySQL is running
sudo systemctl status mysql

# Check credentials
mysql -u helpdesk -p -h localhost

# Check Laravel connection
php artisan tinker
>>> DB::connection()->getPdo();
```

#### 2. Queue Not Processing

```bash
# Check Redis connection
redis-cli ping

# Check queue status
php artisan queue:failed

# Retry failed jobs
php artisan queue:retry all

# Restart queue worker
sudo systemctl restart helpdesk-queue
```

#### 3. File Upload Issues

```bash
# Check storage permissions
ls -la /var/www/helpdesk/storage/

# Fix permissions
sudo chown -R www-data:www-data /var/www/helpdesk/storage
sudo chmod -R 775 /var/www/helpdesk/storage

# Create storage link
php artisan storage:link
```

#### 4. Memory Issues

```bash
# Increase PHP memory limit
sudo nano /etc/php/8.3/fpm/php.ini
# Set: memory_limit = 512M

# Restart PHP-FPM
sudo systemctl restart php8.3-fpm
```

#### 5. Nginx 502 Bad Gateway

```bash
# Check PHP-FPM status
sudo systemctl status php8.3-fpm

# Check Nginx error log
tail -f /var/log/nginx/error.log

# Restart services
sudo systemctl restart php8.3-fpm
sudo systemctl restart nginx
```

#### 6. Slow Performance

```bash
# Clear cache
php artisan cache:clear

# Optimize autoloader
composer dump-autoload --optimize

# Optimize config
php artisan config:cache

# Optimize routes
php artisan route:cache

# Optimize views
php artisan view:cache
```

### Debug Mode

Enable debug mode (development only):
```env
APP_DEBUG=true
```

View detailed error logs:
```bash
tail -f storage/logs/laravel.log
```

### Health Check

```bash
# Check application health
curl http://localhost:8000/health

# Check API health
curl http://localhost:8000/api/v1/health

# Check database
php artisan tinker
>>> DB::connection()->getPdo();

# Check Redis
redis-cli ping
```

---

## Scaling Considerations

### Horizontal Scaling

1. **Load Balancer**: Use Nginx or HAProxy
2. **Multiple App Servers**: Run multiple PHP-FPM instances
3. **Shared Database**: Use managed MySQL service
4. **Shared Cache**: Use managed Redis service
5. **Shared Storage**: Use S3 or similar

### Vertical Scaling

1. Increase server resources (CPU, RAM)
2. Optimize database queries
3. Implement caching strategies
4. Use CDN for static assets

---

**Last Updated**: 2026-05-09
**Version**: 1.0.0
