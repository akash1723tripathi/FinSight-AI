'use client'

import { Skeleton } from '@/components/ui/skeleton'

interface TechnicalIndicatorsProps {
  rsi?: number
  macd?: number
  macdSignal?: number
  volatility?: number
  lastClose?: number
  lastSma20?: number
  lastSma50?: number
  isLoading?: boolean
}

function RSIBar({ value }: { value: number }) {
  const color = value > 70 ? '#ef4444' : value < 30 ? '#10b981' : '#f59e0b'
  return (
    <div className="mt-1 h-1.5 w-full rounded-full bg-[#1f1f1f]">
      <div
        className="h-1.5 rounded-full transition-all duration-500"
        style={{ width: `${value}%`, backgroundColor: color }}
      />
    </div>
  )
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-[#0f0f0f] p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      <p className="font-finance mt-1 text-lg font-bold text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-600">{sub}</p>}
    </div>
  )
}

export default function TechnicalIndicators({
  rsi,
  macd,
  macdSignal,
  volatility,
  lastClose,
  lastSma20,
  lastSma50,
  isLoading,
}: TechnicalIndicatorsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg bg-[#1a1a1a]" />
        ))}
      </div>
    )
  }

  const rsiColor = (rsi ?? 50) > 70 ? 'text-red-400' : (rsi ?? 50) < 30 ? 'text-green-400' : 'text-yellow-400'
  const rsiLabel = (rsi ?? 50) > 70 ? 'Overbought' : (rsi ?? 50) < 30 ? 'Oversold' : 'Neutral'
  const macdBullish = (macd ?? 0) > (macdSignal ?? 0)
  const smaAbove = lastClose != null && lastSma20 != null && lastClose > lastSma20

  return (
    <div className="space-y-3">
      {/* RSI with bar */}
      <div className="rounded-lg bg-[#0f0f0f] p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">RSI (14)</p>
          <span className={`text-xs font-medium ${rsiColor}`}>{rsiLabel}</span>
        </div>
        <p className={`font-finance mt-1 text-lg font-bold ${rsiColor}`}>
          {rsi?.toFixed(1) ?? '—'}
        </p>
        <RSIBar value={rsi ?? 50} />
      </div>

      {/* MACD */}
      <div className="rounded-lg bg-[#0f0f0f] p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">MACD</p>
        <p className={`font-finance mt-1 text-lg font-bold ${macdBullish ? 'text-green-400' : 'text-red-400'}`}>
          {macd?.toFixed(3) ?? '—'}
        </p>
        <p className="mt-0.5 text-xs text-gray-600">
          Signal: <span className="font-mono">{macdSignal?.toFixed(3) ?? '—'}</span>
          {macdBullish ? ' · Bullish cross' : ' · Bearish cross'}
        </p>
      </div>

      {/* Volatility */}
      <Metric
        label="Volatility (20d)"
        value={volatility != null ? `${(volatility * 100).toFixed(2)}%` : '—'}
        sub="Daily std of log returns"
      />

      {/* SMA Status */}
      <div className="rounded-lg bg-[#0f0f0f] p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">SMA Trend</p>
        <p className={`font-finance mt-1 text-lg font-bold ${smaAbove ? 'text-green-400' : 'text-red-400'}`}>
          {smaAbove ? 'Above SMA20' : 'Below SMA20'}
        </p>
        <p className="mt-0.5 text-xs text-gray-600">
          SMA20: <span className="font-mono">${lastSma20?.toFixed(2) ?? '—'}</span>
          {' · '}
          SMA50: <span className="font-mono">${lastSma50?.toFixed(2) ?? '—'}</span>
        </p>
      </div>
    </div>
  )
}
