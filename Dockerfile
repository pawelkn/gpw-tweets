FROM node:22.13.0-alpine as build
WORKDIR /app

RUN apk add --no-cache sudo build-base g++ libpng libpng-dev jpeg-dev pango-dev cairo-dev giflib-dev python3 ca-certificates

ADD https://alpine-pkgs.sgerrand.com/sgerrand.rsa.pub /etc/apk/keys/sgerrand.rsa.pub
ADD https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.35-r1/glibc-2.35-r1.apk .
RUN apk add glibc-2.35-r1.apk

COPY package.json .

RUN npm install && \
    npm cache clean --force && \
    npm install tsc -g

COPY tsconfig.json .
COPY src ./src

ENV NODE_ENV production
RUN npm run build

FROM node:22.13.0-alpine as test
WORKDIR /app

COPY package.json .
COPY --from=build /app/node_modules /app/node_modules

COPY tsconfig.json .
COPY src ./src
COPY test ./test

CMD ["npm", "run", "test"]

FROM node:22.13.0-alpine
WORKDIR /app

RUN apk add --no-cache tzdata curl libpng jpeg pango cairo giflib
ENV TZ Europe/Warsaw
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN apk add --update --repository http://dl-3.alpinelinux.org/alpine/edge/testing \
    libmount ttf-dejavu ttf-opensans fontconfig

COPY package.json .
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/build /app/build

RUN npm prune --production

COPY polish-stocks.json ./

RUN echo "30 17 * * 1-5 cd /app; node build/gpw-tweets.js > /proc/1/fd/1 2> /proc/1/fd/2" >> /etc/crontabs/root && \
    echo "30 17 * * 6 cd /app; node build/gpw-tweets.js --weekly > /proc/1/fd/1 2> /proc/1/fd/2" >> /etc/crontabs/root

VOLUME /app/images

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["docker-entrypoint.sh"]

CMD ["crond", "-f", "-d", "8"]