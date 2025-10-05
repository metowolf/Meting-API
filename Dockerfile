FROM node:18-alpine

ARG NODE_ENV
ENV NODE_ENV ${NODE_ENV:-production}

WORKDIR /app

COPY . /app

RUN yarn

EXPOSE 3000
ENTRYPOINT ["node", "src/index.js"]
