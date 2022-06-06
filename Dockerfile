FROM node:17.9.0-slim

RUN set -x && \
    apt-get update && \
    apt-get install -y tzdata cron build-essential make python3

ENV TZ Europe/Warsaw
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

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

RUN echo "01 19 * * 1-5 cd /app; npm start > /proc/1/fd/1 2> /proc/1/fd/2" > /etc/cron.d/app
RUN crontab /etc/cron.d/app

VOLUME /app/mstall
VOLUME /app/images

CMD ["cron", "-f"]