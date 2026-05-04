'use client'

import { Progress } from '@/components/ui/progress'
import type { PredictionOutput, SentimentResult, HeadlineSentiment } from '@/types'

interface PredictionCardProps {
  prediction: PredictionOutput
  sentiment: SentimentResult
  newsUsed: Array<{ title: string; source: string; publishedAt: string }>
  perHeadline?: HeadlineSentiment[]
  ticker: string
  timestamp: string
}

const SIGNAL_COLORS = {
  BUY: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/40' },
  SELL: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40' },
  HOLD: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/40' },
}

const SENTIMENT_BADGE: Record<string, string> = {
  positive: 'bg-green-500/20 text-green-400',
  negative: 'bg-red-500/20 text-red-400',
  neutral: 'bg-gray-500/20 text-gray-400',
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function tomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

export default function PredictionCard({
  prediction,
  sentiment,
  newsUsed,
  perHeadline,
  ticker,
  timestamp,
}: PredictionCardProps) {
  const sc = SIGNAL_COLORS[prediction.signal]

  return (
    <div className="space-y-4">
      {/* Main prediction card */}
      <div className={`rounded-xl border ${sc.border} ${sc.bg} p-6`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              {ticker} · Predicted for {tomorrow()}
            </p>
            <p className="font-finance mt-2 text-5xl font-bold text-white">
              ${prediction.predictedPrice.toFixed(2)}
            </p>
            <div className="mt-2 flex items-center gap-3">
              <span className={`text-lg font-bold ${prediction.direction === 'UP' ? 'text-green-400' : 'text-red-400'}`}>
                {prediction.direction === 'UP' ? '↑' : '↓'}
                {prediction.predictedChange >= 0 ? '+' : ''}
                {prediction.predictedChange.toFixed(2)}%
              </span>
            </div>
          </div>
          <div className={`rounded-lg border ${sc.border} px-4 py-2 text-center`}>
            <p className={`text-3xl font-bold ${sc.text}`}>{prediction.signal}</p>
            <p className="mt-0.5 text-xs text-gray-500">Signal</p>
          </div>
        </div>

        {/* Confidence bar */}
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-gray-500">
            <span>Confidence</span>
            <span className="font-mono">{prediction.confidence}%</span>
          </div>
          <Progress value={prediction.confidence} className="h-2 bg-[#1f1f1f]" />
        </div>

        <p className="mt-3 text-xs text-gray-600">
          Predicted at {formatTime(timestamp)} · Ensemble: TLSTM(0.51) + LSTM(0.30) + XGBoost(0.20) + FinBERT
        </p>
      </div>

      {/* Sentiment breakdown */}
      <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          FinBERT Sentiment Breakdown
        </h3>
        <div className="space-y-2">
          {[
            { label: 'Positive', value: sentiment.p_pos, color: '#10b981' },
            { label: 'Negative', value: sentiment.p_neg, color: '#ef4444' },
            { label: 'Neutral', value: sentiment.p_neu, color: '#6b7280' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="w-16 text-xs text-gray-500">{label}</span>
              <div className="h-2 flex-1 rounded-full bg-[#1f1f1f]">
                <div
                  className="h-2 rounded-full transition-all duration-700"
                  style={{ width: `${Math.round(value * 100)}%`, backgroundColor: color }}
                />
              </div>
              <span className="font-finance w-10 text-right text-xs text-gray-400">
                {Math.round(value * 100)}%
              </span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-right text-xs text-gray-600">
          Composite score: <span className="font-mono text-white">{sentiment.sentimentScore}/100</span>
        </p>
      </div>

      {/* News headlines */}
      <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Headlines Used ({newsUsed.length})
        </h3>
        <ul className="space-y-2">
          {newsUsed.slice(0, 5).map((h, i) => {
            const hl = perHeadline?.[i]
            return (
              <li key={i} className="flex items-start gap-2 rounded-lg bg-[#0f0f0f] p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-relaxed text-gray-300 line-clamp-2">{h.title}</p>
                  <p className="mt-1 text-xs text-gray-600">{h.source}</p>
                </div>
                {hl && (
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${SENTIMENT_BADGE[hl.sentiment]}`}>
                    {hl.sentiment}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
