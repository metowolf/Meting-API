FROM alpine:3.11

LABEL maintainer="metowolf <i@i-meto.com>"

COPY root /
RUN /tmp/build.sh

EXPOSE 80

ENTRYPOINT ["docker-entrypoint.sh"]