// Direct imports — avoids HTTP self-calls which fail in serverless environments
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { default: YahooFinance } = require('yahoo-finance2')
const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical'] })

import { computeAllIndicators } from '@/lib/technicalIndicators'
import { generatePrediction } from '@/lib/ensembleModel'
import { FALLBACK_SENTIMENT, FALLBACK_HEADLINES, TICKER_INFO } from '@/lib/constants'
import type { StockDataPoint } from '@/types'

function getStartDate(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}

async function fetchRecentStock(ticker: string): Promise<StockDataPoint[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any[] = await yahooFinance.historical(ticker, {
    period1: getStartDate(90),
    period2: new Date(),
    interval: '1d',
  })
  return result
    .filter((d) => d.close != null && d.open != null)
    .map((d) => ({
      date: new Date(d.date).toISOString().split('T')[0],
      open: d.open as number,
      high: (d.high ?? 0) as number,
      low: (d.low ?? 0) as number,
      close: d.close as number,
      volume: (d.volume ?? 0) as number,
    }))
}

async function fetchNews(ticker: string) {
  const companyMap: Record<string, string> = {
    AAPL: 'Apple Inc stock',
    GOOGL: 'Alphabet Google stock',
    TSLA: 'Tesla stock',
  }
  const query = companyMap[ticker] ?? ticker

  try {
    if (!process.env.NEWSAPI_KEY) throw new Error('NEWSAPI_KEY not set')
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${process.env.NEWSAPI_KEY}`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) throw new Error(`NewsAPI ${res.status}`)
    const data = await res.json()
    if (!data.articles?.length) throw new Error('No articles')
    return { headlines: data.articles.map((a: { title: string; source: { name: string }; publishedAt: string }) => ({
      title: a.title,
      source: a.source.name,
      publishedAt: a.publishedAt,
    })) }
  } catch {
    return { headlines: FALLBACK_HEADLINES[ticker] ?? FALLBACK_HEADLINES['AAPL'], fallback: true }
  }
}

type HFLabel = 'positive' | 'negative' | 'neutral'
type HFScores = Array<{ label: HFLabel; score: number }>

// Call HF for a single text — more reliable than batch on free tier
async function callFinBERT(text: string, token: string): Promise<HFScores | null> {
  const tryOnce = async (): Promise<HFScores | null> => {
    const res = await fetch(
      'https://router.huggingface.co/hf-inference/models/ProsusAI/finbert',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: text }),
        signal: AbortSignal.timeout(25000),
      }
    )
    if (!res.ok) return null
    const json = await res.json()

    // Model still loading → { error: "...", estimated_time: N }
    if (!Array.isArray(json)) {
      if (json?.estimated_time) {
        // Wait estimated time + buffer then retry once
        const wait = Math.min((json.estimated_time as number) * 1000 + 2000, 25000)
        await new Promise((r) => setTimeout(r, wait))
        return tryOnce()
      }
      return null
    }

    // HF returns [[{label, score}, ...]] for single input — unwrap if needed
    const scores = Array.isArray(json[0]) ? json[0] : json
    return scores as HFScores
  }
  return tryOnce()
}

async function fetchSentiment(texts: string[]) {
  if (!texts.length) return FALLBACK_SENTIMENT
  if (!process.env.HF_TOKEN) return FALLBACK_SENTIMENT

  const token = process.env.HF_TOKEN
  const sliced = texts.slice(0, 5)

  try {
    // Run per-headline — parallel but each is a single text (most reliable on free tier)
    const results = await Promise.all(sliced.map((t) => callFinBERT(t, token)))

    const valid = results.filter((r): r is HFScores => r !== null)
    if (!valid.length) return FALLBACK_SENTIMENT

    let pos = 0, neg = 0, neu = 0
    valid.forEach((scores) => {
      scores.forEach(({ label, score }) => {
        if (label === 'positive') pos += score
        else if (label === 'negative') neg += score
        else neu += score
      })
    })

    const total = pos + neg + neu || 1
    const agg = { positive: pos / total, negative: neg / total, neutral: neu / total }
    const sentimentScore = (agg.positive - agg.negative + 1) / 2 * 100

    const perHeadline = sliced.map((title, i) => {
      const scores = results[i]
      if (!scores) return { title, source: '', publishedAt: new Date().toISOString(), sentiment: 'neutral' as HFLabel, confidence: 50 }
      const best = scores.reduce((a, b) => a.score > b.score ? a : b)
      return { title, source: '', publishedAt: new Date().toISOString(), sentiment: best.label, confidence: Math.round(best.score * 100) }
    })

    return {
      p_pos: Math.round(agg.positive * 1000) / 1000,
      p_neg: Math.round(agg.negative * 1000) / 1000,
      p_neu: Math.round(agg.neutral * 1000) / 1000,
      sentimentScore: Math.round(sentimentScore),
      perHeadline,
    }
  } catch {
    return FALLBACK_SENTIMENT
  }
}

export async function POST(request: Request) {
  const { ticker = 'AAPL' } = await request.json()
  const safeT = (ticker as string).toUpperCase()

  try {
    const stockData = await fetchRecentStock(safeT)
    if (!stockData?.length) throw new Error('No stock data returned')

    const indicators = computeAllIndicators(stockData)
    const newsResult = await fetchNews(safeT)
    const titles: string[] = (newsResult.headlines ?? []).slice(0, 5).map(
      (h: { title: string }) => h.title
    )
    const sentiment = await fetchSentiment(titles)

    const lastClose = stockData[stockData.length - 1].close
    const prediction = generatePrediction({
      lastClose,
      rsi: indicators.rsi,
      macd: indicators.macd,
      macdSignal: indicators.macdSignal,
      sma20: indicators.sma20,
      sma50: indicators.sma50,
      sentimentScore: sentiment.sentimentScore ?? 50,
      volatility: indicators.volatility,
    })

    return Response.json({
      ticker: safeT,
      tickerInfo: TICKER_INFO[safeT],
      prediction,
      indicators: {
        rsi: Math.round(indicators.rsi * 100) / 100,
        macd: Math.round(indicators.macd * 1000) / 1000,
        macdSignal: Math.round(indicators.macdSignal * 1000) / 1000,
        volatility: Math.round(indicators.volatility * 10000) / 10000,
        lastSma20: indicators.sma20.filter((v) => !isNaN(v)).at(-1),
        lastSma50: indicators.sma50.filter((v) => !isNaN(v)).at(-1),
        lastClose,
      },
      sentiment,
      newsUsed: (newsResult.headlines ?? []).slice(0, 5),
      recentPrices: stockData.slice(-30).map((d) => ({ date: d.date, close: d.close })),
      modelWeights: { alpha: 0.51, beta: 0.30, gamma: 0.20 },
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[predict API]', err)
    return Response.json({ error: 'Prediction failed', details: String(err) }, { status: 500 })
  }
}
