FROM alpine:3.11

LABEL maintainer="metowolf <i@i-meto.com>"

COPY build /
RUN /tmp/install.sh
COPY root /

EXPOSE 80

ENTRYPOINT ["docker-entrypoint.sh"]