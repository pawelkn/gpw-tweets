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

RUN set -x && apt-get update && apt-get install -y tzdata cron fonts-liberation fonts-dejavu

ENV TZ Europe/Warsaw
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

COPY package.json polish-stocks.json ./
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules

RUN echo "01 19 * * 1-5 cd /app; npm start > /proc/1/fd/1 2> /proc/1/fd/2" > /etc/cron.d/app
RUN crontab /etc/cron.d/app

VOLUME /app/mstall
VOLUME /app/images

CMD ["cron", "-f"]