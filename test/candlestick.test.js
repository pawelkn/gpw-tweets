const assert = require('assert')
const Candlestick = require('../build/candlestick').default

describe('candlestick', () => {
    describe('#isBullishKicker()', () => {
        it('should return false when previous candle is not bearish', () => {
            const prev = new Candlestick({ open: 1, close: 2 })
            const curr = new Candlestick({ open: 3, close: 4 })
            assert.equal(false, curr.isBullishKicker(prev))
        })

        it('should return false when current candle is not bullish', () => {
            const prev = new Candlestick({ open: 2, close: 1 })
            const curr = new Candlestick({ open: 4, close: 3 })
            assert.equal(false, curr.isBullishKicker(prev))
        })

        it('should return false when no gap between candles', () => {
            const prev = new Candlestick({ open: 2, close: 1 })
            const curr = new Candlestick({ open: 2, close: 3 })
            assert.equal(false, curr.isBullishKicker(prev))
        })

        it(`should return true when candles are bear, bull and gap in-between`, () => {
            const prev = new Candlestick({ open: 2, close: 1 })
            const curr = new Candlestick({ open: 3, close: 4 })
            assert.equal(true, curr.isBullishKicker(prev))
        })
    })

    describe('#isBearishKicker()', () => {
        it('should return false when previous candle is not bullish', () => {
            const prev = new Candlestick({ open: 4, close: 3 })
            const curr = new Candlestick({ open: 2, close: 1 })
            assert.equal(false, curr.isBearishKicker(prev))
        })

        it('should return false when current candle is not bearish', () => {
            const prev = new Candlestick({ open: 3, close: 4 })
            const curr = new Candlestick({ open: 1, close: 2 })
            assert.equal(false, curr.isBearishKicker(prev))
        })

        it('should return false when no gap between candles', () => {
            const prev = new Candlestick({ open: 3, close: 4 })
            const curr = new Candlestick({ open: 3, close: 2 })
            assert.equal(false, curr.isBearishKicker(prev))
        })

        it(`should return true when a bullish candle is followed by a bearish candle with down gap between`, () => {
            const prev = new Candlestick({ open: 3, close: 4 })
            const curr = new Candlestick({ open: 2, close: 1 })
            assert.equal(true, curr.isBearishKicker(prev))
        })
    })

    describe('#isShootingStar()', () => {
        it('should return false when previous candle is not bullish', () => {
            const prev = new Candlestick({ open: 2, high: 10, low: 0.5, close: 1 })
            const curr = new Candlestick({ open: 4, high: 20, low: 2.9, close: 3 })
            assert.equal(false, curr.isShootingStar(prev))
        })

        it('should return false when current candle is not bearish', () => {
            const prev = new Candlestick({ open: 1, high: 10, low: 0.5, close: 2 })
            const curr = new Candlestick({ open: 3, high: 20, low: 2.9, close: 4 })
            assert.equal(false, curr.isShootingStar(prev))
        })

        it('should return false when no gap between candles', () => {
            const prev = new Candlestick({ open: 1, high: 10, low: 0.5, close: 2 })
            const curr = new Candlestick({ open: 3, high: 30, low: 1.4, close: 1.5 })
            assert.equal(false, curr.isShootingStar(prev))
        })

        it(`should return true when candles are bull, bear, gap in-between, long high and short low`, () => {
            const prev = new Candlestick({ open: 1, high: 10, low: 0.5, close: 2 })
            const curr = new Candlestick({ open: 4, high: 20, low: 2.9, close: 3 })
            assert.equal(true, curr.isShootingStar(prev))
        })
    })

    describe('#isMorningStar()', () => {
        it('should return false when previous candle is not bearish', () => {
            const prev = new Candlestick({ open: 5, high: 7, low: 4.5, close: 6 })
            const curr = new Candlestick({ open: 3, high: 4, low: 0.5, close: 4 })
            assert.equal(false, curr.isMorningStar(prev))
        })

        it('should return false when current candle is not bullish', () => {
            const prev = new Candlestick({ open: 6, high: 7, low: 4.5, close: 5 })
            const curr = new Candlestick({ open: 4, high: 4, low: 0.5, close: 3 })
            assert.equal(false, curr.isMorningStar(prev))
        })

        it('should return false when no gap between candles', () => {
            const prev = new Candlestick({ open: 6, high: 7, low: 4.5, close: 5 })
            const curr = new Candlestick({ open: 3, high: 4, low: 0.5, close: 5 })
            assert.equal(false, curr.isMorningStar(prev))
        })

        it(`should return true when candles are bull, bear, gap in-between, long high and short low`, () => {
            const prev = new Candlestick({ open: 6, high: 7, low: 4.5, close: 5 })
            const curr = new Candlestick({ open: 3, high: 4, low: 0.5, close: 4 })
            assert.equal(true, curr.isMorningStar(prev))
        })
    })
})