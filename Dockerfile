FROM node:22-alpine

ARG NODE_ENV
ENV NODE_ENV ${NODE_ENV:-production}

WORKDIR /app

COPY . /app

RUN yarn

EXPOSE 80 443
ENTRYPOINT ["node", "src/index.js"]
