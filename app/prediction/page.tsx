'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import TickerSelector from '@/components/TickerSelector'
import { PAPER_RESULTS, TICKER_INFO } from '@/lib/constants'
import type { PredictionOutput, SentimentResult } from '@/types'

const PredictionCard = dynamic(() => import('@/components/PredictionCard'), { ssr: false })

interface PredictResult {
  prediction: PredictionOutput
  sentiment: SentimentResult
  newsUsed: Array<{ title: string; source: string; publishedAt: string }>
  indicators: {
    rsi: number
    macd: number
    macdSignal: number
    volatility: number
    lastSma20: number
    lastSma50: number
    lastClose: number
  }
  timestamp: string
}

function tomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export default function PredictionPage() {
  const [ticker, setTicker] = useState('AAPL')
  const [result, setResult] = useState<PredictResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { alpha, beta, gamma } = PAPER_RESULTS.ensembleWeights

  const runPrediction = useCallback(async () => {
    setLoading(true)
    setError(null)

    // Minimum 2.5s loading animation (simulates model inference)
    const [res] = await Promise.all([
      fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker }),
      }),
      new Promise((r) => setTimeout(r, 2500)),
    ])

    try {
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? 'Prediction failed')
      setResult(json)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }, [ticker])

  const info = TICKER_INFO[ticker]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Live Prediction Engine</h1>
        
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LEFT: Controls */}
        <div className="space-y-5">
          {/* Ticker */}
          <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-5">
            <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Select Ticker
            </label>
            <TickerSelector selected={ticker} onChange={(t) => { setTicker(t); setResult(null) }} />
            <p className="mt-3 text-sm text-gray-400">
              {info.name} · {info.exchange}
            </p>
            <p className="mt-1 text-xs text-gray-600">
              Predicting for: <span className="font-mono text-gray-400">{tomorrow()}</span>
            </p>
          </div>

          {/* Run button */}
          <button
            onClick={runPrediction}
            disabled={loading}
            className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Running ensemble inference…
              </span>
            ) : (
              '⚡ Run Prediction'
            )}
          </button>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Input features panel (shows after prediction) */}
          {(result || loading) && (
            <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-5">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Input Features
              </h3>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 rounded bg-[#1a1a1a]" />
                  ))}
                </div>
              ) : result ? (
                <div className="space-y-2">
                  {[
                    { label: 'Last Close Price', value: `$${result.indicators.lastClose.toFixed(2)}` },
                    { label: 'RSI (14)', value: result.indicators.rsi.toFixed(1) },
                    { label: 'MACD', value: result.indicators.macd.toFixed(4) },
                    { label: 'Sentiment Score', value: `${result.sentiment.sentimentScore}/100` },
                    { label: 'News Headlines Used', value: `${result.newsUsed.length}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between rounded-lg bg-[#0f0f0f] px-3 py-2">
                      <span className="text-xs text-gray-500">{label}</span>
                      <span className="font-finance text-xs font-medium text-gray-200">{value}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {/* Ensemble Weights */}
          <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Ensemble Architecture Weights
            </h3>
            <div className="space-y-3">
              {[
                { label: 'TLSTM (Temporal)', key: 'α', value: alpha, color: '#6366f1' },
                { label: 'LSTM (Trend)', key: 'β', value: beta, color: '#8b5cf6' },
                { label: 'XGBoost (Features)', key: 'γ', value: gamma, color: '#ec4899' },
              ].map(({ label, key, value, color }) => (
                <div key={label}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-gray-400">{label}</span>
                    <span className="font-finance" style={{ color }}>{key} = {value.toFixed(2)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#1f1f1f]">
                    <div
                      className="h-2 rounded-full transition-all duration-700"
                      style={{ width: `${value * 100}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-600">
              Weights optimized via Bayesian search on validation set (Section IV.B of paper)
            </p>
          </div>
        </div>

        {/* RIGHT: Output */}
        <div>
          {loading && (
            <div className="space-y-4">
              <Skeleton className="h-48 rounded-xl bg-[#1a1a1a]" />
              <Skeleton className="h-32 rounded-xl bg-[#1a1a1a]" />
              <Skeleton className="h-48 rounded-xl bg-[#1a1a1a]" />
            </div>
          )}
          {!loading && !result && (
            <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border border-dashed border-[#1f1f1f] text-center">
              <div>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-400">Select a ticker and click</p>
                <p className="text-sm text-gray-600">"Run Prediction" to see results</p>
              </div>
            </div>
          )}
          {!loading && result && (
            <PredictionCard
              prediction={result.prediction}
              sentiment={result.sentiment}
              newsUsed={result.newsUsed}
              perHeadline={result.sentiment.perHeadline}
              ticker={ticker}
              timestamp={result.timestamp}
            />
          )}
        </div>
      </div>
    </div>
  )
}
