FROM php:8.3-fpm-alpine AS base

ARG APCU_VERSION=5.1.24
ARG REDIS_VERSION=6.0.2

RUN apk add --no-cache \
        mysql-dev \
        libzip-dev \
        libxml2-dev \
        oniguruma-dev \
        linux-headers \
        curl-dev \
        libpng-dev \
        libjpeg-turbo-dev \
        freetype-dev \
        $PHPIZE_DEPS \
        git \
        unzip \
        vim \
        bash \
        procps \
        net-tools \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        opcache \
        mbstring \
        xml \
        bcmath \
        curl \
        zip \
        gd \
        pcntl \
        exif \
    && pecl install redis-${REDIS_VERSION} apcu-${APCU_VERSION} \
    && docker-php-ext-enable redis apcu \
    && rm -rf /tmp/pear

RUN echo "opcache.enable=1" > /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.enable_cli=1" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.memory_consumption=256" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.interned_strings_buffer=16" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.max_accelerated_files=10000" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.max_wasted_percentage=10" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.revalidate_freq=2" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.fast_shutdown=1" >> /usr/local/etc/php/conf.d/opcache.ini

RUN echo "memory_limit=512M" > /usr/local/etc/php/conf.d/memory.ini \
    && echo "upload_max_filesize=20M" >> /usr/local/etc/php/conf.d/memory.ini \
    && echo "post_max_size=20M" >> /usr/local/etc/php/conf.d/memory.ini \
    && echo "max_execution_time=300" >> /usr/local/etc/php/conf.d/memory.ini

RUN echo "pm.status_path = /status" >> /usr/local/etc/php-fpm.d/www.conf \
    && echo "ping.path = /ping" >> /usr/local/etc/php-fpm.d/www.conf \
    && echo "pm.health_path = /health" >> /usr/local/etc/php-fpm.d/www.conf

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

RUN addgroup -g 1000 laravel \
    && adduser -u 1000 -G laravel -D laravel

WORKDIR /var/www/html

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
COPY docker/queue-worker.sh /usr/local/bin/queue-worker.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh /usr/local/bin/queue-worker.sh

RUN mkdir -p /var/www/html/storage/framework/cache/data \
    && mkdir -p /var/www/html/storage/framework/sessions \
    && mkdir -p /var/www/html/storage/framework/views \
    && mkdir -p /var/www/html/storage/logs \
    && mkdir -p /var/www/html/storage/app/public \
    && mkdir -p /var/www/html/bootstrap/cache \
    && chown -R laravel:laravel /var/www/html

USER laravel

EXPOSE 9000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD php-fpm-healthcheck || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["php-fpm"]
