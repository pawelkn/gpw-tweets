'use strict'

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

const volume_threshold = process.env.VOLUME_NOTIFIER_VOLUME_THRESHOLD || 2.0
const min_turnover = process.env.VOLUME_NOTIFIER_MIN_TURNOVER || 50_000
const min_price = process.env.VOLUME_NOTIFIER_MIN_PRICE || 2.0

const wseQuotes = new WSEQuotes()
wseQuotes.update()
    .then(() => getTriggered()
        .then((triggered) => sendMail(triggered)))

async function getTriggered() {
    let triggered: string[] = []
    for (const stock of polishStocks) {
        try {
            const hist = await wseQuotes.getHistoricalPrices(stock.name)
            if (hist.length > 2) {
                const last = hist[hist.length - 1]
                const last_avg = (last.open + last.high + last.low + last.close) / 4
                const last_turnover = last_avg * last.volume

                if ((last.volume / hist[hist.length - 2].volume > volume_threshold) &&
                    (last_turnover > min_turnover) &&
                    (last.close > min_price)
                ) {
                    triggered.push(stock.name)
                }
            }
        } catch (e) {
            console.warn('Unable to read WarsawStockExchange data', { name: stock.name, error: e })
        }
    }

    console.log('Triggered', triggered)
    return triggered
}

async function sendMail(triggered: string[]) {
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
        to: mailingList.join(", "),
        subject: 'Volume notification',
        html: `Parameters:
            <ul>
                <li>volume threshold: ${volume_threshold}</li>
                <li>min turnover: ${min_turnover}</li>
                <li>min price: ${min_price}</li>
            </ul>
            <a href='https://stockaggregator.com?tickers=${triggered.join("%20")}'>${triggered.join(" ")}</a>
        `
    })

    console.log("Message sent: %s", info.messageId)
}