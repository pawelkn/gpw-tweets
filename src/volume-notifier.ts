import * as fs from 'fs'
import { abs, max, min } from 'mathjs'
import TwitterApi from 'twitter-api-v2'
import WSEQuotes, { Candlestick } from './wse-quotes'

const twitterCredentialsFile = process.env.VOLUME_NOTIFIER_TWITTER_CREDENTIALS_FILE || 'twitter-credentials.json'
const volumeRise = process.env.VOLUME_NOTIFIER_VOLUME_RISE || 2.0
const minTurnover = process.env.VOLUME_NOTIFIER_MIN_TURNOVER || 50_000
const minPrice = process.env.VOLUME_NOTIFIER_MIN_PRICE || 2.0

type PolishStock = { symbol: string, ISIN: string, name: string, quotationTable: string }
const polishStocks: PolishStock[] = JSON.parse(fs.readFileSync('polish-stocks.json', { encoding: 'utf8', flag: 'r' }))

type TwitterCredentials = { appKey: string, appSecret: string, accessToken: string, accessSecret: string }
const twitterCredentials: TwitterCredentials = JSON.parse(fs.readFileSync(twitterCredentialsFile, { encoding: 'utf8', flag: 'r' }))

type Triggered = { hammer: string[], shootingStar: string[], doji: string[], white: string[], black: string[] }
let triggered: Triggered = { hammer: [], shootingStar: [], doji: [], white: [], black: [] }

const isHammer = (c: Candlestick) => (max(c.close, c.open) === c.high) && (abs(c.close - c.open) * 2 < (c.high - c.low))
const isShootingStar = (c: Candlestick) => (min(c.close, c.open) === c.low) && (abs(c.close - c.open) * 2 < (c.high - c.low))
const isDoji = (c: Candlestick) => (c.close === c.open) && (c.high > c.open) && (c.low < c.open)
const isWhite = (c : Candlestick) => (c.close > c.open)
const isBlack = (c : Candlestick) => (c.close < c.open)

const twitterApi = new TwitterApi({ ...twitterCredentials })
const rwTwitterApi = twitterApi.readWrite

const wseQuotes = new WSEQuotes()
wseQuotes.update()
    .then(() => getTriggered()
        .then(() => send()))

async function getTriggered() {
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
                    if (isHammer(last)) triggered.hammer.push(stock.name)
                    else if (isShootingStar(last)) triggered.shootingStar.push(stock.name)
                    else if (isDoji(last)) triggered.doji.push(stock.name)
                    else if (isWhite(last)) triggered.white.push(stock.name)
                    else if (isBlack(last)) triggered.black.push(stock.name)
                }
            }
        } catch (e) {
            console.warn('Unable to read WarsawStockExchange data', { name: stock.name, error: e.message })
        }
    }
}

async function send() {
    if (triggered.hammer.length !== 0) tweet(triggered.hammer, 'młot')
    if (triggered.shootingStar.length !== 0) tweet(triggered.shootingStar, 'spadająca gwiazda')
    if (triggered.doji.length !== 0) tweet(triggered.doji, 'doji')
    if (triggered.white.length !== 0) tweet(triggered.white, 'biała świeca')
    if (triggered.black.length !== 0) tweet(triggered.black, 'czarna świeca')
}

async function tweet(stockNames: string[], candlesickDescription: string) {
    const message = `Alert wolumenowy - ${candlesickDescription}\n` +
        '\n' +
        `${stockNames.join(" ")}\n` +
        '\n' +
        `https://stockaggregator.com?tickers=${stockNames.join("%20")}`

    console.log('Tweet', { message: message })
    rwTwitterApi.v2.tweet(message)
}