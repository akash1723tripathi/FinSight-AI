import { FALLBACK_HEADLINES } from '@/lib/constants'

const COMPANY_MAP: Record<string, string> = {
  AAPL: 'Apple Inc stock',
  GOOGL: 'Alphabet Google stock',
  TSLA: 'Tesla stock',
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ticker = (searchParams.get('ticker') || 'AAPL').toUpperCase()
  const query = COMPANY_MAP[ticker] ?? ticker

  try {
    if (!process.env.NEWSAPI_KEY) throw new Error('NEWSAPI_KEY not set')

    const res = await fetch(
      `https://newsapi.org/v2/everything?` +
        `q=${encodeURIComponent(query)}&` +
        `language=en&` +
        `sortBy=publishedAt&` +
        `pageSize=10&` +
        `apiKey=${process.env.NEWSAPI_KEY}`,
      { next: { revalidate: 1800 } } // cache 30 min
    )

    if (!res.ok) throw new Error(`NewsAPI ${res.status}`)

    const data = await res.json()

    if (!data.articles?.length) throw new Error('No articles returned')

    const headlines = data.articles.map((a: {
      title: string
      description: string | null
      publishedAt: string
      source: { name: string }
    }) => ({
      title: a.title,
      description: a.description ?? '',
      publishedAt: a.publishedAt,
      source: a.source.name,
    }))

    return Response.json({ ticker, headlines })
  } catch (err) {
    console.warn('[news API] falling back to static data:', err)
    return Response.json({
      ticker,
      headlines: FALLBACK_HEADLINES[ticker] ?? FALLBACK_HEADLINES['AAPL'],
      fallback: true,
    })
  }
}
