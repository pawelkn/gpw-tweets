const fs = require('fs')
const assert = require('assert')
const WseQuotes = require('../build/wse-quotes').default

const TEST_DIR = 'wse-quotes-test-mstall'

describe('WSE Quotes Test', () => {
    before(async () => {
        const wseQuotes = new WseQuotes(TEST_DIR)
        await wseQuotes.update()
    })

    it('getHistorical', async () => {
        const wseQuotes = new WseQuotes(TEST_DIR)
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

    after(() => {
        fs.rmSync(TEST_DIR, { recursive: true, force: true })
    })
})