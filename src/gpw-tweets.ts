const args = require('args-parser')(process.argv)

import * as fs from 'fs'
import * as moment from 'moment-timezone'

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

type Triggered = { name: string, turnover: number };

const bullishEngulfing: Triggered[] = []
const bearishEngulfing: Triggered[] = []
const bullishGap: Triggered[] = []
const bearishGap: Triggered[] = []
const morningStar: Triggered[] = []
const shootingStar: Triggered[] = []
const bearishSmash: Triggered[] = []
const bullishSmash: Triggered[] = []
const piercing: Triggered[] = []
const darkCloudCover: Triggered[] = []

async function scan() {
    const weekStartOf = (date: string) => moment.utc(date, 'YYYYMMDD').startOf('isoWeek').format('YYYYMMDD')
    const today = moment.utc().format('YYYYMMDD')
    const weekStart = weekStartOf(today)

    const wseQuotes = new WSEQuotes()
    await wseQuotes.update()

    let success = false
    for (const stock of polishStocks) {
        try {
            let hist = await wseQuotes.getHistorical(stock.name)
            if (hist.length < 2)
                continue

            const last = hist[hist.length - 1]
            const priceChange = (last.close / hist[hist.length - 2].close - 1) * 100

            if (!('no-date-check' in args) && ('weekly' in args ? weekStart !== weekStartOf(last.date) : today !== last.date)) {
                console.warn('Day/Week of last candlestick differs with a current one. Skipping', { name: stock.name, last: last.date, current: today })
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

            if ((current.volume / previous.volume < +volumeRise) || (+currentTurnover < +minTurnover) || (current.close < +minPrice))
                continue

            let triggered = false
            if (current.isBullishEngulfing(previous)) { bullishEngulfing.push({ name: stock.name, turnover: currentTurnover }); triggered = true }
            if (current.isBearishEngulfing(previous)) { bearishEngulfing.push({ name: stock.name, turnover: currentTurnover }); triggered = true }
            if (current.isBullishGap(previous)) { bullishGap.push({ name: stock.name, turnover: currentTurnover }); triggered = true }
            if (current.isBearishGap(previous)) { bearishGap.push({ name: stock.name, turnover: currentTurnover }); triggered = true }
            if (current.isMorningStar(previous)) { morningStar.push({ name: stock.name, turnover: currentTurnover }); triggered = true }
            if (current.isShootingStar(previous)) { shootingStar.push({ name: stock.name, turnover: currentTurnover }); triggered = true }
            if (current.isBullishSmash(previous)) { bullishSmash.push({ name: stock.name, turnover: currentTurnover }); triggered = true }
            if (current.isBearishSmash(previous)) { bearishSmash.push({ name: stock.name, turnover: currentTurnover }); triggered = true }
            if (current.isPiercing(previous)) { piercing.push({ name: stock.name, turnover: currentTurnover }); triggered = true }
            if (current.isDarkCloudCover(previous)) { darkCloudCover.push({ name: stock.name, turnover: currentTurnover }); triggered = true }

            if (!triggered)
                continue

            const description = stock.name
            const data = hist.slice(-110)
            const date = moment.tz(last.date, 'YYYYMMDD', 'Europe/Warsaw').set('hour', 17).format('YYYY-MM-DD HH:mm:ss z')
            const price = last.close
            const grid = 'weekly' in args ? 'year': 'month'
            const interval = 'weekly' in args ? '1 week' : '1 day'

            const image = stockChart(description, data, date, price, priceChange, grid, interval)
            if (image) {
                fs.mkdirSync('./images/', { recursive: true })
                fs.writeFileSync(`./images/${stock.name}.png`, image)
            }

            success = true
        } catch (e) {
            console.warn('Unable to read WarsawStockExchange data', { name: stock.name, error: e.message })
        }
    }

    return success
}

async function tweetAll() {
    const bullishEngulfingTweet = await tweet(bullishEngulfing, 'Bullish Engulfing 📈')
    const bearishEngulfingTweet = await tweet(bearishEngulfing, 'Bearish Engulfing 📉')
    const bullishGapTweet = await tweet(bullishGap, 'Bullish Gap 📈')
    const bearishGapTweet = await tweet(bearishGap, 'Bearish Gap 📉')
    const morningStarTweet = await tweet(morningStar, 'Morning Star 📈')
    const shootingStarTweet = await tweet(shootingStar, 'Shooting Star 📉')
    const bullishSmashTweet = await tweet(bullishSmash, 'Bullish Smash 📈')
    const bearishSmashTweet = await tweet(bearishSmash, 'Bearish Smash 📉')
    const piercingTweet = await tweet(piercing, 'Piercing Pattern 📈')
    const darkCloudCoverTweet = await tweet(darkCloudCover, 'Dark Cloud Cover 📉')

    let tweets = []
    if(bullishEngulfingTweet) tweets.push(bullishEngulfingTweet)
    if(bearishEngulfingTweet) tweets.push(bearishEngulfingTweet)
    if(bullishGapTweet) tweets.push(bullishGapTweet)
    if(bearishGapTweet) tweets.push(bearishGapTweet)
    if(morningStarTweet) tweets.push(morningStarTweet)
    if(shootingStarTweet) tweets.push(shootingStarTweet)
    if(bullishSmashTweet) tweets.push(bullishSmashTweet)
    if(bearishSmashTweet) tweets.push(bearishSmashTweet)
    if(piercingTweet) tweets.push(piercingTweet)
    if(darkCloudCoverTweet) tweets.push(darkCloudCoverTweet)

    if(tweets.length !== 0)
        twitterApiRW.v2.tweetThread(tweets)
}

async function tweet(triggered: Triggered[], description: string) {
    if (triggered.length === 0)
        return

    triggered.sort((a, b) => b.turnover - a.turnover)

    let text: string
    while (true) {
        text = `#GPWTweets ${'weekly' in args ? '#Weekly' : '#Daily'} - ${description}\n\n` +
            triggered.map(t => t.name).join(" ") +
            `\n\n👉 ❤️ 🔁 👈`

        if (text.length > 160)
            triggered.pop()
        else
            break
    }

    console.log('Tweet', { text: text })

    if ('dry-run' in args) {
        console.warn('A --dry-run argument has been passed in command line, no tweets are send')
        return
    }

    const firstFour = triggered.slice(0, 4)
    const mediaIds = await Promise.all(firstFour.map(t => twitterApiRW.v1.uploadMedia(`./images/${t.name}.png`)))
    return { text: text, media: { media_ids: mediaIds } }
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    let scanExecutions = 0
    while (!await scan()) {
        if (scanExecutions++ > 8) {
            console.warn('Scan failed. Give up')
            return
        }

        console.warn('Scan failed. Postpone')
        await sleep(30*60*1000)
    }

    await tweetAll()
}

main()
