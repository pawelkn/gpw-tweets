import * as assert from 'assert'
import WseQuotes from '../src/wse-quotes'

describe('wse-quotes', () => {
    describe('#getHistorical()', () => {
        it('should return valid candlesticks for given name', async () => {
            const wseQuotes = new WseQuotes()
            const data = await wseQuotes.getHistorical('11B.WA', '2022-06-01')
            assert.ok(data.length > 0)

            const day = data.find((d => d.date === '20220606'))
            assert.ok(day !== undefined)

            assert.equal(day.open.toFixed(1), '520.0')
            assert.equal(day.high.toFixed(1), '531.0')
            assert.equal(day.low.toFixed(1), '510.0')
            assert.equal(day.close.toFixed(1), '518.0')
            assert.equal(day.volume, 1885)
        })
    })

    describe('#resample()', () => {
        it('should resample candlesticks', async () => {
            const wseQuotes = new WseQuotes()
            let data = await wseQuotes.getHistorical('11B.WA', '2014-12-01')
            data = wseQuotes.resample(data, 'W')
            assert.ok(data.length > 0)

            let week = data.find((d => d.date === '20220606'))
            assert.ok(week === undefined)

            week = data.find((d => d.date === '20220603'))
            assert.ok(week !== undefined)

            assert.equal(week.open.toFixed(1), '489.0')
            assert.equal(week.high.toFixed(1), '543.0')
            assert.equal(week.low.toFixed(1), '481.5')
            assert.equal(week.close.toFixed(1), '522.0')
            assert.equal(week.volume, 14049)

            week = data.find((d => d.date === '20171229'))
            assert.ok(week !== undefined)

            assert.equal(week.open.toFixed(1), '191.0')
            assert.equal(week.high.toFixed(1), '198.0')
            assert.equal(week.low.toFixed(1), '187.1')
            assert.equal(week.close.toFixed(1), '198.0')
            assert.equal(week.volume, 20054)

            week = data.find((d => d.date === '20150102'))
            assert.ok(week !== undefined)

            assert.equal(week.open.toFixed(2), '64.58')
            assert.equal(week.high.toFixed(2), '76.60')
            assert.equal(week.low.toFixed(2), '64.05')
            assert.equal(week.close.toFixed(2), '72.00')
            assert.equal(week.volume, 82512)
        })
    })
})