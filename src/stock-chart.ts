import { max, min, log10, round, isNaN } from 'mathjs'
import { createCanvas } from "canvas"
import Candlestick from './candlestick'

const IMAGE = {
    width: 600,
    height: 430
}

const HEADER = {
    top: 0,
    left: 0,
    width: IMAGE.width,
    height: 60,
    padding: 14,
    line: 42
}

const CHART = {
    top: HEADER.height,
    left: 0,
    width: IMAGE.width,
    height: 330,
    padding: {
        top: HEADER.height + 22.0,
        bottom: HEADER.height + 308.0,
        left: 13.5,
        right: IMAGE.width - 60.5
    }
}

const FOOTER = {
    top: HEADER.height + CHART.height,
    left: 0,
    width: IMAGE.width,
    height: IMAGE.height - HEADER.height - CHART.height,
    padding: 16.5,
    line: 24
}

export default function stockChart(description: string, data: Candlestick[], date: string, price: number, priceChange: number,
                                   grid: string = 'day', interval: string = '1 day', currency: string = 'PLN') {
    if (data.length < 2)
        return null

    const canvas = createCanvas(IMAGE.width, IMAGE.height)
    const context = canvas.getContext("2d")

    // background
    context.fillStyle = "#fafafa"
    context.fillRect(0, 0, IMAGE.width, IMAGE.height)

    // header
    context.lineWidth = 1
    context.strokeStyle = '#eaeaea'
    context.beginPath()
    context.moveTo(CHART.left, CHART.top)
    context.lineTo(CHART.width, CHART.top)
    context.stroke()

    context.fillStyle = "#08c"
    context.font = 'bold 30px "Open Sans"'
    context.textAlign = "left"
    context.fillText(description, HEADER.left + HEADER.padding, HEADER.top + HEADER.line)
    context.fillStyle = (priceChange !== 0 ? (priceChange > 0 ? "green" : "red") : "grey")
    context.font = '28px "DejaVu Sans"'
    context.textAlign = "center"
    context.fillText(`${priceChange.toFixed(2)}% ${priceChange != 0 ? (priceChange > 0 ? "\u25B2" : "\u25BC") : "\u25CF"}`, HEADER.left + HEADER.width/2, HEADER.top + HEADER.line)
    context.fillStyle = "#333"
    context.font = '30px "Open Sans"'
    context.textAlign = "right"
    context.fillText(`${price.toFixed(2)} ${currency}`, HEADER.left + HEADER.width - HEADER.padding, HEADER.top + HEADER.line)

    // footer
    context.lineWidth = 1
    context.strokeStyle = '#eaeaea'
    context.beginPath()
    context.moveTo(CHART.left, CHART.top + CHART.height)
    context.lineTo(CHART.width, CHART.top + CHART.height)
    context.stroke()

    context.fillStyle = "#333"
    context.font = '13px "Open Sans"'
    context.textAlign = "left"
    context.fillText(`Interval: ${interval}`, FOOTER.left + FOOTER.padding, FOOTER.top + FOOTER.line)
    context.textAlign = "center"
    context.fillText("© Paweł Knioła", FOOTER.left + FOOTER.width/2, FOOTER.top + FOOTER.line)
    context.textAlign = "right"
    context.fillText(date, FOOTER.left + FOOTER.width - FOOTER.padding, FOOTER.top + FOOTER.line)

    // chart
    context.fillStyle = "#fff"
    context.fillRect(CHART.left, CHART.top, CHART.width, CHART.height)

    let highest = NaN
    let lowest = NaN
    let volHighest = NaN

    for (const d of data) {
        if (isNaN(highest) || isNaN(lowest) || isNaN(volHighest)) {
            highest = d.high
            lowest = d.low
            volHighest = d.volume
        } else {
            if (highest < d.high) {
                highest = d.high
            }
            if (lowest > d.low) {
                lowest = d.low
            }
            if (volHighest < d.volume) {
                volHighest = d.volume
            }
        }
    }

    let x1 = highest
    let x2 = lowest

    let y1 = CHART.padding.top
    let y2 = CHART.padding.bottom

    let a1 = (y1 - y2) / (log10(x1) - log10(x2))
    let b1 = y1 - a1 * (log10(x1))

    let logScale = (x: number) => round(a1 * log10(x) + b1) + 0.5
    let reverseLogScale = (y:number) => 10 ** ((y - b1) / a1)

    x1 = volHighest
    x2 = 0

    let a2 = (y1 - y2) / (x1 - x2)
    let b2 = y1 - a2 * (x1)

    let linScale = (x: number) => round(a2 * x + b2) + 0.5

    // vertical grid
    const verticalSpace = (CHART.padding.right - CHART.padding.left) / (data.length)

    const descriptionText = function (x1: number, x2: number, text: string) {
        if (x2 - x1 > String(text).length * 8) {
            context.fillStyle = "#333"
            context.font = '13px "Open Sans"'
            context.textAlign = "center"
            context.fillText(text, x2 - (x2 - x1) / 2, CHART.padding.bottom + 14.0)
        }
    }

    const zfill = (num: number, len: number) => (Array(len).join("0") + num).slice(-len)
    const decade = (date: Date) => zfill((date.getFullYear() % 100) - (date.getFullYear() % 10), 2) + '\''

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

    const dateFormat = function (date: Date, grid: string) {
        if (grid == 'month') return months[date.getMonth()]
        else if (grid == 'year') return date.getFullYear().toString()
        else if (grid == 'decade') return decade(date)
        else return date.getDate().toString()
    }

    x1 = NaN
    x2 = CHART.padding.left

    let lastDate: Date | null = null

    for (let i = 0; i < data.length; i++) {
        const e = data[i]
        const date = new Date(e.date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'))
        if (lastDate === null)
            lastDate = date

        else {
            if (((grid == 'day') && (lastDate.getDate() != date.getDate())) ||
                ((grid == 'month') && (lastDate.getMonth() != date.getMonth())) ||
                ((grid == 'year') && (lastDate.getFullYear() != date.getFullYear())) ||
                ((grid == 'decade') && (lastDate.getFullYear() != date.getFullYear()) && (date.getFullYear() % 10 == 0))) {
                x1 = x2
                x2 = round(CHART.padding.left + verticalSpace * i) + 0.5

                context.lineWidth = 1
                context.strokeStyle = '#eee'
                context.beginPath()
                context.moveTo(x2, CHART.padding.top - 10.0)
                context.lineTo(x2, CHART.padding.bottom + 10.0)
                context.stroke()

                descriptionText(x1, x2, dateFormat(lastDate, grid))

                lastDate = date
            }

            else if (data.length == i + 1) {
                x1 = x2
                x2 = round(CHART.padding.left + verticalSpace * data.length) + 0.5

                descriptionText(x1, x2, dateFormat(date, grid))
            }
        }
    }

    // horizontal grid
    const horizontalCount = 5
    const horizontalSpace = (CHART.padding.bottom - CHART.padding.top) / (horizontalCount - 1)

    for (let i = 0; i < horizontalCount; i++) {
        let y = round(CHART.padding.top + horizontalSpace * i) + 0.5
        const text = reverseLogScale(y) ? Number(reverseLogScale(y)).toFixed(reverseLogScale(y) < 1000 ? 2 : 0) : ""

        context.lineWidth = 1
        context.strokeStyle = '#eee'
        context.beginPath()
        context.moveTo(CHART.padding.left, y)
        context.lineTo(CHART.padding.right + 5, y)
        context.stroke()

        context.fillStyle = "#333"
        context.font = '13px "Open Sans"'
        context.textAlign = "left"
        context.fillText(text, CHART.padding.right + 10.0, y + 4.0)
    }

    // volume bars

    for (let i = 0; i < data.length; i++) {
        const e = data[i]
        const verticalSpace = (CHART.padding.right - CHART.padding.left) / (data.length)
        let strokeWidth = verticalSpace > 7.0 ? 1.0 : 0.0

        let center = round(CHART.padding.left + verticalSpace * (i + 0.5)) + 0.5
        let width = 2.0 + strokeWidth
        let left = center - width / 2

        let volWidth = width + strokeWidth * 2
        let volLeft = left - strokeWidth

        let volTop = linScale(e.volume) - strokeWidth
        let volBottom = linScale(0) + strokeWidth
        let volHeight = volBottom - volTop

        context.fillStyle = "#ddd"
        context.fillRect(volLeft, volTop, volWidth, volHeight)
    }

    // candle bars

    for (let i = 0; i < data.length; i++) {
        const e = data[i]
        const verticalSpace = (CHART.padding.right - CHART.padding.left) / (data.length)

        let center = round(CHART.padding.left + verticalSpace * (i + 0.5)) + 0.5
        let width = verticalSpace > 7.0 ? 4.0 : 2.0
        let left = center - width / 2
        let right = left + width

        let minimum = logScale(e.low)
        let maximum = logScale(e.high)
        let top = logScale(max(e.close, e.open))
        let bottom = logScale(min(e.close, e.open))
        let height = ((bottom - top) > 1.0 ? bottom - top : 0.0)

        let highlight = i > 0 && data[i].volume > data[i-1].volume * 2.0
        let upcandle = e.close > e.open

        context.lineWidth = 1
        context.strokeStyle = highlight ? (upcandle ? "lime" : "red") : "#000"
        context.fillStyle = upcandle ? "white" : "#08c"
        context.fillRect(left, top, width, height)

        context.beginPath()
        context.moveTo(left, top)
        context.lineTo(left + width, top)
        context.stroke()

        context.beginPath()
        context.moveTo(left + width, top)
        context.lineTo(left + width, top + height)
        context.stroke()

        context.beginPath()
        context.moveTo(left, top + height)
        context.lineTo(left + width, top + height)
        context.stroke()

        context.beginPath()
        context.moveTo(left, top)
        context.lineTo(left, top + height)
        context.stroke()

        context.beginPath()
        context.moveTo(center, maximum)
        context.lineTo(center, top)
        context.stroke()

        context.beginPath()
        context.moveTo(center, bottom)
        context.lineTo(center, minimum)
        context.stroke()
    }

    return canvas.toBuffer("image/png")
}