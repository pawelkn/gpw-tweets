FROM node:17.9.0-slim as build
WORKDIR /app

RUN set -x && apt-get update && apt-get install -y build-essential make python3

COPY package.json .

RUN npm install && \
    npm cache clean --force && \
    npm install tsc -g

COPY tsconfig.json .
COPY src ./src

ENV NODE_ENV production
RUN npm run build

FROM node:17.9.0-slim
WORKDIR /app

RUN set -x && apt-get update && apt-get install -y fonts-liberation fonts-dejavu

COPY package.json polish-stocks.json ./
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules

VOLUME /app/mstall
VOLUME /app/images

CMD ["node", "build/volume-notifier.js"]