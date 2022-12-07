import { max, min, abs } from 'mathjs'

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

    public bodyLen() { return abs(this.open - this.close) }
    public wickLen() { return this.high - max(this.open, this.close) }
    public tailLen() { return min(this.open, this.close) - this.low }

    public isHammer(ratio = 2) { return this.tailLen() > (this.bodyLen() * ratio) && this.wickLen() < this.bodyLen() }
    public isInvertedHammer(ratio = 2) { return this.wickLen() > (this.bodyLen() * ratio) && this.tailLen() < this.bodyLen() }
    public isBullishHammer() { return this.isBullish() && this.isHammer() }
    public isBearishHammer() { return this.isBearish() && this.isHammer() }
    public isBullishInvertedHammer() { return this.isBullish() && this.isInvertedHammer() }
    public isBearishInvertedHammer() { return this.isBearish() && this.isInvertedHammer() }

    public hasGapUp(previous: Candlestick) { return previous.high < this.low }
    public hasGapDown(previous: Candlestick) { return previous.low > this.high }

    public isHangingMan(previous: Candlestick) { return previous.isBullish() && this.isBearishHammer() && this.hasGapUp(previous) }
    public isShootingStar(previous: Candlestick) { return previous.isBullish() && this.isInvertedHammer() && this.hasGapUp(previous) }
    public isMorningStar(previous: Candlestick) { return previous.isBearish() && this.isHammer() && this.hasGapDown(previous) }
    public isBullishEngulfing(previous: Candlestick) { return previous.isBearish() && this.isBullish() && this.isEngulfed(previous) }
    public isBearishEngulfing(previous: Candlestick) { return previous.isBullish() && this.isBearish() && this.isEngulfed(previous) }
    public isBullishHarami(previous: Candlestick) { return previous.isBullish() && this.isBullish() && this.isEngulfed(previous) }
    public isBearishHarami(previous: Candlestick) { return previous.isBullish() && this.isBullish() && this.isEngulfed(previous) }
    public isBullishKicker(previous: Candlestick) { return previous.isBearish() && this.isBullish() && this.hasGapUp(previous) && !(this.isHammer() || this.isInvertedHammer()) }
    public isBearishKicker(previous: Candlestick) { return previous.isBullish() && this.isBearish() && this.hasGapDown(previous) && !(this.isHammer() || this.isInvertedHammer()) }
    public isBullishGap(previous: Candlestick) { return this.isBullish() && this.hasGapUp(previous) }
    public isBearishGap(previous: Candlestick) { return this.isBearish() && this.hasGapDown(previous) }
    public isBullishSmash(previous: Candlestick) { return previous.isInvertedHammer() && this.isBullish() && (this.close > previous.high) }
    public isBearishSmash(previous: Candlestick) { return previous.isHammer() && this.isBearish() && (this.close < previous.low) }
    public isPiercing(previous: Candlestick) { return (this.open < previous.low) && (this.close > previous.bodyHalf() ) && (this.close < previous.open) }
    public isDarkCloudCover(previous: Candlestick) { return (this.open > previous.high) && (this.close < previous.bodyHalf() ) && (this.close > previous.open) }

    private bodyEnds() { return this.open <= this.close ? { bottom: this.open, top: this.close } : { bottom: this.close, top: this.open } }
    private bodyHalf() { return (this.open + this.close) / 2 }
    private isEngulfed(previous: Candlestick) { return previous.bodyEnds().top <= this.bodyEnds().top && previous.bodyEnds().bottom >= this.bodyEnds().bottom }
}
