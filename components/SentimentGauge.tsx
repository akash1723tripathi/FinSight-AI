'use client'

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'

interface SentimentGaugeProps {
  score: number // 0–100
  isLoading?: boolean
}

function getLabel(score: number): { text: string; color: string } {
  if (score < 34) return { text: 'BEARISH', color: '#ef4444' }
  if (score < 67) return { text: 'NEUTRAL', color: '#f59e0b' }
  return { text: 'BULLISH', color: '#10b981' }
}

export default function SentimentGauge({ score, isLoading }: SentimentGaugeProps) {
  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-xl bg-[#1a1a1a]" />
  }

  const { text, color } = getLabel(score)
  const clampedScore = Math.max(0, Math.min(100, score))

  // Semicircle gauge using a Pie with startAngle/endAngle
  // We split into: filled segment + empty segment (total = 100)
  const gaugeData = [
    { value: clampedScore },
    { value: 100 - clampedScore },
  ]

  // Color zones for background arc
  const bgData = [
    { value: 33, color: '#ef444422' },
    { value: 33, color: '#f59e0b22' },
    { value: 34, color: '#10b98122' },
  ]

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-36 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {/* Background zones */}
            <Pie
              data={bgData}
              cx="50%"
              cy="85%"
              startAngle={180}
              endAngle={0}
              innerRadius="60%"
              outerRadius="80%"
              dataKey="value"
              stroke="none"
            >
              {bgData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            {/* Filled score arc */}
            <Pie
              data={gaugeData}
              cx="50%"
              cy="85%"
              startAngle={180}
              endAngle={0}
              innerRadius="62%"
              outerRadius="78%"
              dataKey="value"
              stroke="none"
            >
              <Cell fill={color} />
              <Cell fill="transparent" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Center score text */}
        <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center">
          <span className="font-finance text-3xl font-bold" style={{ color }}>
            {Math.round(clampedScore)}
          </span>
          <span className="text-xs font-semibold tracking-widest" style={{ color }}>
            {text}
          </span>
        </div>
      </div>
      {/* Scale labels */}
      <div className="mt-1 flex w-full justify-between px-4 text-xs text-gray-600">
        <span>0 Bearish</span>
        <span>50 Neutral</span>
        <span>Bullish 100</span>
      </div>
    </div>
  )
}
