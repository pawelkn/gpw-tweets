import * as fs from 'fs'
import * as https from 'https'
import * as unzipper from 'unzipper'
import * as path from 'path'

const etl = require('etl')

import Candlestick from './candlestick'

export default class WSEQuotes {
    private path: string

    constructor(path: string ='mstall') {
        this.path = path
    }

    public update(url: string = 'https://info.bossa.pl/pub/metastock/mstock/mstall.zip') {
        return new Promise<void>((resolve, reject) => {
            https.get(url, (res) => {
                if (res.statusCode !== 200)
                    return reject(new Error(`Failed to download data form ${url}`))

                res.pipe(unzipper.Extract({ path: this.path }))
                    .promise()
                    .then(() => resolve(), () => reject(new Error(`Failed to extract data from ${url}`)))
            })
        })
    }

    public getHistorical(name: string) {
        return new Promise<Candlestick[]>((resolve, reject) => {
            const filename = path.join(this.path, name + '.mst')
            fs.access(filename, fs.constants.F_OK, (err) => {
                if (err)
                    return reject(new Error(`Data file ${filename} does not exist`))

                let prices: Candlestick[] = []
                fs.createReadStream(filename)
                    .pipe(etl.csv())
                    .pipe(etl.map((data: any) => {
                        prices.push(new Candlestick({
                            date: data['<DTYYYYMMDD>'],
                            open: parseFloat(data['<OPEN>']),
                            high: parseFloat(data['<HIGH>']),
                            low: parseFloat(data['<LOW>']),
                            close: parseFloat(data['<CLOSE>']),
                            volume: parseFloat(data['<VOL>'])
                        }))
                    }))
                    .promise()
                    .then(() => resolve(prices), () => reject(new Error(`Failed to parse data file ${filename}`)))
            })
        })
    }

    public resample(data: Candlestick[], period: string = 'D') {
        switch(period) {
        case 'D':
            return data

        case 'W':
            let candlesticks: Candlestick[] = []
            let lastYear: number = NaN
            let lastWeek: number = NaN

            for (const d of data) {
                const day = new Date(Date.UTC(+d.date.substring(0, 4), +d.date.substring(4, 6) - 1, +d.date.substring(6, 8)))
                const yearStart = new Date(Date.UTC(day.getUTCFullYear(), 0, 1))
                const week = Math.ceil((((day.getTime() - yearStart.getTime()) / 86400000) + yearStart.getDay() + 1) / 7)

                if ((lastWeek !== week) && (isNaN(lastYear) || isNaN(lastWeek) || (yearStart.getDay() === 1) || (lastYear === day.getUTCFullYear()))) {
                    candlesticks.push(d)
                }
                else {
                    const last = candlesticks[candlesticks.length - 1]
                    if (last.low > d.low) last.low = d.low
                    if (last.high < d.high) last.high = d.high
                    last.date = d.date
                    last.close = d.close
                    last.volume += d.volume
                }

                lastYear = day.getUTCFullYear()
                lastWeek = week
            }
            return candlesticks

        default:
            return []
        }
    }
}