'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import ModelComparisonTable from '@/components/ModelComparisonTable'
import { PAPER_RESULTS, TICKER_INFO } from '@/lib/constants'
import { buildBacktestSeries, computeRMSE, COVID_TIMELINE } from '@/lib/backtestData'
import type { StockDataPoint } from '@/types'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts'

const BacktestChart = dynamic(() => import('@/components/BacktestChart'), { ssr: false })

function MetricCard({
  label,
  value,
  sub,
  color,
  highlight,
}: {
  label: string
  value: string
  sub?: string
  color?: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-6 text-center ${
        highlight
          ? 'border-indigo-500/40 bg-indigo-500/10'
          : 'border-[#1f1f1f] bg-[#111111]'
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      <p className="font-finance mt-3 text-4xl font-bold" style={{ color: color ?? '#fff' }}>
        {value}
      </p>
      {sub && <p className="mt-2 text-xs text-gray-500">{sub}</p>}
    </div>
  )
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
      {payload.map((e) => (
        <div key={e.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: e.color }} />
          <span className="text-gray-400">{e.name}:</span>
          <span className="font-mono text-white">{e.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function ResultsPage() {
  const [backtestTicker, setBacktestTicker] = useState('AAPL')
  const [backtestData, setBacktestData] = useState<Array<{ date: string; actual: number; predicted: number }>>([])
  const [backtestLoading, setBacktestLoading] = useState(true)
  const [computedRMSE, setComputedRMSE] = useState<number | null>(null)

  useEffect(() => {
    setBacktestLoading(true)
    fetch(`/api/stock?ticker=${backtestTicker}&period=1y`)
      .then((r) => r.json())
      .then((json) => {
        const stockData: StockDataPoint[] = json.data ?? []
        const series = buildBacktestSeries(stockData)
        const rmse = computeRMSE(
          series.map((s) => s.actual),
          series.map((s) => s.predicted)
        )
        setBacktestData(series)
        setComputedRMSE(rmse)
      })
      .catch(() => setBacktestData([]))
      .finally(() => setBacktestLoading(false))
  }, [backtestTicker])

  const tradingData = PAPER_RESULTS.tradingPerformance.map((r) => ({
    name: r.strategy.replace('Proposed Multi-modal PPO Agent', 'Our PPO Agent').replace('Standard LSTM Trader', 'LSTM Trader'),
    'Total Return (%)': r.totalReturn,
    fill: r.strategy.includes('Proposed') ? '#6366f1' : r.strategy.includes('LSTM') ? '#8b5cf6' : '#4b5563',
  }))

  const ablationSharpe = [
    { name: 'w/ Sentiment\n(Proposed)', value: PAPER_RESULTS.ablationStudy.withSentiment.sharpe, fill: '#6366f1' },
    { name: 'w/o Sentiment', value: PAPER_RESULTS.ablationStudy.withoutSentiment.sharpe, fill: '#4b5563' },
    { name: 'w/o Transductive', value: PAPER_RESULTS.ablationStudy.withoutTransductive.sharpe, fill: '#4b5563' },
  ]

  const ablationRMSE = [
    { name: 'Full Model\n(Proposed)', value: PAPER_RESULTS.ablationStudy.withSentiment.rmse, fill: '#10b981' },
    { name: 'w/o Sentiment', value: PAPER_RESULTS.ablationStudy.withoutSentiment.rmse, fill: '#4b5563' },
    { name: 'w/o Transductive', value: PAPER_RESULTS.ablationStudy.withoutTransductive.rmse, fill: '#4b5563' },
  ]

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Model Evaluation & Backtesting Results</h1>
        <p className="mt-1 text-sm text-gray-400">
          Evaluated on AAPL, GOOGL, TSLA test sets · {PAPER_RESULTS.evaluationPeriod}
        </p>
      </div>

      {/* Section 1: Predictive Performance */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-indigo-500/20 text-xs font-bold text-indigo-400">1</span>
          Predictive Performance
        </h2>
        <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-6">
          <ModelComparisonTable />
        </div>
      </section>

      {/* Section 2: Backtest Chart */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-indigo-500/20 text-xs font-bold text-indigo-400">2</span>
            Backtest: Predicted vs Actual
          </h2>
          <div className="flex gap-1 rounded-lg border border-[#1f1f1f] bg-[#111111] p-1">
            {Object.keys(TICKER_INFO).map((t) => (
              <button
                key={t}
                onClick={() => setBacktestTicker(t)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  backtestTicker === t
                    ? 'text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
                style={
                  backtestTicker === t
                    ? { backgroundColor: TICKER_INFO[t].color + '33', color: TICKER_INFO[t].color }
                    : {}
                }
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-6">
          {backtestLoading ? (
            <Skeleton className="h-[380px] rounded-xl bg-[#1a1a1a]" />
          ) : (
            <BacktestChart
              data={backtestData}
              rmse={computedRMSE ?? 2.341}
              color={TICKER_INFO[backtestTicker].color}
            />
          )}
        </div>
      </section>

      {/* Section 3: Trading Strategy Performance */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-indigo-500/20 text-xs font-bold text-indigo-400">3</span>
          Trading Strategy Performance (2015–2025)
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard
            label="PPO Agent Total Return"
            value="315.6%"
            sub="vs 210.4% Buy-and-Hold"
            color="#10b981"
            highlight
          />
          <MetricCard label="Sharpe Ratio" value="2.45" sub="Risk-adjusted return" color="#6366f1" />
          <MetricCard label="Max Drawdown" value="-12.4%" sub="Lowest point from peak" color="#f59e0b" />
        </div>

        <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-6">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Strategy Comparison — Total Return (%)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={tradingData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                formatter={(v) => [`${v}%`, 'Total Return']}
                contentStyle={{ background: '#1a1a1a', border: '1px solid #2f2f2f', borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="Total Return (%)" radius={[6, 6, 0, 0]}>
                {tradingData.map((entry, i) => (
                  <rect key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 grid grid-cols-3 gap-4 text-center text-xs text-gray-500">
            {PAPER_RESULTS.tradingPerformance.map((r) => (
              <div key={r.strategy} className="space-y-1">
                <p className="font-medium text-gray-400">{r.strategy.replace('Proposed Multi-modal PPO Agent', 'Our PPO Agent')}</p>
                <p>Return: <span className="font-mono text-white">{r.totalReturn}%</span></p>
                <p>Sharpe: <span className="font-mono text-white">{r.sharpe}</span></p>
                <p>Drawdown: <span className="font-mono text-red-400">{r.maxDrawdown}%</span></p>
                {r.winRate && <p>Win Rate: <span className="font-mono text-white">{r.winRate}%</span></p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Ablation Study */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-indigo-500/20 text-xs font-bold text-indigo-400">4</span>
          Ablation Study
        </h2>

        {/* Key finding callout */}
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4">
          <p className="text-sm font-medium text-indigo-300">
            💡 Key Finding: FinBERT sentiment module contributes{' '}
            <span className="font-bold text-white">+45.8% Sharpe improvement</span> (2.45 vs 1.68) and
            transductive LSTM weighting reduces RMSE by{' '}
            <span className="font-bold text-white">17.8%</span> (2.341 vs 2.850)
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-5">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Sharpe Ratio Comparison
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ablationSharpe} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 3]} />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #2f2f2f', borderRadius: 8, fontSize: 12 }}
                />
                <ReferenceLine y={2.45} stroke="#6366f1" strokeDasharray="4 2" strokeWidth={1} />
                <Bar dataKey="value" name="Sharpe" radius={[4, 4, 0, 0]}>
                  {ablationSharpe.map((entry, i) => (
                    <rect key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-5">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
              RMSE Comparison (lower = better)
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ablationRMSE} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 4]} />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #2f2f2f', borderRadius: 8, fontSize: 12 }}
                />
                <ReferenceLine y={2.341} stroke="#10b981" strokeDasharray="4 2" strokeWidth={1} />
                <Bar dataKey="value" name="RMSE" radius={[4, 4, 0, 0]}>
                  {ablationRMSE.map((entry, i) => (
                    <rect key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Section 5: COVID-19 Case Study */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-indigo-500/20 text-xs font-bold text-indigo-400">5</span>
          COVID-19 Crash Case Study (Feb–Apr 2020)
        </h2>
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-sm text-yellow-300">
          📌 System correctly switched to <strong>Sell/Hold</strong> on Feb 24, 2020 as FinBERT detected negative
          news sentiment — protecting portfolio from the subsequent 36% market crash.
        </div>
        <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={COVID_TIMELINE} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#1f1f1f' }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} domain={[55, 115]} />
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid #2f2f2f', borderRadius: 8, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
              <ReferenceLine x="2020-02-24" stroke="#f59e0b" strokeDasharray="4 2" label={{ value: 'Sell signal', fill: '#f59e0b', fontSize: 10 }} />
              <Bar dataKey="portfolioValue" name="PPO Agent Portfolio" fill="#6366f1" radius={[2, 2, 0, 0]} />
              <Bar dataKey="buyHoldValue" name="Buy-and-Hold" fill="#374151" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-2 text-xs text-gray-600 text-center">
            Portfolio value indexed to 100 at Feb 3, 2020
          </p>
        </div>
      </section>
    </div>
  )
}
