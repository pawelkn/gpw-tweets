import * as assert from 'assert'
import Candlestick from '../src/candlestick'

describe('candlestick', () => {
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
            const curr = new Candlestick({ open: 3.5, high: 4, low: 0.5, close: 4 })
            assert.equal(true, curr.isMorningStar(prev))
        })

        it(`should return true when candles are bull, neutral, gap in-between, long high and short low`, () => {
            const prev = new Candlestick({ open: 6, high: 7, low: 4.5, close: 5 })
            const curr = new Candlestick({ open: 4, high: 4, low: 0.5, close: 4 })
            assert.equal(true, curr.isMorningStar(prev))
        })

        it(`should return true when both candles are bull, gap in-between, long high and short low`, () => {
            const prev = new Candlestick({ open: 6, high: 7, low: 4.5, close: 5 })
            const curr = new Candlestick({ open: 4, high: 4, low: 0.5, close: 3.5 })
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
            const curr = new Candlestick({ open: 5, high: 10, low: 4.5, close: 10 })
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
            const curr = new Candlestick({ open: 4, high: 4, low: 0.5, close: 1 })
            assert.equal(true, curr.isBearishGap(prev))
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
            const curr = new Candlestick({ open: 1, high: 8, low: 1, close: 7 })
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
            const curr = new Candlestick({ open: 10, high: 10.5, low: 2.5, close: 3 })
            assert.equal(true, curr.isDarkCloudCover(prev))
        })
    })

    describe('#isBullishInsideBar', () => {
        it('should identify a bullish inside bar when the current candlestick is doji and the previous candlestick is bearish, and the high of the current candlestick is equal to the open of the previous candlestick and the low of the current candlestick is equal to the close of the previous candlestick', () => {
            const previous = new Candlestick({ open: 14, high: 15, low: 5, close: 5 })
            const current = new Candlestick({ open: 8, high: 9, low: 6, close: 8 })
            assert.equal(true, current.isBullishInsideBar(previous))
        })

        it('should identify a bullish inside bar when the current candlestick is bearish and the previous candlestick is bearish, and the high of the current candlestick is equal to the close of the previous candlestick and the low of the current candlestick is equal to the open of the previous candlestick', () => {
            const previous = new Candlestick({ open: 14, high: 15, low: 5, close: 5 })
            const current = new Candlestick({ open: 8.8, high: 9, low: 6, close: 9 })
            assert.equal(true, current.isBullishInsideBar(previous))
        })

        it('should not identify a bullish inside bar when the current candlestick is bullish and the previous candlestick is bearish, and the high of the current candlestick is lower than the open of the previous candlestick and the low of the current candlestick is higher than the close of the previous candlestick', () => {
            const previous = new Candlestick({ open: 14, high: 15, low: 5, close: 5 })
            const current = new Candlestick({ open: 9, high: 9, low: 6, close: 8.8 })
            assert.equal(true, current.isBullishInsideBar(previous))
        })

        it('should not identify a bullish inside bar when the current candlestick is bullish and the previous candlestick is bullish', () => {
            const previous = new Candlestick({ open: 8, high: 10, low: 6, close: 9 })
            const current = new Candlestick({ open: 9, high: 12, low: 7, close: 11 })
            assert.equal(false, current.isBullishInsideBar(previous))
        })

        it('should not identify a bullish inside bar when the current candlestick is bullish and the previous candlestick is bearish, but the high of the current candlestick is lower than the high of the previous candlestick', () => {
            const previous = new Candlestick({ open: 8, high: 10, low: 6, close: 9 })
            const current = new Candlestick({ open: 7, high: 9, low: 6, close: 8 })
            assert.equal(false, current.isBullishInsideBar(previous))
        })

        it('should not identify a bullish inside bar when the current candlestick is bullish and the previous candlestick is bearish, but the low of the current candlestick is higher than the low of the previous candlestick', () => {
            const previous = new Candlestick({ open: 8, high: 10, low: 6, close: 9 })
            const current = new Candlestick({ open: 7, high: 10, low: 7, close: 8 })
            assert.equal(false, current.isBullishInsideBar(previous))
        })
    })

    describe('#isBearishInsideBar', () => {
        it('should identify a bearish inside bar when the current candlestick is doji and the previous candlestick is bullish, with a higher close and lower open', () => {
            const previous = new Candlestick({ open: 5, high: 15, low: 5, close: 14 })
            const current = new Candlestick({ open: 7, high: 9, low: 6, close: 7 })
            assert.equal(true, current.isBearishInsideBar(previous))
        })

        it('should identify a bearish inside bar when the current candlestick is bullish and the previous candlestick is bullish, with a lower close and higher open', () => {
            const previous = new Candlestick({ open: 5, high: 15, low: 5, close: 14 })
            const current = new Candlestick({ open: 8, high: 9, low: 6, close: 7.7 })
            assert.equal(true, current.isBearishInsideBar(previous))
        })

        it('should not identify a bearish inside bar when the current candlestick is bearish and the previous candlestick is bullish, with a higher close and lower open', () => {
            const previous = new Candlestick({ open: 5, high: 15, low: 5, close: 14 })
            const current = new Candlestick({ open: 7.7, high: 9, low: 6, close: 8 })
            assert.equal(true, current.isBearishInsideBar(previous))
        })

        it('should not identify a bearish inside bar when the current candlestick is not a bearish inside bar', () => {
            const previous = new Candlestick({ open: 8, high: 10, low: 6, close: 9 })
            const current = new Candlestick({ open: 7, high: 10, low: 6, close: 8 })
            assert.equal(false, current.isBearishInsideBar(previous))
        })

        it('should not identify a bearish inside bar when the previous candlestick is not a bearish candlestick', () => {
            const previous = new Candlestick({ open: 8, high: 10, low: 6, close: 9 })
            const current = new Candlestick({ open: 7, high: 9, low: 6, close: 8 })
            assert.equal(false, current.isBearishInsideBar(previous))
        })

        it('should not identify a bearish inside bar when the current candlestick is bullish and the previous candlestick is bearish, but the low of the current candlestick is higher than the low of the previous candlestick', () => {
            const previous = new Candlestick({ open: 8, high: 10, low: 6, close: 9 })
            const current = new Candlestick({ open: 7, high: 10, low: 7, close: 8 })
            assert.equal(false, current.isBearishInsideBar(previous))
        })
    })
})