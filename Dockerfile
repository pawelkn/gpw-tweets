FROM node:17.9.0-alpine

RUN apk add --no-cache tzdata sudo curl build-base g++ libpng libpng-dev jpeg-dev pango-dev cairo-dev giflib-dev python3
ENV TZ Europe/Warsaw
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN apk --no-cache add ca-certificates wget  && \
    wget -q -O /etc/apk/keys/sgerrand.rsa.pub https://alpine-pkgs.sgerrand.com/sgerrand.rsa.pub && \
    wget https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.29-r0/glibc-2.29-r0.apk && \
    apk add glibc-2.29-r0.apk

RUN apk add --update --repository http://dl-3.alpinelinux.org/alpine/edge/testing \
    libmount ttf-dejavu ttf-droid ttf-freefont ttf-liberation fontconfig

WORKDIR /app

COPY package.json .

RUN npm install && \
    npm cache clean --force && \
    npm install tsc -g

COPY tsconfig.json .
COPY src ./src

ENV NODE_ENV production
RUN npm run build

COPY polish-stocks.json ./

RUN echo "01 19 * * 1-5 cd /app; npm start > /proc/1/fd/1 2> /proc/1/fd/2" >> /etc/crontabs/root

VOLUME /app/mstall
VOLUME /app/images

CMD ["crond", "-f", "-d", "8"]