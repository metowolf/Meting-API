#!/bin/sh

openrc > /dev/null 2>&1

if [ ! -f /etc/php8/php-fpm.d/meting.conf ]; then
    echo '[www]' > /etc/php8/php-fpm.d/meting.conf
    env | grep 'METING_' | sed "s/\(.*\)=\(.*\)/env[\1]='\2'/" >> /etc/php8/php-fpm.d/meting.conf
fi

ln -sf /dev/stdout /var/log/nginx/access.log
ln -sf /dev/stderr /var/log/nginx/error.log

php-fpm8

nginx -g "daemon off;"