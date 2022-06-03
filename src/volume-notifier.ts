import * as fs from 'fs'
import * as nodemailer from 'nodemailer'
import WSEQuotes from './wse-quotes'

type PolishStocks = { symbol: string, ISIN: string, name: string, quotationTable: string }[]
type SmtpConfig = { sender: string, host: string, port: number, login: string, password: string }
type MailingList = string[]

const polishStocksFile = 'polish-stocks.json'
const smtpConfigFile = process.env.VOLUME_NOTIFIER_SMTP_CONFIG_FILE || 'data/smtp-config.json'
const mailingListFile = process.env.VOLUME_NOTIFIER_MAILING_LIST_FILE || 'data/mailing-list.json'

const polishStocks: PolishStocks = JSON.parse(fs.readFileSync(polishStocksFile, { encoding: 'utf8', flag: 'r' }))
const smtpConfig: SmtpConfig = JSON.parse(fs.readFileSync(smtpConfigFile, { encoding: 'utf8', flag: 'r' }))
const mailingList: MailingList = JSON.parse(fs.readFileSync(mailingListFile, { encoding: 'utf8', flag: 'r' }))

const volumeRise = process.env.VOLUME_NOTIFIER_VOLUME_RISE || 2.0
const minTurnover = process.env.VOLUME_NOTIFIER_MIN_TURNOVER || 50_000
const minPrice = process.env.VOLUME_NOTIFIER_MIN_PRICE || 2.0

type Triggered = { white: string[], black: string[], doji: string[] }
let triggered: Triggered = { white: [], black: [], doji: [] }

const wseQuotes = new WSEQuotes()
wseQuotes.update()
    .then(() => getTriggered()
        .then(() => sendMail()))

async function getTriggered() {
    const zeroPad = (num: number, places=2) => String(num).padStart(places, '0')
    const today = `${new Date().getFullYear()}${zeroPad(new Date().getMonth() + 1)}${zeroPad(new Date().getDate())}`

    for (const stock of polishStocks) {
        try {
            const hist = await wseQuotes.getHistoricalPrices(stock.name)
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
                    if (last.close == last.open)
                        triggered.doji.push(stock.name)
                    else if (last.close > last.open)
                        triggered.white.push(stock.name)
                    else
                        triggered.black.push(stock.name)
                }
            }
        } catch (e) {
            console.warn('Unable to read WarsawStockExchange data', { name: stock.name, error: e.message })
        }
    }

    for (const candle in triggered)
        console.log('Triggered', candle, triggered[candle as keyof Triggered])
}

async function sendMail() {
    const transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: (smtpConfig.port === 465),
        auth: {
            user: smtpConfig.login,
            pass: smtpConfig.password,
        }
    })

    const info = await transporter.sendMail({
        from: `AutoSender <${smtpConfig.sender}>`,
        to: mailingList.join(', '),
        subject: 'Volume notification',
        html: getHtmlMessage()
    })

    console.log('Message sent: %s', info.messageId)
}

function getHtmlMessage() {
    let html = `Parameters:
        <ul>
            <li>volume rise: x${volumeRise}</li>
            <li>min turnover: ${minTurnover}</li>
            <li>min price: ${minPrice}</li>
        </ul>
    `

    for (const candle in triggered) {
        const stockNames = triggered[candle as keyof Triggered]

        html += `<p>Triggered ${candle}: `
        html += stockNames.length === 0 ? 'nothing' : `<a href='https://stockaggregator.com?tickers=${stockNames.join("%20")}'>${stockNames.join(" ")}</a>`
        html += '</p>'
    }

    return html
}