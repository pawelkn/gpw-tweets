const args = require('args-parser')(process.argv)

import * as fs from 'fs'
import TwitterApi from 'twitter-api-v2'
import WSEQuotes from './wse-quotes'
import stockChart from './stock-chart'

const twitterCredentialsFile = process.env.GPW_TWEETS_TWITTER_CREDENTIALS_FILE || 'twitter-credentials.json'
const volumeRise = process.env.GPW_TWEETS_VOLUME_RISE || 2.0
const minTurnover = process.env.GPW_TWEETS_MIN_TURNOVER || 50_000
const minPrice = process.env.GPW_TWEETS_MIN_PRICE || 2.0

type PolishStock = { symbol: string, ISIN: string, name: string, quotationTable: string }
const polishStocks: PolishStock[] = JSON.parse(fs.readFileSync('polish-stocks.json', { encoding: 'utf8', flag: 'r' }))

type TwitterCredentials = { appKey: string, appSecret: string, accessToken: string, accessSecret: string }
const twitterCredentials: TwitterCredentials = JSON.parse(fs.readFileSync(twitterCredentialsFile, { encoding: 'utf8', flag: 'r' }))

const twitterApi = new TwitterApi({ ...twitterCredentials })
const twitterApiRW = twitterApi.readWrite

const bullishEngulfing: string[] = []
const bearishEngulfing: string[] = []
const bullishGap: string[] = []
const bearishGap: string[] = []
const morningStar: string[] = []
const shootingStar: string[] = []
const bearishSmash: string[] = []
const bullishSmash: string[] = []

const wseQuotes = new WSEQuotes()
wseQuotes.update()
    .then(() => scan()
        .then(() => tweetAll()))

async function scan() {
    const zeroPad = (num: number, places=2) => String(num).padStart(places, '0')
    const today = `${new Date().getFullYear()}${zeroPad(new Date().getMonth() + 1)}${zeroPad(new Date().getDate())}`

    for (const stock of polishStocks) {
        try {
            let hist = await wseQuotes.getHistorical(stock.name)
            if (hist.length < 2)
                continue

            const last = hist[hist.length - 1]
            const lastDate = `${+last.date.substring(0, 4)}-${+last.date.substring(4, 6) - 1}-${+last.date.substring(6, 8)}`
            const lastPrice = last.close
            const priceChange = (lastPrice / hist[hist.length - 2].close - 1) * 100

            if ((!('no-date-check' in args)) && (today !== last.date)) {
                console.warn('Date of last candlestick differs with a current date. Skipping', { name: stock.name, last: last.date, current: today })
                console.info('If you want to ignore this check, pass a --no-date-check argument in command line')
                continue
            }

            hist = wseQuotes.resample(hist, 'weekly' in args ? 'W' : 'D')
            if (hist.length < 2)
                continue

            const current = hist[hist.length - 1]
            const previous = hist[hist.length - 2]

            const currentAvg = (current.open + current.high + current.low + current.close) / 4
            const currentTurnover = currentAvg * current.volume

            if ((current.volume / previous.volume < volumeRise) || (currentTurnover < minTurnover) || (current.close < minPrice))
                continue

            let triggered = false
            if (current.isBullishEngulfing(previous)) { bullishEngulfing.push(stock.name); triggered = true }
            if (current.isBearishEngulfing(previous)) { bearishEngulfing.push(stock.name); triggered = true }
            if (current.isBullishGap(previous)) { bullishGap.push(stock.name); triggered = true }
            if (current.isBearishGap(previous)) { bearishGap.push(stock.name); triggered = true }
            if (current.isMorningStar(previous)) { morningStar.push(stock.name); triggered = true }
            if (current.isShootingStar(previous)) { shootingStar.push(stock.name); triggered = true }
            if (current.isBullishSmash(previous)) { bullishSmash.push(stock.name); triggered = true }
            if (current.isBearishSmash(previous)) { bearishSmash.push(stock.name); triggered = true }

            if (!triggered)
                continue

            const grid = 'weekly' in args ? 'year': 'month'
            const interval = 'weekly' in args ? '1 week' : '1 day'

            const image = stockChart(stock.name, hist.slice(-110), lastDate, lastPrice, priceChange, grid, interval)
            if (image) {
                fs.mkdirSync('./images/', { recursive: true })
                fs.writeFileSync(`./images/${stock.name}.png`, image)
            }
        } catch (e) {
            console.warn('Unable to read WarsawStockExchange data', { name: stock.name, error: e.message })
        }
    }
}

async function tweetAll() {
    const bullishEngulfingTweet = await tweet(bullishEngulfing, 'OBJĘCIE HOSSY 📈')
    const bearishEngulfingTweet = await tweet(bearishEngulfing, 'OBJĘCIE BESSY 📉')
    const bullishGapTweet = await tweet(bullishGap, 'LUKA HOSSY 📈')
    const bearishGapTweet = await tweet(bearishGap, 'LUKA BESSY 📉')
    const morningStarTweet = await tweet(morningStar, 'GWIAZDA PORANNA 📈')
    const shootingStarTweet = await tweet(shootingStar, 'SPADAJĄCA GWIAZDA 📉')
    const bullishSmashTweet = await tweet(bullishSmash, 'FORMACJA SMASH KUPNA 📈')
    const bearishSmashTweet = await tweet(bearishSmash, 'FORMACJA SMASH SPRZEDAŻY 📉')

    let tweets = []
    if(bullishEngulfingTweet) tweets.push(bullishEngulfingTweet)
    if(bearishEngulfingTweet) tweets.push(bearishEngulfingTweet)
    if(bullishGapTweet) tweets.push(bullishGapTweet)
    if(bearishGapTweet) tweets.push(bearishGapTweet)
    if(morningStarTweet) tweets.push(morningStarTweet)
    if(shootingStarTweet) tweets.push(shootingStarTweet)
    if(bullishSmashTweet) tweets.push(bullishSmashTweet)
    if(bearishSmashTweet) tweets.push(bearishSmashTweet)

    if(tweets.length !== 0)
        twitterApiRW.v2.tweetThread(tweets)
}

async function tweet(stockNames: string[], description: string) {
    if (stockNames.length === 0)
        return

    const text = `#GPWTweets ${'weekly' in args ? '#Weekly' : '#Daily'} - ${description}\n\n` +
        `${stockNames.map(name => `#${name}`).join(" ")}\n\n` +
        `https://stockaggregator.com?tickers=${stockNames.join("%20")}\n\n` +
        '👉 ❤️ 🔁 👈'

    console.log('Tweet', { text: text })

    if ('dry-run' in args) {
        console.warn('A --dry-run argument has been passed in command line, no tweets are send')
        return
    }

    const firstFourStockNames = stockNames.slice(0, 4)
    const mediaIds = await Promise.all(firstFourStockNames.map(stockName => twitterApiRW.v1.uploadMedia(`./images/${stockName}.png`)))
    return { text: text, media: { media_ids: mediaIds } }
}