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

    public isBullish = () => this.open < this.close
    public isBearish = () => this.open > this.close

    public bodyLen = () => abs(this.open - this.close)
    public wickLen = () => this.high - max(this.open, this.close)
    public tailLen = () => min(this.open, this.close) - this.low

    public isHammer = (ratio = 2) => this.tailLen() > (this.bodyLen() * ratio) && this.wickLen() < this.bodyLen()
    public isInvertedHammer = (ratio = 2) => this.wickLen() > (this.bodyLen() * ratio) && this.tailLen() < this.bodyLen()
    public isBullishHammer = () => this.isBullish() && this.isHammer()
    public isBearishHammer = () => this.isBearish() && this.isHammer()
    public isBullishInvertedHammer = () => this.isBullish() && this.isInvertedHammer()
    public isBearishInvertedHammer = () => this.isBearish() && this.isInvertedHammer()

    public hasGapUp = (previous: Candlestick) => previous.high < this.low
    public hasGapDown = (previous: Candlestick) => previous.low > this.high

    public isHangingMan = (previous: Candlestick) => previous.isBullish() && this.isBearishHammer() && this.hasGapUp(previous)
    public isShootingStar = (previous: Candlestick) => previous.isBullish() && this.isInvertedHammer() && this.hasGapUp(previous)
    public isMorningStar = (previous: Candlestick) => previous.isBearish() && this.isHammer() && this.hasGapDown(previous)
    public isBullishEngulfing = (previous: Candlestick) => previous.isBearish() && this.isBullish() && this.isEngulfed(previous)
    public isBearishEngulfing = (previous: Candlestick) => previous.isBullish() && this.isBearish() && this.isEngulfed(previous)
    public isBullishHarami = (previous: Candlestick) => previous.isBullish() && this.isBullish() && this.isEngulfed(previous)
    public isBearishHarami = (previous: Candlestick) => previous.isBullish() && this.isBullish() && this.isEngulfed(previous)
    public isBullishKicker = (previous: Candlestick) => previous.isBearish() && this.isBullish() && this.hasGapUp(previous) && !(this.isHammer() || this.isInvertedHammer())
    public isBearishKicker = (previous: Candlestick) => previous.isBullish() && this.isBearish() && this.hasGapDown(previous) && !(this.isHammer() || this.isInvertedHammer())
    public isBullishGap = (previous: Candlestick) => this.isBullish() && this.hasGapUp(previous)
    public isBearishGap = (previous: Candlestick) => this.isBearish() && this.hasGapDown(previous)
    public isBullishSmash = (previous: Candlestick) => previous.isInvertedHammer() && this.isBullish() && (this.close > previous.high)
    public isBearishSmash = (previous: Candlestick) => previous.isHammer() && this.isBearish() && (this.close < previous.low)

    private bodyEnds = () => this.open <= this.close ? { bottom: this.open, top: this.close } : { bottom: this.close, top: this.open }
    private isEngulfed = (previous: Candlestick) => previous.bodyEnds().top <= this.bodyEnds().top && previous.bodyEnds().bottom >= this.bodyEnds().bottom
}
