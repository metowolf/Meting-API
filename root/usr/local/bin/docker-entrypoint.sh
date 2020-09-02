#!/bin/sh

openrc > /dev/null 2>&1

if [ ! -f /etc/php7/php-fpm.d/meting.conf ]; then
    echo '[www]' > /etc/php7/php-fpm.d/meting.conf
    env | grep 'METING_' | sed "s/\(.*\)=\(.*\)/env[\1]='\2'/" >> /etc/php7/php-fpm.d/meting.conf
fi

ln -sf /dev/stdout /var/log/nginx/access.log
ln -sf /dev/stderr /var/log/nginx/error.log

rc-service php-fpm7 start > /dev/null 2>&1

nginx -g "daemon off;"