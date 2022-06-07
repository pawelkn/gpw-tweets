const fs = require('fs')
const cs = require('candlestick')
const args = require('args-parser')(process.argv)

import TwitterApi from 'twitter-api-v2'
import WSEQuotes from './wse-quotes'
import stockChart from './stock-chart'

const twitterCredentialsFile = process.env.VOLUME_NOTIFIER_TWITTER_CREDENTIALS_FILE || 'twitter-credentials.json'
const volumeRise = process.env.VOLUME_NOTIFIER_VOLUME_RISE || 2.0
const minTurnover = process.env.VOLUME_NOTIFIER_MIN_TURNOVER || 50_000
const minPrice = process.env.VOLUME_NOTIFIER_MIN_PRICE || 2.0

type PolishStock = { symbol: string, ISIN: string, name: string, quotationTable: string }
const polishStocks: PolishStock[] = JSON.parse(fs.readFileSync('polish-stocks.json', { encoding: 'utf8', flag: 'r' }))

type TwitterCredentials = { appKey: string, appSecret: string, accessToken: string, accessSecret: string }
const twitterCredentials: TwitterCredentials = JSON.parse(fs.readFileSync(twitterCredentialsFile, { encoding: 'utf8', flag: 'r' }))

type Triggered = { bullish: { engulfing: string[], kicker: string[] }, bearish: { engulfing: string[], kicker: string[] }}
let triggered: Triggered = { bullish: { engulfing: [], kicker: [] }, bearish: {engulfing: [], kicker: [] }}

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

                if ((current.volume / previous.volume > volumeRise) &&
                    (currentTurnover > minTurnover) &&
                    (current.close > minPrice)
                ) {
                    const open = hist.map(d => d.open)
                    const high = hist.map(d => d.high)
                    const low = hist.map(d => d.low)
                    const close = hist.map(d => d.close)

                    if (cs.isBullishEngulfing(previous, current)) triggered.bullish.engulfing.push(stock.name)
                    if (cs.isBullishKicker(previous, current)) triggered.bullish.kicker.push(stock.name)
                    if (cs.isBearishEngulfing(previous, current)) triggered.bearish.engulfing.push(stock.name)
                    if (cs.isBearishKicker(previous, current)) triggered.bearish.kicker.push(stock.name)

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
    tweet(twitterApi, triggered.bullish.engulfing, 'OBJĘCIE HOSSY 📈')
    tweet(twitterApi, triggered.bullish.kicker, 'KOPNIĘCIE W GÓRĘ 📈')
    tweet(twitterApi, triggered.bearish.engulfing, 'OBJĘCIE BESSY 📉')
    tweet(twitterApi, triggered.bearish.kicker, 'KOPNIĘCIE W DÓŁ 📉')
}

async function tweet(twitterApi: TwitterApi, stockNames: string[], description: string) {
    if (stockNames.length === 0)
        return

    const message = `Alert wolumenowy #GPW - ${description}\n\n` +
        `${stockNames.map(name => `#${name}`).join(" ")}\n\n` +
        `https://stockaggregator.com?tickers=${stockNames.join("%20")}`

    console.log('Tweet', { message: message })

    if ('dry-run' in args) {
        console.warn('A --dry-run argument has been passed in command line, no twits are send')
        return
    }

    const firstFourStockNames = stockNames.slice(0, 4)
    const mediaIds = await Promise.all(firstFourStockNames.map(stockName => twitterApiRW.v1.uploadMedia(`./images/${stockName}.png`)))
    twitterApiRW.v2.tweet(message, { media: { media_ids: mediaIds } })
}