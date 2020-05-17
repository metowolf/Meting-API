#!/bin/sh

set -e

apk update
apk add logrotate
apk add openrc
apk add php7 \
    php7-fpm \
    php7-opcache \
    php7-bcmath \
    php7-curl \
    php7-apcu \
    php7-mbstring \
    php7-json \
    php7-openssl
apk add composer
apk add nginx

# openrc
mkdir -p /run/openrc
touch /run/openrc/softlevel

# composer
cd /var/www/meting
composer install --no-dev --optimize-autoloader
composer clearcache

# clean
apk del composer
rm -rf /var/cache/apk/*