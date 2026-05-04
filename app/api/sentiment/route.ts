import { FALLBACK_SENTIMENT } from '@/lib/constants'
import type { HeadlineSentiment } from '@/types'

type HFLabel = 'positive' | 'negative' | 'neutral'
type HFScores = Array<{ label: HFLabel; score: number }>

async function callFinBERT(text: string, token: string): Promise<HFScores | null> {
  const tryOnce = async (): Promise<HFScores | null> => {
    const res = await fetch(
      'https://router.huggingface.co/hf-inference/models/ProsusAI/finbert',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: text }),
        signal: AbortSignal.timeout(25000),
      }
    )
    if (!res.ok) return null
    const json = await res.json()

    // Model loading → retry after estimated time
    if (!Array.isArray(json)) {
      if (json?.estimated_time) {
        const wait = Math.min((json.estimated_time as number) * 1000 + 2000, 25000)
        await new Promise((r) => setTimeout(r, wait))
        return tryOnce()
      }
      return null
    }

    // HF returns [[{label,score},...]] for single input — unwrap if nested
    const scores = Array.isArray(json[0]) ? json[0] : json
    return scores as HFScores
  }
  return tryOnce()
}

export async function POST(request: Request) {
  const body = await request.json()
  const texts: string[] = body.texts ?? []

  if (!texts.length || !process.env.HF_TOKEN) {
    return Response.json({ ...FALLBACK_SENTIMENT })
  }

  const token = process.env.HF_TOKEN
  const sliced = texts.slice(0, 5)

  try {
    const results = await Promise.all(sliced.map((t) => callFinBERT(t, token)))
    const valid = results.filter((r): r is HFScores => r !== null)

    if (!valid.length) return Response.json({ ...FALLBACK_SENTIMENT })

    let pos = 0, neg = 0, neu = 0
    valid.forEach((scores) => {
      scores.forEach(({ label, score }) => {
        if (label === 'positive') pos += score
        else if (label === 'negative') neg += score
        else neu += score
      })
    })

    const total = pos + neg + neu || 1
    const agg = { positive: pos / total, negative: neg / total, neutral: neu / total }
    const sentimentScore = (agg.positive - agg.negative + 1) / 2 * 100

    const perHeadline: HeadlineSentiment[] = sliced.map((title, i) => {
      const scores = results[i]
      if (!scores) return { title, source: '', publishedAt: new Date().toISOString(), sentiment: 'neutral' as HFLabel, confidence: 50 }
      const best = scores.reduce((a, b) => a.score > b.score ? a : b)
      return { title, source: '', publishedAt: new Date().toISOString(), sentiment: best.label, confidence: Math.round(best.score * 100) }
    })

    return Response.json({
      p_pos: Math.round(agg.positive * 1000) / 1000,
      p_neg: Math.round(agg.negative * 1000) / 1000,
      p_neu: Math.round(agg.neutral * 1000) / 1000,
      sentimentScore: Math.round(sentimentScore),
      perHeadline,
    })
  } catch (err) {
    console.warn('[sentiment API] error:', err)
    return Response.json({ ...FALLBACK_SENTIMENT })
  }
}
