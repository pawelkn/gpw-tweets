const fs = require('fs')
const talib = require('talib')

import TwitterApi from 'twitter-api-v2'
import { CronJob } from 'cron'
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

type Triggered = { bullish: { engulfing: string[], belthold: string[] }, bearish: { engulfing: string[], belthold: string[] }}

new CronJob('0 50 19 * * 1-5', volumeNotifier, null, false, 'Europe/Warsaw').start()

function volumeNotifier() {
    const wseQuotes = new WSEQuotes()
    wseQuotes.update()
        .then(() => getTriggered(wseQuotes)
            .then((triggered) => tweetAll(triggered)))
}

async function candlestick(name: string, open: number[], high: number[], low: number[], close: number[] ) {
    return await new Promise<number>((resolve, reject) => {
        talib.execute({
            name: name,
            startIdx: close.length - 1,
            endIdx: close.length - 1,
            open: open,
            high: high,
            low: low,
            close: close
        }, (err: any, result: any) => {
            err !== null ? reject(err) : resolve(result.result.outInteger[0])
        })
    })
}

async function getTriggered(wseQuotes: WSEQuotes) {
    let triggered: Triggered = { bullish: { engulfing: [], belthold: [] }, bearish: {engulfing: [], belthold: [] }}

    const zeroPad = (num: number, places=2) => String(num).padStart(places, '0')
    const today = `${new Date().getFullYear()}${zeroPad(new Date().getMonth() + 1)}${zeroPad(new Date().getDate())}`

    for (const stock of polishStocks) {
        try {
            const hist = await wseQuotes.getHistorical(stock.name)
            if (hist.length > 2) {
                const last = hist[hist.length - 1]
                if (today !== last.date) {
                    console.warn('Date of last entry differs with a current date. Skipping', { name: stock.name, date: last.date, current: today })
                    continue
                }

                const lastAvg = (last.open + last.high + last.low + last.close) / 4
                const lastTurnover = lastAvg * last.volume

                if ((last.volume / hist[hist.length - 2].volume > volumeRise) &&
                    (lastTurnover > minTurnover) &&
                    (last.close > minPrice)
                ) {
                    const open = hist.map(d => d.open)
                    const high = hist.map(d => d.high)
                    const low = hist.map(d => d.low)
                    const close = hist.map(d => d.close)

                    const engulfing = await candlestick("CDLENGULFING", open, high, low, close)
                    const belthold = await candlestick("CDLBELTHOLD", open, high, low, close)

                    if (engulfing > 0) triggered.bullish.engulfing.push(stock.name)
                    if (belthold > 0) triggered.bullish.belthold.push(stock.name)
                    if (engulfing < 0) triggered.bearish.engulfing.push(stock.name)
                    if (belthold < 0) triggered.bearish.belthold.push(stock.name)

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

async function tweetAll(triggered: Triggered) {
    const twitterApi = new TwitterApi({ ...twitterCredentials })

    tweet(twitterApi, triggered.bullish.engulfing, 'OBJĘCIE HOSSY 📈')
    tweet(twitterApi, triggered.bullish.belthold, 'BULLISH BELT HOLD 📈')
    tweet(twitterApi, triggered.bearish.engulfing, 'OBJĘCIE BESSY 📉')
    tweet(twitterApi, triggered.bearish.belthold, 'BEARISH BELT HOLD 📉')
}

async function tweet(twitterApi: TwitterApi, stockNames: string[], description: string) {
    if (stockNames.length === 0)
        return

    const message = `Alert wolumenowy #GPW - ${description}\n\n` +
        `${stockNames.map(name => `#${name}`).join(" ")}\n\n` +
        `https://stockaggregator.com?tickers=${stockNames.join("%20")}`

    console.log('Tweet', { message: message })

    const twitterApiRW = twitterApi.readWrite
    const firstFourStockNames = stockNames.slice(0, 4)
    const mediaIds = await Promise.all(firstFourStockNames.map(stockName => twitterApiRW.v1.uploadMedia(`./images/${stockName}.png`)))
    twitterApiRW.v2.tweet(message, { media: { media_ids: mediaIds } })
}