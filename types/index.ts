export interface StockDataPoint {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface TechnicalIndicators {
  rsi: number
  macd: number
  macdSignal: number
  macdHistogram: number
  sma20: number[]
  sma50: number[]
  ema12: number[]
  ema26: number[]
  bollingerUpper: number[]
  bollingerMiddle: number[]
  bollingerLower: number[]
  volatility: number
  obv: number[]
}

export interface SentimentResult {
  p_pos: number
  p_neg: number
  p_neu: number
  sentimentScore: number // 0-100
  perHeadline: HeadlineSentiment[]
}

export interface HeadlineSentiment {
  title: string
  source: string
  publishedAt: string
  sentiment: 'positive' | 'negative' | 'neutral'
  confidence: number
}

export interface PredictionOutput {
  predictedPrice: number
  predictedChange: number // percentage
  direction: 'UP' | 'DOWN'
  confidence: number // 0-100
  signal: 'BUY' | 'SELL' | 'HOLD'
  tlstmComponent: number
  lstmComponent: number
  xgboostComponent: number
}

export interface ModelComparisonRow {
  model: string
  rmse: number
  mae: number
  r2: number
}

export interface TradingPerformanceRow {
  strategy: string
  totalReturn: number
  annualReturn: number
  sharpe: number
  maxDrawdown: number
  winRate: number | null
}
