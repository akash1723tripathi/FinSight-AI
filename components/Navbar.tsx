'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/prediction', label: 'Prediction' },
  { href: '/results', label: 'Results' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1f1f1f] bg-[#0a0a0a]/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-purple-600">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <span className="text-sm font-bold text-white">FinSight AI</span>
        </Link>

        {/* Center Nav */}
        <div className="hidden items-center gap-1 sm:flex">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </div>


        {/* Mobile nav */}
        <div className="flex items-center gap-1 sm:hidden">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                  active ? 'text-indigo-400' : 'text-gray-400'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
