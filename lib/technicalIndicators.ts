import type { StockDataPoint, TechnicalIndicators } from '@/types'

/** Simple Moving Average over `period` candles */
export function calculateSMA(prices: number[], period: number): number[] {
  return prices.map((_, i) => {
    if (i < period - 1) return NaN
    const slice = prices.slice(i - period + 1, i + 1)
    return slice.reduce((a, b) => a + b, 0) / period
  })
}

/** Exponential Moving Average — standard EMA with smoothing = 2/(period+1) */
export function calculateEMA(prices: number[], period: number): number[] {
  const k = 2 / (period + 1)
  const ema: number[] = new Array(prices.length).fill(NaN)

  // Seed with first SMA
  const seed = prices.slice(0, period).reduce((a, b) => a + b, 0) / period
  ema[period - 1] = seed

  for (let i = period; i < prices.length; i++) {
    ema[i] = prices[i] * k + ema[i - 1] * (1 - k)
  }
  return ema
}

/** RSI (14-period by default) — returns 0–100 */
export function calculateRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50

  const changes = prices.slice(1).map((p, i) => p - prices[i])
  let gains = 0
  let losses = 0

  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) gains += changes[i]
    else losses -= changes[i]
  }

  let avgGain = gains / period
  let avgLoss = losses / period

  for (let i = period; i < changes.length; i++) {
    const gain = changes[i] > 0 ? changes[i] : 0
    const loss = changes[i] < 0 ? -changes[i] : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
  }

  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

/** MACD: EMA12 − EMA26 with EMA9 signal line */
export function calculateMACD(prices: number[]): {
  macd: number
  signal: number
  histogram: number
  macdLine: number[]
  signalLine: number[]
} {
  const ema12 = calculateEMA(prices, 12)
  const ema26 = calculateEMA(prices, 26)

  const macdLine = ema12.map((v, i) =>
    isNaN(v) || isNaN(ema26[i]) ? NaN : v - ema26[i]
  )

  const validMacd = macdLine.filter((v) => !isNaN(v))
  const signalFull = calculateEMA(validMacd, 9)

  // Re-align signal line to original indices
  const signalLine: number[] = new Array(prices.length).fill(NaN)
  const offset = macdLine.findIndex((v) => !isNaN(v))
  signalFull.forEach((v, i) => {
    signalLine[offset + i] = v
  })

  const lastMacd = macdLine.findLast((v) => !isNaN(v)) ?? 0
  const lastSignal = signalLine.findLast((v) => !isNaN(v)) ?? 0

  return {
    macd: lastMacd,
    signal: lastSignal,
    histogram: lastMacd - lastSignal,
    macdLine,
    signalLine,
  }
}

/** Bollinger Bands: SMA20 ± 2σ */
export function calculateBollingerBands(
  prices: number[],
  period = 20
): { upper: number[]; middle: number[]; lower: number[] } {
  const middle = calculateSMA(prices, period)
  const upper: number[] = []
  const lower: number[] = []

  prices.forEach((_, i) => {
    if (i < period - 1) {
      upper.push(NaN)
      lower.push(NaN)
      return
    }
    const slice = prices.slice(i - period + 1, i + 1)
    const mean = middle[i]
    const variance = slice.reduce((acc, p) => acc + (p - mean) ** 2, 0) / period
    const std = Math.sqrt(variance)
    upper.push(mean + 2 * std)
    lower.push(mean - 2 * std)
  })

  return { upper, middle, lower }
}

/** Rolling standard deviation of log returns over `period` days */
export function calculateVolatility(prices: number[], period = 20): number {
  if (prices.length < period + 1) return 0.02

  const returns = prices.slice(1).map((p, i) => Math.log(p / prices[i]))
  const recent = returns.slice(-period)
  const mean = recent.reduce((a, b) => a + b, 0) / period
  const variance = recent.reduce((acc, r) => acc + (r - mean) ** 2, 0) / period
  return Math.sqrt(variance)
}

/** On-Balance Volume */
export function calculateOBV(prices: number[], volumes: number[]): number[] {
  const obv: number[] = [0]
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > prices[i - 1]) obv.push(obv[i - 1] + volumes[i])
    else if (prices[i] < prices[i - 1]) obv.push(obv[i - 1] - volumes[i])
    else obv.push(obv[i - 1])
  }
  return obv
}

/** Compute all indicators from a OHLCV array */
export function computeAllIndicators(data: StockDataPoint[]): TechnicalIndicators {
  const closes = data.map((d) => d.close)
  const volumes = data.map((d) => d.volume)

  const sma20 = calculateSMA(closes, 20)
  const sma50 = calculateSMA(closes, 50)
  const ema12 = calculateEMA(closes, 12)
  const ema26 = calculateEMA(closes, 26)
  const { upper, middle, lower } = calculateBollingerBands(closes, 20)
  const { macd, signal, histogram } = calculateMACD(closes)
  const rsi = calculateRSI(closes, 14)
  const volatility = calculateVolatility(closes, 20)
  const obv = calculateOBV(closes, volumes)

  return {
    rsi,
    macd,
    macdSignal: signal,
    macdHistogram: histogram,
    sma20,
    sma50,
    ema12,
    ema26,
    bollingerUpper: upper,
    bollingerMiddle: middle,
    bollingerLower: lower,
    volatility,
    obv,
  }
}
