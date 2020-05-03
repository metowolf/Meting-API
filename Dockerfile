FROM php:7.4.5-apache-buster

LABEL maintainer="metowolf <i@i-meto.com>"

COPY root /
RUN /tmp/build.sh

EXPOSE 80
CMD ["apache2-foreground"]