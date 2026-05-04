import type { PredictionOutput } from '@/types'

interface EnsembleInput {
  lastClose: number
  rsi: number
  macd: number
  macdSignal: number
  sma20: number[]
  sma50: number[]
  sentimentScore: number // 0–100 from real FinBERT
  volatility: number
}

/** TLSTM component: temporal momentum signal */
function calculateMomentumSignal(data: EnsembleInput): number {
  const { rsi, macd, macdSignal, sma20, sma50, lastClose } = data

  // RSI deviation from neutral (50)
  const rsiSignal = (rsi - 50) / 500

  // MACD crossover strength
  const macdCross = (macd - macdSignal) / lastClose

  // Price vs SMA trend — use last valid SMA values
  const lastSma20 = sma20.filter((v) => !isNaN(v)).at(-1) ?? lastClose
  const lastSma50 = sma50.filter((v) => !isNaN(v)).at(-1) ?? lastClose
  const smaSignal = (lastClose - lastSma20) / lastClose * 0.5 +
                    (lastSma20 - lastSma50) / lastSma20 * 0.5

  return rsiSignal * 0.4 + macdCross * 0.3 + smaSignal * 0.3
}

/** LSTM component: trend continuation signal */
function calculateTrendSignal(data: EnsembleInput): number {
  const { rsi, sma20, sma50, lastClose } = data

  const lastSma20 = sma20.filter((v) => !isNaN(v)).at(-1) ?? lastClose
  const lastSma50 = sma50.filter((v) => !isNaN(v)).at(-1) ?? lastClose

  // Golden/death cross indicator
  const crossSignal = lastSma20 > lastSma50 ? 0.002 : -0.002

  // RSI overbought/oversold mean reversion dampener
  const rsiFactor = rsi > 70 ? -0.001 : rsi < 30 ? 0.001 : 0

  return crossSignal + rsiFactor
}

/** XGBoost component: feature interaction signal */
function calculateFeatureSignal(data: EnsembleInput): number {
  const { rsi, macd, volatility, lastClose, sma20 } = data
  const lastSma20 = sma20.filter((v) => !isNaN(v)).at(-1) ?? lastClose

  // Bollinger position proxy — where price sits relative to SMA
  const bbPosition = (lastClose - lastSma20) / lastSma20

  // Momentum-volatility interaction: high momentum in low-vol = stronger signal
  const volAdjustedMacd = volatility > 0 ? (macd / lastClose) / volatility : 0

  // RSI-MACD agreement
  const agreement = rsi > 55 && macd > 0 ? 0.002 : rsi < 45 && macd < 0 ? -0.002 : 0

  return bbPosition * 0.4 + volAdjustedMacd * 0.001 + agreement * 0.6
}

/** Confidence: higher when signals agree and volatility is reasonable */
function calculateConfidence(data: EnsembleInput, ensembleSignal: number): number {
  const { rsi, volatility, sentimentScore } = data

  // Signal strength (absolute value, capped)
  const signalStrength = Math.min(Math.abs(ensembleSignal) * 1000, 40)

  // Sentiment conviction (distance from neutral 50)
  const sentimentConviction = Math.abs(sentimentScore - 50) * 0.4

  // RSI in clear territory (not 40–60 zone)
  const rsiClarity = (rsi > 65 || rsi < 35) ? 10 : 0

  // Penalty for high volatility
  const volPenalty = Math.min(volatility * 200, 15)

  const raw = 50 + signalStrength + sentimentConviction + rsiClarity - volPenalty
  return Math.max(45, Math.min(92, raw))
}

function deriveSignal(ensembleSignal: number, sentimentScore: number): 'BUY' | 'SELL' | 'HOLD' {
  // Sentiment bias — weighted at 30% of the combined signal
  // sentimentScore 0-100 → bias range roughly -0.03 to +0.03
  const sentimentBias = (sentimentScore - 50) / 167

  const combined = ensembleSignal * 0.70 + sentimentBias * 0.30

  // Hard overrides: strongly negative/positive sentiment overrules weak technical signal
  if (sentimentScore < 35 && ensembleSignal < 0.008) return 'SELL'
  if (sentimentScore > 65 && ensembleSignal > -0.008) return 'BUY'

  if (combined > 0.004) return 'BUY'
  if (combined < -0.004) return 'SELL'
  return 'HOLD'
}

/** Main inference function — weighted ensemble of simulated TLSTM + LSTM + XGBoost */
export function generatePrediction(data: EnsembleInput): PredictionOutput {
  const tlstmSignal = calculateMomentumSignal(data)
  const lstmSignal = calculateTrendSignal(data)
  const xgboostSignal = calculateFeatureSignal(data)

  // Ensemble weights from paper (Section IV.B) — sum = 1.00
  const ensembleSignal =
    0.50 * tlstmSignal +
    0.30 * lstmSignal +
    0.20 * xgboostSignal

  // FinBERT sentiment modifier — scales contribution based on real API output
  const sentimentModifier = (data.sentimentScore - 50) / 500

  const predictedChange = ensembleSignal + sentimentModifier
  const predictedPrice = data.lastClose * (1 + predictedChange)

  const confidence = calculateConfidence(data, ensembleSignal)
  const signal = deriveSignal(ensembleSignal, data.sentimentScore)

  return {
    predictedPrice: Math.round(predictedPrice * 100) / 100,
    predictedChange: Math.round(predictedChange * 10000) / 100, // as percentage
    direction: predictedChange >= 0 ? 'UP' : 'DOWN',
    confidence: Math.round(confidence),
    signal,
    tlstmComponent: Math.round(tlstmSignal * 100000) / 100000,
    lstmComponent: Math.round(lstmSignal * 100000) / 100000,
    xgboostComponent: Math.round(xgboostSignal * 100000) / 100000,
  }
}
