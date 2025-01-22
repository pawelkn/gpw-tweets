import YahooFinance from 'yahoo-finance2'
import * as moment from 'moment'

import Candlestick from './candlestick'

export default class WSEQuotes {
    public async getHistorical(symbol: string, start: string | number | Date) {
        const result = await YahooFinance.chart(symbol, {period1: start})
        return result.quotes
            .filter((quote: any) => quote.open && quote.high && quote.low && quote.close && quote.volume)
            .map((quote: any) => new Candlestick({
                date: moment.utc(quote.date).format('YYYYMMDD'),
                open: quote.open,
                high: quote.high,
                low: quote.low,
                close: quote.close,
                volume: quote.volume,
            }))
    }

    public resample(data: Candlestick[], period: string = 'D') {
        switch(period) {
        case 'D':
            return data

        case 'W':
            let candlesticks: Candlestick[] = []
            let lastWeekStart: string | undefined

            for (let d of data) {
                const date = moment.utc(d.date, 'YYYYMMDD')
                const weekStart = date.startOf('isoWeek').format('YYYYMMDD')

                if (!lastWeekStart || (lastWeekStart != weekStart)) {
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

                lastWeekStart = weekStart
            }
            return candlesticks

        default:
            return []
        }
    }
}