FROM node:17.9.0-alpine

RUN apk add --no-cache tzdata
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

RUN echo "00 20 * * 1-5 cd /app; npm start > /proc/1/fd/1 2> /proc/1/fd/2" >> /etc/crontabs/root

VOLUME /app/mstall

CMD ["crond", "-f", "-d", "8"]