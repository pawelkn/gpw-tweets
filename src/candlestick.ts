import { max, min, abs } from 'mathjs'

export default class Candlestick {
    public readonly date: string
    public readonly open: number
    public readonly high: number
    public readonly low: number
    public readonly close: number
    public readonly volume: number

    constructor({ date, open, high, low, close, volume }: { date: string, open: number, high: number, low: number, close: number, volume: number }) {
        this.date = date
        this.open = open
        this.high = high
        this.low = low
        this.close = close
        this.volume = volume
    }

    // Boolean pattern detection

    public isHammer(ratio = 2) {
        return this.tailLen() > (this.bodyLen() * ratio) &&
            this.wickLen() < this.bodyLen();
    }

    public isInvertedHammer(ratio = 2) {
        return this.wickLen() > (this.bodyLen() * ratio) &&
            this.tailLen() < this.bodyLen();
    }

    public isBullishHammer() {
        return this.isBullish() &&
            this.isHammer();
    }

    public isBearishHammer() {
        return this.isBearish() &&
            this.isHammer();
    }

    public isBullishInvertedHammer() {
        return this.isBullish() &&
            this.isInvertedHammer();
    }

    public isBearishInvertedHammer() {
        return this.isBearish() &&
            this.isInvertedHammer();
    }

    public isHangingMan(previous: Candlestick) {
        return previous.isBullish() &&
            this.isBearishHammer() &&
            this.hasGapUp(previous);
    }

    public isShootingStar(previous: Candlestick) {
        return previous.isBullish() &&
            this.isBearishInvertedHammer() &&
            this.hasGapUp(previous);
    }

    public isMorningStar(previous: Candlestick) {
        return previous.isBearish() &&
            this.isBullishHammer() &&
            this.hasGapDown(previous);
    }

    public isBullishEngulfing(previous: Candlestick) {
        return previous.isBearish() &&
            this.isBullish() &&
            this.isEngulfed(previous);
    }

    public isBearishEngulfing(previous: Candlestick) {
        return previous.isBullish() &&
            this.isBearish() &&
            this.isEngulfed(previous);
    }

    public isBullishHarami(previous: Candlestick) {
        return previous.isBullish() &&
            this.isBullish() &&
            this.isEngulfed(previous);
    }

    public isBearishHarami(previous: Candlestick) {
        return previous.isBullish() &&
            this.isBullish() &&
            this.isEngulfed(previous);
    }

    public isBullishKicker(previous: Candlestick) {
        return previous.isBearish() &&
            this.isBullish() &&
            this.hasGapUp(previous) &&
            !(this.isHammer() || this.isInvertedHammer());
    }

    public isBearishKicker(previous: Candlestick) {
        return previous.isBullish() &&
            this.isBearish() &&
            this.hasGapDown(previous) &&
            !(this.isHammer() || this.isInvertedHammer());
    }

    private bodyLen() {
        return abs(this.open - this.close);
    }

    private wickLen() {
        return this.high - max(this.open, this.close);
    }

    private tailLen() {
        return min(this.open, this.close) - this.low;
    }

    private bodyEnds() {
        return this.open <= this.close ?
            { bottom: this.open, top: this.close } :
            { bottom: this.close, top: this.open };
    }

    private isBullish() {
        return this.open < this.close;
    }

    private isBearish() {
        return this.open > this.close;
    }

    private isEngulfed(previous: Candlestick) {
        return previous.bodyEnds().top <= this.bodyEnds().top &&
        previous.bodyEnds().bottom >= this.bodyEnds().bottom;
    }

    private hasGapUp(previous: Candlestick) {
        return previous.bodyEnds().top < this.bodyEnds().bottom;
    }

    private hasGapDown(previous: Candlestick) {
        return previous.bodyEnds().bottom > this.bodyEnds().top;
    }
}
