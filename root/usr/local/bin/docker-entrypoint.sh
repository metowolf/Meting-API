#!/bin/sh

openrc
crond

if [ ! -f /etc/php7/php-fpm.d/meting.conf ]; then
    echo '[www]' > /etc/php7/php-fpm.d/meting.conf
    env | grep 'METING_' | sed "s/\(.*\)=\(.*\)/env[\1]='\2'/" >> /etc/php7/php-fpm.d/meting.conf
fi

rc-service php-fpm7 start
rc-service nginx start

tail -f