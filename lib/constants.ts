import type { ModelComparisonRow, TradingPerformanceRow } from '@/types'

export const PAPER_RESULTS = {
  modelComparison: [
    { model: 'Standard LSTM (Price Only)', rmse: 3.452, mae: 2.120, r2: 0.824 },
    { model: 'XGBoost Regressor', rmse: 3.105, mae: 1.984, r2: 0.851 },
    { model: 'Hybrid LSTM + VADER', rmse: 2.850, mae: 1.755, r2: 0.887 },
    { model: 'Proposed Multi-modal (FinBERT + TLSTM)', rmse: 2.341, mae: 1.428, r2: 0.942 },
  ] as ModelComparisonRow[],

  tradingPerformance: [
    { strategy: 'Buy-and-Hold', totalReturn: 210.4, annualReturn: 12.1, sharpe: 1.20, maxDrawdown: -33.9, winRate: null },
    { strategy: 'Standard LSTM Trader', totalReturn: 245.8, annualReturn: 13.5, sharpe: 1.55, maxDrawdown: -28.2, winRate: 54.2 },
    { strategy: 'Proposed Multi-modal PPO Agent', totalReturn: 315.6, annualReturn: 16.8, sharpe: 2.45, maxDrawdown: -12.4, winRate: 63.7 },
  ] as TradingPerformanceRow[],

  ablationStudy: {
    withSentiment: { sharpe: 2.45, maxDrawdown: -12.4, rmse: 2.341 },
    withoutSentiment: { sharpe: 1.68, maxDrawdown: -18.5, rmse: 2.341 },
    withoutTransductive: { sharpe: 1.95, maxDrawdown: -22.1, rmse: 2.850 },
  },

  ensembleWeights: { alpha: 0.50, beta: 0.30, gamma: 0.20 },

  evaluationPeriod: 'January 2015 – January 2025',
  testStocks: ['AAPL', 'GOOGL', 'TSLA'],
}

export const TICKER_INFO: Record<string, { name: string; exchange: string; color: string }> = {
  AAPL: { name: 'Apple Inc.', exchange: 'NASDAQ', color: '#6366f1' },
  GOOGL: { name: 'Alphabet Inc.', exchange: 'NASDAQ', color: '#8b5cf6' },
  TSLA: { name: 'Tesla Inc.', exchange: 'NASDAQ', color: '#ec4899' },
}

export const FALLBACK_HEADLINES: Record<string, Array<{ title: string; source: string; publishedAt: string }>> = {
  AAPL: [
    { title: 'Apple Reports Strong Q4 Earnings, Revenue Beats Estimates', source: 'Reuters', publishedAt: new Date().toISOString() },
    { title: 'iPhone 16 Sales Exceed Analyst Projections in Q1', source: 'Bloomberg', publishedAt: new Date().toISOString() },
    { title: 'Apple Vision Pro Drives New Growth in Wearables Segment', source: 'CNBC', publishedAt: new Date().toISOString() },
    { title: 'Apple Services Revenue Hits Record High This Quarter', source: 'Reuters', publishedAt: new Date().toISOString() },
    { title: 'Apple Expands AI Features Across iOS 18 Product Line', source: 'TechCrunch', publishedAt: new Date().toISOString() },
  ],
  GOOGL: [
    { title: 'Alphabet Beats Revenue Estimates on Strong Ad Spending', source: 'Reuters', publishedAt: new Date().toISOString() },
    { title: 'Google Cloud Growth Accelerates to 28% Year-over-Year', source: 'Bloomberg', publishedAt: new Date().toISOString() },
    { title: 'Alphabet AI Division Gemini Shows Strong Enterprise Adoption', source: 'CNBC', publishedAt: new Date().toISOString() },
    { title: 'Google Search Market Share Remains Dominant at 91%', source: 'Reuters', publishedAt: new Date().toISOString() },
    { title: 'YouTube Premium Subscribers Cross 100 Million Milestone', source: 'TechCrunch', publishedAt: new Date().toISOString() },
  ],
  TSLA: [
    { title: 'Tesla Q4 Deliveries Beat Analyst Estimates by Wide Margin', source: 'Reuters', publishedAt: new Date().toISOString() },
    { title: 'Tesla Full Self-Driving Subscription Revenue Grows 40%', source: 'Bloomberg', publishedAt: new Date().toISOString() },
    { title: 'Tesla Gigafactory Texas Reaches Record Production Capacity', source: 'CNBC', publishedAt: new Date().toISOString() },
    { title: 'Tesla Energy Storage Business Posts Record Revenue Quarter', source: 'Reuters', publishedAt: new Date().toISOString() },
    { title: 'Tesla Model Y Remains Best-Selling Electric Vehicle Globally', source: 'TechCrunch', publishedAt: new Date().toISOString() },
  ],
}

export const FALLBACK_SENTIMENT = {
  p_pos: 0.33,
  p_neg: 0.27,
  p_neu: 0.40,
  sentimentScore: 53,
  perHeadline: [],
}
