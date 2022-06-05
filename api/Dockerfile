FROM alpine:3

LABEL maintainer="metowolf <i@i-meto.com>"
LABEL version="1.5.11"

RUN apk update
RUN apk add openrc
RUN apk add php8 \
  php8-fpm \
  php8-opcache \
  php8-bcmath \
  php8-curl \
  php8-mbstring \
  php8-json \
  php8-openssl
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

# clean
RUN apk del composer
RUN rm -rf /var/cache/apk/*

COPY root/etc /etc
COPY root/usr /usr

EXPOSE 80

ENTRYPOINT ["docker-entrypoint.sh"]