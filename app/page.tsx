'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import TickerSelector from '@/components/TickerSelector'
import TechnicalIndicators from '@/components/TechnicalIndicators'
import { TICKER_INFO, PAPER_RESULTS } from '@/lib/constants'
import { computeAllIndicators } from '@/lib/technicalIndicators'
import type { StockDataPoint, SentimentResult } from '@/types'

const StockChart = dynamic(() => import('@/components/StockChart'), { ssr: false })
const SentimentGauge = dynamic(() => import('@/components/SentimentGauge'), { ssr: false })

interface DashboardData {
  stockData: StockDataPoint[]
  sentiment: SentimentResult | null
  indicators: ReturnType<typeof computeAllIndicators> | null
}

function SignalBadge({ signal, confidence }: { signal: string; confidence?: number }) {
  const config = {
    BUY: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
    SELL: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
    HOLD: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  }[signal] ?? { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' }

  return (
    <div className={`rounded-xl border ${config.bg} ${config.border} p-4 text-center`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Signal</p>
      <p className={`mt-2 text-4xl font-bold ${config.text}`}>{signal}</p>
      {confidence != null && (
        <p className="mt-1 text-sm text-gray-500">Confidence: {confidence}%</p>
      )}
    </div>
  )
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      <p className="font-finance mt-2 text-2xl font-bold" style={{ color: color ?? '#fff' }}>{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-600">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const [ticker, setTicker] = useState('AAPL')
  const [data, setData] = useState<DashboardData>({ stockData: [], sentiment: null, indicators: null })
  const [loading, setLoading] = useState(true)
  const [signal, setSignal] = useState<{ label: string; confidence: number } | null>(null)

  const fetchData = useCallback(async (t: string) => {
    setLoading(true)
    try {
      // Fetch stock data and news in parallel
      const [stockRes, newsRes] = await Promise.all([
        fetch(`/api/stock?ticker=${t}&period=6mo`),
        fetch(`/api/news?ticker=${t}`),
      ])

      const stockJson = await stockRes.json()
      const newsJson = await newsRes.json()

      const stockData: StockDataPoint[] = stockJson.data ?? []
      const indicators = stockData.length > 0 ? computeAllIndicators(stockData) : null

      // Sentiment from headlines
      const titles = (newsJson.headlines ?? []).slice(0, 5).map((h: { title: string }) => h.title)
      const sentRes = await fetch('/api/sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: titles }),
      })
      const sentJson = await sentRes.json()

      // Derive a quick signal from indicators + sentiment
      let derivedSignal = 'HOLD'
      let confidence = 60
      if (indicators) {
        const rsi = indicators.rsi
        const macdBull = indicators.macd > indicators.macdSignal
        const sentBull = sentJson.sentimentScore > 55
        const sentBear = sentJson.sentimentScore < 45
        if (rsi < 35 || (macdBull && sentBull)) { derivedSignal = 'BUY'; confidence = 68 }
        else if (rsi > 70 || (!macdBull && sentBear)) { derivedSignal = 'SELL'; confidence = 65 }
        else { derivedSignal = 'HOLD'; confidence = 58 }
      }

      setData({ stockData, sentiment: sentJson, indicators })
      setSignal({ label: derivedSignal, confidence })
    } catch (err) {
      console.error('Dashboard fetch error', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(ticker)
  }, [ticker, fetchData])

  const info = TICKER_INFO[ticker]
  const lastPrice = data.stockData.at(-1)?.close
  const prevPrice = data.stockData.at(-2)?.close
  const priceChange = lastPrice && prevPrice ? ((lastPrice - prevPrice) / prevPrice) * 100 : null
  const volume = data.stockData.at(-1)?.volume

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="rounded-2xl border border-[#1f1f1f] bg-gradient-to-br from-[#111111] to-[#0d0d0d] p-8">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Multi-modal Stock Prediction System</h1>
            <p className="mt-1 text-sm text-gray-400">
              TLSTM + FinBERT + PPO Ensemble 
            </p>
          </div>
          <div className="flex gap-3 text-xs text-gray-600">
            <span className="rounded-full border border-[#1f1f1f] px-3 py-1">Technical Indicators Data</span>
            <span className="rounded-full border border-[#1f1f1f] px-3 py-1">Live Data</span>
            <span className="rounded-full border border-[#1f1f1f] px-3 py-1">FinBERT Sentiment</span>
          </div>
        </div>
      </div>

      {/* Ticker Selector */}
      <TickerSelector selected={ticker} onChange={setTicker} />

      {/* Stock Chart */}
      <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              {info.name} · {info.exchange}
            </h2>
            {!loading && lastPrice && (
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-finance text-3xl font-bold text-white">${lastPrice.toFixed(2)}</span>
                {priceChange != null && (
                  <span className={`text-sm font-medium ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                  </span>
                )}
              </div>
            )}
          </div>
          <span className="text-xs text-gray-600">6-Month History</span>
        </div>
        <StockChart
          data={data.stockData}
          isLoading={loading}
          color={info.color}
          ticker={ticker}
        />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {loading ? (
          <>
            <Skeleton className="h-28 rounded-xl bg-[#1a1a1a]" />
            <Skeleton className="h-28 rounded-xl bg-[#1a1a1a]" />
            <Skeleton className="h-28 rounded-xl bg-[#1a1a1a]" />
          </>
        ) : (
          <>
            <StatCard
              label="Current Price"
              value={lastPrice ? `$${lastPrice.toFixed(2)}` : '—'}
              sub={priceChange != null ? `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}% today` : undefined}
              color={info.color}
            />
            <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">FinBERT Sentiment</p>
              <SentimentGauge score={data.sentiment?.sentimentScore ?? 50} />
            </div>
            <SignalBadge signal={signal?.label ?? 'HOLD'} confidence={signal?.confidence} />
          </>
        )}
      </div>

      {/* Technical Indicators */}
      <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Technical Indicators</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TechnicalIndicators
            rsi={data.indicators?.rsi}
            macd={data.indicators?.macd}
            macdSignal={data.indicators?.macdSignal}
            volatility={data.indicators?.volatility}
            lastClose={lastPrice}
            lastSma20={data.indicators?.sma20.filter((v) => !isNaN(v)).at(-1)}
            lastSma50={data.indicators?.sma50.filter((v) => !isNaN(v)).at(-1)}
            isLoading={loading}
          />
          <div className="space-y-3">
            <StatCard
              label="Volume"
              value={volume ? (volume / 1_000_000).toFixed(1) + 'M' : '—'}
              sub="Latest session"
            />
            <StatCard
              label="52W High / Low"
              value={
                data.stockData.length > 0
                  ? `$${Math.max(...data.stockData.map((d) => d.high)).toFixed(0)} / $${Math.min(...data.stockData.map((d) => d.low)).toFixed(0)}`
                  : '—'
              }
              sub="Based on loaded data"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
