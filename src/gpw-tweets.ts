const fs = require('fs')
const args = require('args-parser')(process.argv)

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

type Triggered = { bullishEngulfing: string[] , bearishEngulfing: string[], bullishGap: string[], bearishGap: string[], morningStar: string[], shootingStar: string[], bearishSmash: string[], bullishSmash: string[] }
let triggered: Triggered = { bullishEngulfing: [] , bearishEngulfing: [], bullishGap: [], bearishGap: [], morningStar: [], shootingStar: [], bearishSmash: [], bullishSmash: [] }

const twitterApi = new TwitterApi({ ...twitterCredentials })
const twitterApiRW = twitterApi.readWrite

const wseQuotes = new WSEQuotes()
wseQuotes.update()
    .then(() => getTriggered()
        .then(() => tweetAll()))

async function getTriggered() {
    const zeroPad = (num: number, places=2) => String(num).padStart(places, '0')
    const today = `${new Date().getFullYear()}${zeroPad(new Date().getMonth() + 1)}${zeroPad(new Date().getDate())}`

    for (const stock of polishStocks) {
        try {
            const hist = await wseQuotes.getHistorical(stock.name)
            if (hist.length > 2) {
                const current = hist[hist.length - 1]
                const previous = hist[hist.length - 2]

                if ((!('no-date-check' in args )) && (today !== current.date)) {
                    console.warn('Date of last entry differs with a current date. Skipping', { name: stock.name, date: current.date, current: today })
                    console.info('If you want to ignore this check, pass a --no-date-check argument in command line')
                    continue
                }

                const currentAvg = (current.open + current.high + current.low + current.close) / 4
                const currentTurnover = currentAvg * current.volume

                if ((current.volume / previous.volume > volumeRise) && (currentTurnover > minTurnover) && (current.close > minPrice)) {
                    if (current.isBullishEngulfing(previous)) triggered.bullishEngulfing.push(stock.name)
                    if (current.isBearishEngulfing(previous)) triggered.bearishEngulfing.push(stock.name)
                    if (current.isBullishGap(previous)) triggered.bullishGap.push(stock.name)
                    if (current.isBearishGap(previous)) triggered.bearishGap.push(stock.name)
                    if (current.isMorningStar(previous)) triggered.morningStar.push(stock.name)
                    if (current.isShootingStar(previous)) triggered.shootingStar.push(stock.name)
                    if (current.isBullishSmash(previous)) triggered.bullishSmash.push(stock.name)
                    if (current.isBearishSmash(previous)) triggered.bearishSmash.push(stock.name)

                    const image = stockChart(stock.name, hist.slice(-60))
                    if (image)
                        fs.writeFileSync(`./images/${stock.name}.png`, image);
                }
            }
        } catch (e) {
            console.warn('Unable to read WarsawStockExchange data', { name: stock.name, error: e.message })
        }
    }

    return triggered
}

async function tweetAll() {
    const bullishEngulfingTweet = await tweet(triggered.bullishEngulfing, 'OBJĘCIE HOSSY 📈')
    const bearishEngulfingTweet = await tweet(triggered.bearishEngulfing, 'OBJĘCIE BESSY 📉')
    const bullishGapTweet = await tweet(triggered.bullishGap, 'LUKA HOSSY 📈')
    const bearishGapTweet = await tweet(triggered.bearishGap, 'LUKA BESSY 📉')
    const morningStarTweet = await tweet(triggered.morningStar, 'GWIAZDA PORANNA 📈')
    const shootingStarTweet = await tweet(triggered.shootingStar, 'SPADAJĄCA GWIAZDA 📉')
    const bullishSmashTweet = await tweet(triggered.bullishSmash, 'FORMACJA SMASH KUPNA 📈')
    const bearishSmashTweet = await tweet(triggered.bearishSmash, 'FORMACJA SMASH SPRZEDAŻY 📉')

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

    const text = `#AlertyGiełdowe z #GPW - ${description}\n\n` +
        `${stockNames.map(name => `#${name}`).join(" ")}\n\n` +
        `https://stockaggregator.com?tickers=${stockNames.join("%20")}\n\n` +
        'Podziel się: ❤️ lub 🔁'

    console.log('Tweet', { text: text })

    if ('dry-run' in args) {
        console.warn('A --dry-run argument has been passed in command line, no tweets are send')
        return
    }

    const firstFourStockNames = stockNames.slice(0, 4)
    const mediaIds = await Promise.all(firstFourStockNames.map(stockName => twitterApiRW.v1.uploadMedia(`./images/${stockName}.png`)))
    return { text: text, media: { media_ids: mediaIds } }
}