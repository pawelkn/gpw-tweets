import * as assert from 'assert'
import WseQuotes from '../src/wse-quotes'

describe('wse-quotes', () => {
    describe('#getHistorical()', () => {
        it('should return valid candlesticks for given name', async () => {
            const wseQuotes = new WseQuotes('./test')
            const data = await wseQuotes.getHistorical('11BIT')
            assert.ok(data.length > 0)

            const day = data.find((d => d.date === '20220606'))
            assert.ok(day !== undefined)

            assert.equal(day.open, 520.0)
            assert.equal(day.high, 531.0)
            assert.equal(day.low, 510.0)
            assert.equal(day.close, 518.0)
            assert.equal(day.volume, 1885)
        })
    })

    describe('#resample()', () => {
        it('should resample candlesticks', async () => {
            const wseQuotes = new WseQuotes('./test')
            let data = await wseQuotes.getHistorical('11BIT')
            data = wseQuotes.resample(data, 'W')
            assert.ok(data.length > 0)

            let week = data.find((d => d.date === '20220606'))
            assert.ok(week !== undefined)

            assert.equal(week.open, 520.0)
            assert.equal(week.high, 531.0)
            assert.equal(week.low, 510.0)
            assert.equal(week.close, 518.0)
            assert.equal(week.volume, 1885)

            week = data.find((d => d.date === '20220603'))
            assert.ok(week !== undefined)

            assert.equal(week.open, 489.0)
            assert.equal(week.high, 543.0)
            assert.equal(week.low, 481.5)
            assert.equal(week.close, 522.0)
            assert.equal(week.volume, 14049)

            week = data.find((d => d.date === '20171229'))
            assert.ok(week !== undefined)

            assert.equal(week.open, 191.0)
            assert.equal(week.high, 198.0)
            assert.equal(week.low, 187.1)
            assert.equal(week.close, 198)
            assert.equal(week.volume, 20054)

            week = data.find((d => d.date === '20150102'))
            assert.ok(week !== undefined)

            assert.equal(week.open, 64.58)
            assert.equal(week.high, 76.60)
            assert.equal(week.low, 64.05)
            assert.equal(week.close, 72.00)
            assert.equal(week.volume, 82512)
        })
    })
})