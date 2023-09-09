import { abs } from 'mathjs'

export default class Candlestick {
    public date: string
    public open: number
    public high: number
    public low: number
    public close: number
    public volume: number

    constructor({ date, open, high, low, close, volume }: { date?: string, open?: number, high?: number, low?: number, close?: number, volume?: number }) {
        this.date = date !== undefined ? date : ''
        this.open = open !== undefined ? open : NaN
        this.high = high !== undefined ? high : NaN
        this.low = low !== undefined ? low : NaN
        this.close = close !== undefined ? close : NaN
        this.volume = volume !== undefined ? volume : NaN
    }

    public isBullish() { return this.open < this.close }
    public isBearish() { return this.open > this.close }

    public bodyEnds() { return this.open <= this.close ? { bottom: this.open, top: this.close } : { bottom: this.close, top: this.open } }
    public bodyHalf() { return (this.open + this.close) / 2 }
    public bodyLen() { return abs(this.open - this.close) }
    public wickLen() { return this.high - this.bodyEnds().top }
    public tailLen() { return this.bodyEnds().bottom - this.low }

    public isHammer() { return this.tailLen() > ((this.bodyLen() + this.wickLen()) * 2) }
    public isInvertedHammer() { return this.wickLen() > ((this.bodyLen() + this.tailLen()) * 2) }
    public isBullishHammer() { return this.isBullish() && this.isHammer() }
    public isBearishHammer() { return this.isBearish() && this.isHammer() }
    public isBullishInvertedHammer() { return this.isBullish() && this.isInvertedHammer() }
    public isBearishInvertedHammer() { return this.isBearish() && this.isInvertedHammer() }

    public isLong() { return (this.bodyLen() > ((this.wickLen() + this.tailLen()) * 2)) && (this.bodyEnds().top > this.bodyEnds().bottom * 1.03) }
    public isLongBullish() { return this.isBullish() && this.isLong() }
    public isLongBearish() { return this.isBearish() && this.isLong() }

    public hasGapUp(previous: Candlestick) { return previous.high < this.low }
    public hasGapDown(previous: Candlestick) { return previous.low > this.high }

    public engulfs(c: Candlestick, ratio: number = 2) {
        return (c.bodyEnds().top < this.bodyEnds().top) && (c.bodyEnds().bottom > this.bodyEnds().bottom) && (c.bodyLen() * ratio < this.bodyLen())
    }

    public isShootingStar(previous: Candlestick) { return previous.isBullish() && this.isInvertedHammer() && this.hasGapUp(previous) }
    public isMorningStar(previous: Candlestick) { return previous.isBearish() && this.isHammer() && this.hasGapDown(previous) }

    public isBullishEngulfing(previous: Candlestick) { return previous.isBearish() && this.isLongBullish() && this.engulfs(previous) }
    public isBearishEngulfing(previous: Candlestick) { return previous.isBullish() && this.isLongBearish() && this.engulfs(previous) }

    public isBullishGap(previous: Candlestick) { return this.isLongBullish() && this.hasGapUp(previous) }
    public isBearishGap(previous: Candlestick) { return this.isLongBearish() && this.hasGapDown(previous) }

    public isPiercing(previous: Candlestick) { return this.isLongBullish() && (this.open < previous.low) && (this.close > previous.bodyHalf() ) && (this.close < previous.open) }
    public isDarkCloudCover(previous: Candlestick) { return this.isLongBearish() && (this.open > previous.high) && (this.close < previous.bodyHalf() ) && (this.close > previous.open) }

    public isInsideBar(previous: Candlestick) { return (this.high < previous.high) && (this.low > previous.low) && previous.engulfs(this, 5) }
    public isBullishInsideBar(previous: Candlestick) { return previous.isLongBearish() && this.isInsideBar(previous)  }
    public isBearishInsideBar(previous: Candlestick) { return previous.isLongBullish() && this.isInsideBar(previous) }
}
