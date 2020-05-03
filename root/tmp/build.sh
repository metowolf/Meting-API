#!/bin/sh

set -e

docker-php-ext-install bcmath

cd /var/www/meting/

# Cache
CACHE_VERSION=1.0.12
curl -L https://github.com/Gregwar/Cache/archive/v${CACHE_VERSION}.tar.gz -o Cache.tar.gz
tar zxvf Cache.tar.gz
rm Cache.tar.gz
ln -s Cache-${CACHE_VERSION} Cache
mkdir /tmp/cache
chown www-data /tmp/cache

# Meting
METING_VERSION=1.5.7
curl -L https://github.com/metowolf/Meting/archive/v${METING_VERSION}.tar.gz -o Meting.tar.gz
tar zxvf Meting.tar.gz
rm Meting.tar.gz
ln -s Meting-${METING_VERSION} Meting