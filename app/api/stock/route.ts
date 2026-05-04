// yahoo-finance2 v3 requires instantiation with `new YahooFinance()`
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { default: YahooFinance } = require('yahoo-finance2')
const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical'] })

import type { StockDataPoint } from '@/types'

function getStartDate(period: string): Date {
  const now = new Date()
  const map: Record<string, number> = {
    '1mo': 30,
    '3mo': 90,
    '6mo': 180,
    '1y': 365,
    '2y': 730,
  }
  const days = map[period] ?? 180
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ticker = (searchParams.get('ticker') || 'AAPL').toUpperCase()
  const period = searchParams.get('period') || '6mo'

  try {
    const result = await yahooFinance.historical(ticker, {
      period1: getStartDate(period),
      period2: new Date(),
      interval: '1d',
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: StockDataPoint[] = (result as any[])
      .filter((d) => d.close != null && d.open != null)
      .map((d) => ({
        date: new Date(d.date).toISOString().split('T')[0],
        open: d.open as number,
        high: (d.high ?? 0) as number,
        low: (d.low ?? 0) as number,
        close: d.close as number,
        volume: (d.volume ?? 0) as number,
      }))

    return Response.json({ ticker, period, data })
  } catch (err) {
    console.error('[stock API]', err)
    return Response.json(
      { error: 'Failed to fetch stock data', ticker },
      { status: 500 }
    )
  }
}
