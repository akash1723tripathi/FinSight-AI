'use client'

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

interface BacktestPoint {
  date: string
  actual: number
  predicted: number
}

interface BacktestChartProps {
  data: BacktestPoint[]
  rmse?: number
  isLoading?: boolean
  color?: string
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
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-400">{entry.name}:</span>
          <span className="font-mono text-white">${entry.value?.toFixed(2)}</span>
        </div>
      ))}
      {payload.length === 2 && (
        <div className="mt-1 border-t border-[#2f2f2f] pt-1 text-gray-500">
          Δ: ${Math.abs(payload[0].value - payload[1].value).toFixed(2)}
        </div>
      )}
    </div>
  )
}

export default function BacktestChart({ data, rmse, isLoading, color = '#6366f1' }: BacktestChartProps) {
  if (isLoading) {
    return <Skeleton className="h-[350px] w-full rounded-xl bg-[#1a1a1a]" />
  }

  if (!data?.length) {
    return (
      <div className="flex h-[350px] items-center justify-center rounded-xl bg-[#111111] text-gray-500">
        No backtest data available
      </div>
    )
  }

  const tickInterval = Math.max(1, Math.floor(data.length / 8))

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-gray-500">Predicted vs Actual closing prices on held-out test set</span>
        {rmse != null && (
          <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-mono text-indigo-400">
            RMSE: {rmse.toFixed(3)}
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
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
          <Line
            type="monotone"
            dataKey="actual"
            name="Actual Price"
            stroke="#e5e7eb"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="predicted"
            name="Predicted Price"
            stroke={color}
            strokeWidth={1.5}
            strokeDasharray="6 3"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
