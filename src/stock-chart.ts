import * as fs from "fs"
import { max, min, log10, round, isNaN } from 'mathjs'
import { createCanvas } from "canvas"
import { Candlestick } from './wse-quotes'

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

export default function stockChart(description: string, stock_data: Candlestick[], currency: string = 'PLN', period: string = '3m', interval: string = '1 day') {
    if (stock_data.length < 2)
        return null

    const current_price = stock_data[stock_data.length - 1].close
    const last_price = stock_data[stock_data.length - 2].close
    const price_change = (1 - last_price / current_price) * 100

    const date = new Date(stock_data[stock_data.length - 1].date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'))
    const zeroPad = (num: number, places=2) => String(num).padStart(places, '0')
    const last_update = `${date.getFullYear()}-${zeroPad(date.getMonth() + 1)}-${zeroPad(date.getDate())}`

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
    context.font = 'bold 28px "DejaVu Sans"'
    context.textAlign = "left"
    context.fillText(description, HEADER.left + HEADER.padding, HEADER.top + HEADER.line)
    context.fillStyle = (price_change !== 0 ? (price_change > 0 ? "green" : "red") : "grey")
    context.font = '28px "DejaVu Sans"'
    context.textAlign = "center"
    context.fillText(`${price_change.toFixed(2)}% ${price_change != 0 ? (price_change > 0 ? "\u25B2" : "\u25BC") : "\u25CF"}`, HEADER.left + HEADER.width/2, HEADER.top + HEADER.line)
    context.fillStyle = "#333"
    context.textAlign = "right"
    context.fillText(`${current_price.toFixed(2)} ${currency}`, HEADER.left + HEADER.width - HEADER.padding, HEADER.top + HEADER.line)

    // footer
    context.lineWidth = 1
    context.strokeStyle = '#eaeaea'
    context.beginPath()
    context.moveTo(CHART.left, CHART.top + CHART.height)
    context.lineTo(CHART.width, CHART.top + CHART.height)
    context.stroke()

    context.fillStyle = "#333"
    context.font = '12px "DejaVu Sans"'
    context.textAlign = "left"
    context.fillText(`Interval: ${interval}`, FOOTER.left + FOOTER.padding, FOOTER.top + FOOTER.line)
    context.textAlign = "center"
    context.fillText("\u00A9 stockaggregator.com", FOOTER.left + FOOTER.width/2, FOOTER.top + FOOTER.line)
    context.textAlign = "right"
    context.fillText(last_update, FOOTER.left + FOOTER.width - FOOTER.padding, FOOTER.top + FOOTER.line)

    // chart
    context.fillStyle = "#fff"
    context.fillRect(CHART.left, CHART.top, CHART.width, CHART.height)

    let highest = NaN
    let lowest = NaN
    let vol_highest = NaN

    for (const d of stock_data) {
        if (isNaN(highest) || isNaN(lowest) || isNaN(vol_highest)) {
            highest = d.high
            lowest = d.low
            vol_highest = d.volume
        } else {
            if (highest < d.high) {
                highest = d.high
            }
            if (lowest > d.low) {
                lowest = d.low
            }
            if (vol_highest < d.volume) {
                vol_highest = d.volume
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

    x1 = vol_highest
    x2 = 0

    let a2 = (y1 - y2) / (x1 - x2)
    let b2 = y1 - a2 * (x1)

    let linScale = (x: number) => round(a2 * x + b2) + 0.5

    // vertical grid
    const vertical_space = (CHART.padding.right - CHART.padding.left) / (stock_data.length)

    const descriptionText = function (x1: number, x2: number, text: string) {
        if (x2 - x1 > String(text).length * 8) {
            context.fillStyle = "#333"
            context.font = '12px "DejaVu Sans"'
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

    let grid: string = 'day'
    if ((period == '3m') || (period == '5m') || (period == '12m')) grid = 'month'
    else if ((period == '3y') || (period == '5y') || (period == '10y')) grid = 'year'
    else if ((period == '20y') || (period == '30y')) grid = 'decade'

    let last_date: Date | null = null

    for (let i = 0; i < stock_data.length; i++) {
        const e = stock_data[i]
        const date = new Date(e.date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'))
        if (last_date === null)
            last_date = date

        else {
            if (((grid == 'day') && (last_date.getDate() != date.getDate())) ||
                ((grid == 'month') && (last_date.getMonth() != date.getMonth())) ||
                ((grid == 'year') && (last_date.getFullYear() != date.getFullYear())) ||
                ((grid == 'decade') && (last_date.getFullYear() != date.getFullYear()) && (date.getFullYear() % 10 == 0))) {
                x1 = x2
                x2 = round(CHART.padding.left + vertical_space * i) + 0.5

                context.lineWidth = 1
                context.strokeStyle = '#ddd'
                context.beginPath()
                context.moveTo(x2, CHART.padding.top - 10.0)
                context.lineTo(x2, CHART.padding.bottom + 10.0)
                context.stroke()

                descriptionText(x1, x2, dateFormat(last_date, grid))

                last_date = date
            }

            else if (stock_data.length == i + 1) {
                x1 = x2
                x2 = round(CHART.padding.left + vertical_space * stock_data.length) + 0.5

                descriptionText(x1, x2, dateFormat(date, grid))
            }
        }
    }

    // horizontal grid
    const horizontal_count = 5
    const horizontal_space = (CHART.padding.bottom - CHART.padding.top) / (horizontal_count - 1)

    for (let i = 0; i < horizontal_count; i++) {
        let y = round(CHART.padding.top + horizontal_space * i) + 0.5
        const text = reverseLogScale(y) ? Number(reverseLogScale(y)).toFixed(reverseLogScale(y) < 1000 ? 2 : 0) : ""

        context.lineWidth = 1
        context.strokeStyle = '#ddd'
        context.beginPath()
        context.moveTo(CHART.padding.left, y)
        context.lineTo(CHART.padding.right + 5, y)
        context.stroke()

        context.fillStyle = "#333"
        context.font = '12px "DejaVu Sans"'
        context.textAlign = "left"
        context.fillText(text, CHART.padding.right + 10.0, y + 4.0)
    }

    // volume bars

    for (let i = 0; i < stock_data.length; i++) {
        const e = stock_data[i]
        const vertical_space = (CHART.padding.right - CHART.padding.left) / (stock_data.length)
        let stroke_width = vertical_space > 7.0 ? 1.0 : 0.0

        let center = round(CHART.padding.left + vertical_space * (i + 0.5)) + 0.5
        let width = 2.0 + stroke_width
        let left = center - width / 2

        let vol_width = width + stroke_width * 2
        let vol_left = left - stroke_width

        let vol_top = linScale(e.volume) - stroke_width
        let vol_bottom = linScale(0) + stroke_width
        let vol_height = vol_bottom - vol_top

        context.fillStyle = "#eee"
        context.fillRect(vol_left, vol_top, vol_width, vol_height)
    }

    // candle bars

    for (let i = 0; i < stock_data.length; i++) {
        const e = stock_data[i]
        const vertical_space = (CHART.padding.right - CHART.padding.left) / (stock_data.length)

        let center = round(CHART.padding.left + vertical_space * (i + 0.5)) + 0.5
        let width = vertical_space > 7.0 ? 4.0 : 2.0
        let left = center - width / 2
        let right = left + width

        let minimum = logScale(e.low)
        let maximum = logScale(e.high)
        let top = logScale(max(e.close, e.open))
        let bottom = logScale(min(e.close, e.open))
        let height = ((bottom - top) > 1.0 ? bottom - top : 0.0)

        let highlight = i > 0 && stock_data[i].volume > stock_data[i-1].volume * 2.0
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