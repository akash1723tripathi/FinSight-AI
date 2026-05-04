import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: 'FinSight AI — Multi-modal Stock Prediction',
  description:
    'TLSTM + FinBERT + PPO ensemble stock prediction system.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-[#0a0a0a] text-white antialiased">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 lg:px-8">
          {children}
        </main>
        <footer className="border-t border-[#1f1f1f] py-6 text-center text-xs text-gray-600">
          JSS Academy of Technical Education · B.Tech CSE (Data Science) 2026 · Supervised by Ms. Anuradha Singh
        </footer>
      </body>
    </html>
  )
}
