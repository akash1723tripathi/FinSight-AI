'use client'

import { TICKER_INFO } from '@/lib/constants'

interface TickerSelectorProps {
  selected: string
  onChange: (ticker: string) => void
  variant?: 'tabs' | 'dropdown'
}

export default function TickerSelector({ selected, onChange, variant = 'tabs' }: TickerSelectorProps) {
  const tickers = Object.keys(TICKER_INFO)

  if (variant === 'dropdown') {
    return (
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[#1f1f1f] bg-[#111111] px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
      >
        {tickers.map((t) => (
          <option key={t} value={t}>
            {t} — {TICKER_INFO[t].name}
          </option>
        ))}
      </select>
    )
  }

  return (
    <div className="flex gap-1 rounded-lg border border-[#1f1f1f] bg-[#111111] p-1">
      {tickers.map((t) => {
        const isActive = selected === t
        return (
          <button
            key={t}
            onClick={() => onChange(t)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-300'
            }`}
            style={isActive ? { backgroundColor: TICKER_INFO[t].color + '33', color: TICKER_INFO[t].color } : {}}
          >
            {t}
          </button>
        )
      })}
    </div>
  )
}
