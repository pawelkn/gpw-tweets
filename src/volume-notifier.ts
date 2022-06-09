const fs = require('fs')
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

type Triggered = { bullishEngulfing: string[] , bearishEngulfing: string[], bullishKicker: string[], bearishKicker: string[], shootingStar: string[], morningStar: string[] }
let triggered: Triggered = { bullishEngulfing: [] , bearishEngulfing: [], bullishKicker: [], bearishKicker: [], shootingStar: [], morningStar: [] }

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
                    if (current.isBullishKicker(previous)) triggered.bullishKicker.push(stock.name)
                    if (current.isBearishKicker(previous)) triggered.bearishKicker.push(stock.name)
                    if (current.isShootingStar(previous)) triggered.shootingStar.push(stock.name)
                    if (current.isMorningStar(previous)) triggered.morningStar.push(stock.name)

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
    tweet(triggered.shootingStar, 'SPADAJĄCA GWIAZDA 📉')
    tweet(triggered.bearishKicker, 'KOPNIĘCIE W DÓŁ 📉')
    tweet(triggered.bearishEngulfing, 'OBJĘCIE BESSY 📉')
    tweet(triggered.morningStar, 'GWIAZDA PORANNA 📈')
    tweet(triggered.bullishKicker, 'KOPNIĘCIE W GÓRĘ 📈')
    tweet(triggered.bullishEngulfing, 'OBJĘCIE HOSSY 📈')
}

async function tweet(stockNames: string[], description: string) {
    if (stockNames.length === 0)
        return

    const message = `#AlertyGiełdowe - ${description}\n\n` +
        `${stockNames.map(name => `#${name}`).join(" ")}\n\n` +
        `https://stockaggregator.com?tickers=${stockNames.join("%20")}\n\n` +
        'Podziel się: ❤️ lub 🔁'

    console.log('Tweet', { message: message })

    if ('dry-run' in args) {
        console.warn('A --dry-run argument has been passed in command line, no tweets are send')
        return
    }

    const firstFourStockNames = stockNames.slice(0, 4)
    const mediaIds = await Promise.all(firstFourStockNames.map(stockName => twitterApiRW.v1.uploadMedia(`./images/${stockName}.png`)))
    twitterApiRW.v2.tweet(message, { media: { media_ids: mediaIds } })
}