import * as fs from 'fs'
import * as https from 'https'
import * as unzipper from 'unzipper'
import * as path from 'path'

const etl = require('etl')

export type Candlestick = { date: string, open: number, high: number, low: number, close: number, volume: number }

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

    public getHistorical(ticker: string, parseDates: boolean = false) {
        return new Promise<Candlestick[]>((resolve, reject) => {
            const filename = path.join(this.path, ticker + '.mst')
            fs.access(filename, fs.constants.F_OK, (err) => {
                if (err)
                    return reject(new Error(`Data file ${filename} does not exist`))

                let prices: Candlestick[] = []
                fs.createReadStream(filename)
                    .pipe(etl.csv())
                    .pipe(etl.map((data: any) => {
                        prices.push({
                            date: data['<DTYYYYMMDD>'],
                            open: parseFloat(data['<OPEN>']),
                            high: parseFloat(data['<HIGH>']),
                            low: parseFloat(data['<LOW>']),
                            close: parseFloat(data['<CLOSE>']),
                            volume: parseFloat(data['<VOL>'])
                        })
                    }))
                    .promise()
                    .then(() => resolve(prices), () => reject(new Error(`Failed to parse data file ${filename}`)))
            })
        })
    }
}