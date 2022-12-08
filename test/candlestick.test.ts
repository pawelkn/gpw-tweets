import * as assert from 'assert'
import Candlestick from '../src/candlestick'

describe('candlestick', () => {
    describe('#isBullishKicker()', () => {
        it('should return false when previous candle is not bearish', () => {
            const prev = new Candlestick({ open: 1, high: 2, low: 1, close: 2 })
            const curr = new Candlestick({ open: 3, high: 4, low: 3, close: 4 })
            assert.equal(false, curr.isBullishKicker(prev))
        })

        it('should return false when current candle is not bullish', () => {
            const prev = new Candlestick({ open: 2, high: 2, low: 1, close: 1 })
            const curr = new Candlestick({ open: 4, high: 4, low: 3, close: 3 })
            assert.equal(false, curr.isBullishKicker(prev))
        })

        it('should return false when no gap between candles', () => {
            const prev = new Candlestick({ open: 2, high: 2, low: 1, close: 1 })
            const curr = new Candlestick({ open: 2, high: 3, low: 2, close: 3 })
            assert.equal(false, curr.isBullishKicker(prev))
        })

        it(`should return true when candles are bear, bull and gap in-between`, () => {
            const prev = new Candlestick({ open: 2, high: 2, low: 1, close: 1 })
            const curr = new Candlestick({ open: 3, high: 4, low: 3, close: 4 })
            assert.equal(true, curr.isBullishKicker(prev))
        })
    })

    describe('#isBearishKicker()', () => {
        it('should return false when previous candle is not bullish', () => {
            const prev = new Candlestick({ open: 4, high: 4, low: 3, close: 3 })
            const curr = new Candlestick({ open: 2, high: 2, low: 1, close: 1 })
            assert.equal(false, curr.isBearishKicker(prev))
        })

        it('should return false when current candle is not bearish', () => {
            const prev = new Candlestick({ open: 3, high: 4, low: 3, close: 4 })
            const curr = new Candlestick({ open: 1, high: 2, low: 1, close: 2 })
            assert.equal(false, curr.isBearishKicker(prev))
        })

        it('should return false when no gap between candles', () => {
            const prev = new Candlestick({ open: 3, high: 4, low: 3, close: 4 })
            const curr = new Candlestick({ open: 3, high: 3, low: 2, close: 2 })
            assert.equal(false, curr.isBearishKicker(prev))
        })

        it(`should return true when a bullish candle is followed by a bearish candle with down gap between`, () => {
            const prev = new Candlestick({ open: 3, high: 4, low: 3, close: 4 })
            const curr = new Candlestick({ open: 2, high: 2, low: 1, close: 1 })
            assert.equal(true, curr.isBearishKicker(prev))
        })
    })

    describe('#isShootingStar()', () => {
        it('should return false when previous candle is not bullish', () => {
            const prev = new Candlestick({ open: 2, high: 10, low: 0.5, close: 1 })
            const curr = new Candlestick({ open: 4, high: 20, low: 2.9, close: 3 })
            assert.equal(false, curr.isShootingStar(prev))
        })

        it('should return false when no gap between candles', () => {
            const prev = new Candlestick({ open: 1, high: 10, low: 0.5, close: 2 })
            const curr = new Candlestick({ open: 3, high: 30, low: 1.4, close: 1.5 })
            assert.equal(false, curr.isShootingStar(prev))
        })

        it(`should return true when candles are bull, bear, gap in-between, long high and short low`, () => {
            const prev = new Candlestick({ open: 1, high: 2, low: 0.5, close: 2 })
            const curr = new Candlestick({ open: 4, high: 20, low: 2.9, close: 3 })
            assert.equal(true, curr.isShootingStar(prev))
        })

        it(`should return true when candles are bull, neutral, gap in-between, long high and short low`, () => {
            const prev = new Candlestick({ open: 1, high: 2, low: 0.5, close: 2 })
            const curr = new Candlestick({ open: 3, high: 20, low: 2.9, close: 3 })
            assert.equal(true, curr.isShootingStar(prev))
        })

        it(`should return true when both candles are bull, gap in-between, long high and short low`, () => {
            const prev = new Candlestick({ open: 1, high: 2, low: 0.5, close: 2 })
            const curr = new Candlestick({ open: 3, high: 20, low: 2.9, close: 4 })
            assert.equal(true, curr.isShootingStar(prev))
        })
    })

    describe('#isMorningStar()', () => {
        it('should return false when previous candle is not bearish', () => {
            const prev = new Candlestick({ open: 5, high: 7, low: 4.5, close: 6 })
            const curr = new Candlestick({ open: 3, high: 4, low: 0.5, close: 4 })
            assert.equal(false, curr.isMorningStar(prev))
        })

        it('should return false when no gap between candles', () => {
            const prev = new Candlestick({ open: 6, high: 7, low: 4.5, close: 5 })
            const curr = new Candlestick({ open: 3, high: 5, low: 0.5, close: 5 })
            assert.equal(false, curr.isMorningStar(prev))
        })

        it(`should return true when candles are bull, bear, gap in-between, long high and short low`, () => {
            const prev = new Candlestick({ open: 6, high: 7, low: 4.5, close: 5 })
            const curr = new Candlestick({ open: 3, high: 4, low: 0.5, close: 4 })
            assert.equal(true, curr.isMorningStar(prev))
        })

        it(`should return true when candles are bull, neutral, gap in-between, long high and short low`, () => {
            const prev = new Candlestick({ open: 6, high: 7, low: 4.5, close: 5 })
            const curr = new Candlestick({ open: 4, high: 4, low: 0.5, close: 4 })
            assert.equal(true, curr.isMorningStar(prev))
        })

        it(`should return true when both candles are bull, gap in-between, long high and short low`, () => {
            const prev = new Candlestick({ open: 6, high: 7, low: 4.5, close: 5 })
            const curr = new Candlestick({ open: 4, high: 4, low: 0.5, close: 3 })
            assert.equal(true, curr.isMorningStar(prev))
        })
    })

    describe('#isBullishGap()', () => {
        it('should return false when current candle is not bullish', () => {
            const prev = new Candlestick({ open: 6, high: 7, low: 4.5, close: 5 })
            const curr = new Candlestick({ open: 4, high: 4, low: 0.5, close: 3 })
            assert.equal(false, curr.isBullishGap(prev))
        })

        it('should return false when no gap-up between candles', () => {
            const prev = new Candlestick({ open: 3, high: 4, low: 0.5, close: 5 })
            const curr = new Candlestick({ open: 5, high: 7, low: 4.5, close: 5 })
            assert.equal(false, curr.isBullishGap(prev))
        })

        it(`should return true when current candle is bullish, gap-up in-between`, () => {
            const prev = new Candlestick({ open: 3, high: 4, low: 0.5, close: 4 })
            const curr = new Candlestick({ open: 5, high: 7, low: 4.5, close: 6 })
            assert.equal(true, curr.isBullishGap(prev))
        })
    })

    describe('#isBearishGap()', () => {
        it('should return false when current candle is not bearish', () => {
            const prev = new Candlestick({ open: 6, high: 7, low: 4.5, close: 5 })
            const curr = new Candlestick({ open: 3, high: 4, low: 0.5, close: 4 })
            assert.equal(false, curr.isBearishGap(prev))
        })

        it('should return false when no gap-down between candles', () => {
            const prev = new Candlestick({ open: 6, high: 7, low: 4.5, close: 5 })
            const curr = new Candlestick({ open: 4, high: 5, low: 0.5, close: 5 })
            assert.equal(false, curr.isBearishGap(prev))
        })

        it(`should return true when current candle is bearish, bear, gap-down in-between`, () => {
            const prev = new Candlestick({ open: 6, high: 7, low: 4.5, close: 5 })
            const curr = new Candlestick({ open: 4, high: 4, low: 0.5, close: 3 })
            assert.equal(true, curr.isBearishGap(prev))
        })
    })

    describe('#isBullishSmash()', () => {
        it('should return false when current candle is not bullish', () => {
            const prev = new Candlestick({ open: 2.5, high: 7, low: 2, close: 3.5 })
            const curr = new Candlestick({ open: 8, high: 8, low: 3, close: 3 })
            assert.equal(false, curr.isBullishSmash(prev))
        })

        it('should return false when previous candle is not inverted hammer', () => {
            const prev = new Candlestick({ open: 6, high: 7, low: 2, close: 6 })
            const curr = new Candlestick({ open: 3, high: 8, low: 3, close: 8 })
            assert.equal(false, curr.isBullishSmash(prev))
        })

        it('should return false when current candle close is lower than previous high', () => {
            const prev = new Candlestick({ open: 2.5, high: 7, low: 2, close: 3.5 })
            const curr = new Candlestick({ open: 3, high: 6, low: 3, close: 6 })
            assert.equal(false, curr.isBullishSmash(prev))
        })

        it('should return true when current candle is bullish and previous candle is bearish inverted hammer', () => {
            const prev = new Candlestick({ open: 3.5, high: 7, low: 2, close: 2.5 })
            const curr = new Candlestick({ open: 3, high: 8, low: 3, close: 8 })
            assert.equal(true, curr.isBullishSmash(prev))
        })

        it('should return true when current candle is bullish and previous candle is bullish inverted hammer', () => {
            const prev = new Candlestick({ open: 2.5, high: 7, low: 2, close: 3.5 })
            const curr = new Candlestick({ open: 3, high: 8, low: 3, close: 8 })
            assert.equal(true, curr.isBullishSmash(prev))
        })
    })

    describe('#isBearishSmash()', () => {
        it('should return false when current candle is not bearish', () => {
            const prev = new Candlestick({ open: 5.5, high: 7, low: 2, close: 6.5 })
            const curr = new Candlestick({ open: 1, high: 6, low: 1, close: 6 })
            assert.equal(false, curr.isBearishSmash(prev))
        })

        it('should return false when previous candle is not hammer', () => {
            const prev = new Candlestick({ open: 5.5, high: 7, low: 2, close: 3 })
            const curr = new Candlestick({ open: 6, high: 6, low: 1, close: 1 })
            assert.equal(false, curr.isBearishSmash(prev))
        })

        it('should return false when current candle close is higher than previous candle low', () => {
            const prev = new Candlestick({ open: 5.5, high: 7, low: 2, close: 6.5 })
            const curr = new Candlestick({ open: 6, high: 6, low: 3, close: 3 })
            assert.equal(false, curr.isBearishSmash(prev))
        })

        it('should return true when current candle is bearish and previous candle is bullish hammer', () => {
            const prev = new Candlestick({ open: 5.5, high: 7, low: 2, close: 6.5 })
            const curr = new Candlestick({ open: 6, high: 6, low: 1, close: 1 })
            assert.equal(true, curr.isBearishSmash(prev))
        })

        it('should return true when current candle is bearish and previous candle is bearish hammer', () => {
            const prev = new Candlestick({ open: 6.5, high: 7, low: 2, close: 5.5 })
            const curr = new Candlestick({ open: 6, high: 6, low: 1, close: 1 })
            assert.equal(true, curr.isBearishSmash(prev))
        })
    })

    describe('#isPiercing()', () => {
        it('should return false when current candle is not bullish', () => {
            const prev = new Candlestick({ open: 8, high: 8.5, low: 3.5, close: 4 })
            const curr = new Candlestick({ open: 3, high: 2, low: 2, close: 2 })
            assert.equal(false, curr.isPiercing(prev))
        })

        it('should return false when previous candle is not bearish', () => {
            const prev = new Candlestick({ open: 3, high: 8.5, low: 3.5, close: 4 })
            const curr = new Candlestick({ open: 3, high: 8, low: 3, close: 7 })
            assert.equal(false, curr.isPiercing(prev))
        })

        it('should return false when current candle open is higher than previous low', () => {
            const prev = new Candlestick({ open: 8, high: 8.5, low: 3.5, close: 4 })
            const curr = new Candlestick({ open: 4, high: 8, low: 3, close: 7 })
            assert.equal(false, curr.isPiercing(prev))
        })

        it('should return false when current candle close is bellow previous body half', () => {
            const prev = new Candlestick({ open: 8, high: 8.5, low: 3.5, close: 4 })
            const curr = new Candlestick({ open: 3, high: 8, low: 3, close: 5 })
            assert.equal(false, curr.isPiercing(prev))
        })

        it('should return false when current candle close is above previous open', () => {
            const prev = new Candlestick({ open: 8, high: 8.5, low: 3.5, close: 4 })
            const curr = new Candlestick({ open: 3, high: 8, low: 3, close: 8.5 })
            assert.equal(false, curr.isPiercing(prev))
        })

        it('should return true when current candle is piercing', () => {
            const prev = new Candlestick({ open: 8, high: 8.5, low: 3.5, close: 4 })
            const curr = new Candlestick({ open: 3, high: 8, low: 3, close: 7 })
            assert.equal(true, curr.isPiercing(prev))
        })
    })

    describe('#isDarkCloudCover()', () => {
        it('should return false when current candle is not bearish', () => {
            const prev = new Candlestick({ open: 2, high: 6.5, low: 1.5, close: 6 })
            const curr = new Candlestick({ open: 8, high: 8.5, low: 2.5, close: 8.5 })
            assert.equal(false, curr.isDarkCloudCover(prev))
        })

        it('should return false when previous candle is not bullish', () => {
            const prev = new Candlestick({ open: 2, high: 6.5, low: 1.5, close: 1.5 })
            const curr = new Candlestick({ open: 8, high: 8.5, low: 2.5, close: 3 })
            assert.equal(false, curr.isDarkCloudCover(prev))
        })

        it('should return false when current candle open is lower than previous high', () => {
            const prev = new Candlestick({ open: 2, high: 6.5, low: 1.5, close: 6 })
            const curr = new Candlestick({ open: 6, high: 8.5, low: 2.5, close: 3 })
            assert.equal(false, curr.isDarkCloudCover(prev))
        })

        it('should return false when current candle close is above previous body half', () => {
            const prev = new Candlestick({ open: 2, high: 6.5, low: 1.5, close: 6 })
            const curr = new Candlestick({ open: 8, high: 8.5, low: 2.5, close: 5 })
            assert.equal(false, curr.isDarkCloudCover(prev))
        })

        it('should return false when current candle close is below previous open', () => {
            const prev = new Candlestick({ open: 2, high: 6.5, low: 1.5, close: 6 })
            const curr = new Candlestick({ open: 8, high: 8.5, low: 2.5, close: 1.5 })
            assert.equal(false, curr.isDarkCloudCover(prev))
        })

        it('should return true when current candle is dark cloud cover', () => {
            const prev = new Candlestick({ open: 2, high: 6.5, low: 1.5, close: 6 })
            const curr = new Candlestick({ open: 8, high: 8.5, low: 2.5, close: 3 })
            assert.equal(true, curr.isDarkCloudCover(prev))
        })
    })
})