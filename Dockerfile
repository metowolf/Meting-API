FROM alpine:3.12

LABEL maintainer="metowolf <i@i-meto.com>"

RUN apk update
RUN apk add logrotate
RUN apk add openrc
RUN apk add php7 \
  php7-fpm \
  php7-opcache \
  php7-bcmath \
  php7-curl \
  php7-apcu \
  php7-mbstring \
  php7-json \
  php7-openssl
RUN apk add composer
RUN apk add nginx

# openrc
RUN mkdir -p /run/openrc \
  && touch /run/openrc/softlevel

COPY root/var /var

# composer
RUN cd /var/www/meting \
  && composer install --no-dev --optimize-autoloader \
  && composer clearcache

# log
RUN chown -R nginx /var/log/nginx 
RUN sed -i -e 's:/var/log/messages {}:# /var/log/messages {}:' /etc/logrotate.conf

# clean
RUN apk del composer
RUN rm -rf /var/cache/apk/*

COPY root/etc /etc
COPY root/usr /usr

EXPOSE 80

ENTRYPOINT ["docker-entrypoint.sh"]