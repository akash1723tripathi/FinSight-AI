'use client'

import { PAPER_RESULTS } from '@/lib/constants'
import type { ModelComparisonRow } from '@/types'

export default function ModelComparisonTable() {
  const rows = PAPER_RESULTS.modelComparison
  const baseline = rows[0]

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1f1f1f]">
            <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              Model
            </th>
            <th className="pb-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
              RMSE ↓
            </th>
            <th className="pb-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
              MAE ↓
            </th>
            <th className="pb-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
              R² ↑
            </th>
            <th className="pb-3 pl-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
              vs Baseline
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row: ModelComparisonRow, i) => {
            const isOurs = i === rows.length - 1
            const improvement = ((baseline.rmse - row.rmse) / baseline.rmse * 100).toFixed(1)
            const isBaselineRow = i === 0

            return (
              <tr
                key={row.model}
                className={`border-b border-[#1f1f1f] transition-colors ${
                  isOurs ? 'bg-indigo-500/10' : 'hover:bg-white/[0.02]'
                }`}
              >
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    {isOurs && <span className="text-base">🏆</span>}
                    <span className={`${isOurs ? 'font-semibold text-white' : 'text-gray-400'}`}>
                      {row.model}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-right font-mono">
                  <span className={isOurs ? 'font-bold text-green-400' : 'text-gray-300'}>
                    {row.rmse.toFixed(3)}
                    {isOurs && ' 🏆'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-mono">
                  <span className={isOurs ? 'font-bold text-green-400' : 'text-gray-300'}>
                    {row.mae.toFixed(3)}
                    {isOurs && ' 🏆'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-mono">
                  <span className={isOurs ? 'font-bold text-green-400' : 'text-gray-300'}>
                    {row.r2.toFixed(3)}
                    {isOurs && ' 🏆'}
                  </span>
                </td>
                <td className="py-3 pl-4 text-right">
                  {isBaselineRow ? (
                    <span className="text-xs text-gray-600">baseline</span>
                  ) : (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        parseFloat(improvement) > 0
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {parseFloat(improvement) > 0 ? '-' : ''}{improvement}% RMSE
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-gray-600">
        * Evaluated on AAPL test set · {PAPER_RESULTS.evaluationPeriod} · Lower RMSE = better
        &nbsp;·&nbsp; Our model: <span className="text-green-400">32.1% RMSE improvement</span> over LSTM baseline
      </p>
    </div>
  )
}
