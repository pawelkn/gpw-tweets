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
})