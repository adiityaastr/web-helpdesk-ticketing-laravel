FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
        mysql-dev \
        postgresql-dev \
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
        pdo_pgsql \
        mbstring \
        xml \
        bcmath \
        curl \
        zip \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && docker-php-ext-configure pdo_mysql --with-pdo-mysql=mysqlnd

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["php-fpm"]
