'use client'

import { useState } from 'react'
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { calculateSMA, calculateEMA, calculateBollingerBands } from '@/lib/technicalIndicators'
import type { StockDataPoint } from '@/types'

interface StockChartProps {
  data: StockDataPoint[]
  isLoading?: boolean
  color?: string
  ticker?: string
}

type IndicatorKey = 'sma20' | 'sma50' | 'ema12' | 'ema26' | 'bbUpper' | 'bbLower'

const INDICATORS: { key: IndicatorKey; label: string; color: string; dash?: string }[] = [
  { key: 'sma20',    label: 'SMA 20',   color: '#3b82f6', dash: '5 3' },
  { key: 'sma50',    label: 'SMA 50',   color: '#8b5cf6', dash: '8 4' },
  { key: 'ema12',    label: 'EMA 12',   color: '#f59e0b', dash: '3 2' },
  { key: 'ema26',    label: 'EMA 26',   color: '#ec4899', dash: '6 3' },
  { key: 'bbUpper',  label: 'BB Upper', color: '#10b981', dash: '4 4' },
  { key: 'bbLower',  label: 'BB Lower', color: '#10b981', dash: '4 4' },
]

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-[#2f2f2f] bg-[#1a1a1a] p-3 shadow-xl text-xs">
      <p className="mb-2 font-semibold text-gray-300">{label}</p>
      {payload.map((entry) =>
        entry.value != null ? (
          <div key={entry.name} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-400">{entry.name}:</span>
            <span className="font-mono text-white">${Number(entry.value).toFixed(2)}</span>
          </div>
        ) : null
      )}
    </div>
  )
}

export default function StockChart({ data, isLoading, color = '#6366f1', ticker }: StockChartProps) {
  const [active, setActive] = useState<Set<IndicatorKey>>(new Set(['sma20', 'sma50']))

  const toggle = (key: IndicatorKey) => {
    setActive((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (isLoading) return <Skeleton className="h-[420px] w-full rounded-xl bg-[#1a1a1a]" />
  if (!data?.length) return (
    <div className="flex h-[420px] items-center justify-center text-gray-500">No data available</div>
  )

  const closes  = data.map((d) => d.close)
  const sma20r  = calculateSMA(closes, 20)
  const sma50r  = calculateSMA(closes, 50)
  const ema12r  = calculateEMA(closes, 12)
  const ema26r  = calculateEMA(closes, 26)
  const { upper: bbU, lower: bbL } = calculateBollingerBands(closes, 20)

  const chartData = data.map((d, i) => ({
    date:    formatDate(d.date),
    close:   d.close,
    sma20:   isNaN(sma20r[i])  ? null : +sma20r[i].toFixed(2),
    sma50:   isNaN(sma50r[i])  ? null : +sma50r[i].toFixed(2),
    ema12:   isNaN(ema12r[i])  ? null : +ema12r[i].toFixed(2),
    ema26:   isNaN(ema26r[i])  ? null : +ema26r[i].toFixed(2),
    bbUpper: isNaN(bbU[i])     ? null : +bbU[i].toFixed(2),
    bbLower: isNaN(bbL[i])     ? null : +bbL[i].toFixed(2),
  }))

  const tickInterval = Math.max(1, Math.floor(chartData.length / 8))

  return (
    <div className="space-y-3">
      {/* Toggle pills */}
      <div className="flex flex-wrap gap-2">
        {INDICATORS.map(({ key, label, color: c }) => {
          const on = active.has(key)
          return (
            <button
              key={key}
              onClick={() => toggle(key)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                on
                  ? 'border-transparent text-white'
                  : 'border-[#2a2a2a] text-gray-600 hover:text-gray-400'
              }`}
              style={on ? { backgroundColor: c + '30', borderColor: c + '60', color: c } : {}}
            >
              <span
                className="inline-block h-2 w-3 rounded-sm"
                style={{ backgroundColor: on ? c : '#2a2a2a' }}
              />
              {label}
            </button>
          )
        })}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#1f1f1f' }}
            interval={tickInterval}
          />
          <YAxis
            tickFormatter={(v) => `$${v.toFixed(0)}`}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={60}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af', paddingTop: '8px' }} />

          {/* Price — always visible */}
          <Line
            type="monotone"
            dataKey="close"
            name={ticker ? `${ticker} Close` : 'Close Price'}
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: color }}
          />

          {/* Toggleable indicators */}
          {INDICATORS.map(({ key, label, color: c, dash }) =>
            active.has(key) ? (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={label}
                stroke={c}
                strokeWidth={1.5}
                strokeDasharray={dash}
                dot={false}
                connectNulls
              />
            ) : null
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
