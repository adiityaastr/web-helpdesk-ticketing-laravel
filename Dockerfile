FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
        mysql-dev \
        libzip-dev \
        libxml2-dev \
        oniguruma-dev \
        linux-headers \
        curl-dev \
        $PHPIZE_DEPS \
        git \
        unzip \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        opcache \
        mbstring \
        xml \
        bcmath \
        curl \
        zip \
    && pecl install redis-6.0.2 \
    && docker-php-ext-enable redis \
    && echo "opcache.enable=1" > /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.memory_consumption=128" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.interned_strings_buffer=8" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.max_accelerated_files=10000" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.revalidate_freq=2" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "memory_limit=256M" > /usr/local/etc/php/conf.d/memory.ini

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["php-fpm"]
