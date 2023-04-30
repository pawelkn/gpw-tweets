# GPW Tweets

[![Test](https://github.com/pawelkn/gpw-tweets/actions/workflows/test.yml/badge.svg)](https://github.com/pawelkn/gpw-tweets/actions/workflows/test.yml)

GPW Tweets scans securities listed on the Warsaw Stock Exchange (GPW) on a daily and weekly basis, in search of increase in trading volume and matching candlestick patterns. The scan results are then posted on Twitter for public access.

<p align="center"><img src="tweet-example.png"/></p>

## Configuration

Twitter account configuration. To publish a tweet, you must create a twitter developer account on <https://developer.twitter.com/> and obtain a *Customer Key and Secret*. Then create a twitter application and obtain an *OAuth Access Token and Secret*.

Finally create a configuration file *twitter-credentials.json* and enter your sender account settings.

Example (**twitter-credentials.json**):

```json
{
    "appKey": "<Customer Key>",
    "appSecret": "<Customer Secret>",
    "accessToken": "<OAuth Access Token>",
    "accessSecret": "<OAuth Token Secret>"
}
```

Location of the file can be configured by using environment variables

Example:

```sh
export GPW_TWEETS_TWITTER_CREDENTIALS_FILE=/run/secrets/twitter-credentials
```

Minium volume change, minimum price and minimum daily turnover of scanned securities can be adjusted by using environment variables

Example (and default values):

```sh
export GPW_TWEETS_VOLUME_RISE=2.0
export GPW_TWEETS_MIN_TURNOVER=50_000
export GPW_TWEETS_MIN_PRICE=2.0
```

## Run

> ***Note:*** Before run, create a valid [configuration](#Configuration) file: *twitter-credentials.json*

Install dependencies and build application

```sh
npm install
npm run build
```

Application start

```sh
npm start
```

Optional command line options:

* *--weekly* - use a week interval
* *--dry-run* - do not post anything on twitter, just dummy application run
* *--no-date-check* - do not verify securities last quotation date

## Docker

> ***Note:*** Before run, create a valid [configuration](#Configuration) file: *twitter-credentials.json*

To avoid node version conflict and/or dependencies installation issues, run application in docker container

```sh
docker-compose up --build
```

## Unit tests

Run tests locally

```sh
npm run test
```

or using docker

```sh
docker build -t gpw-tweets-test --target test .
docker run --rm gpw-tweets-test
```
