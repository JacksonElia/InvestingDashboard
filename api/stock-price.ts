import type { VercelRequest, VercelResponse } from '@vercel/node';
import YahooFinance from 'yahoo-finance2';

interface PriceCache {
  price: number;
  timestamp: number;
}

interface CacheStore {
  [key: string]: PriceCache;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache: CacheStore = {};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { tickers } = req.query;

  if (!tickers || typeof tickers !== 'string') {
    res.status(400).json({
      error: 'tickers query parameter is required (comma-separated)',
    });
    return;
  }

  const tickerList = tickers
    .split(',')
    .map((t) => t.trim().toUpperCase())
    .filter((t) => t.length > 0);

  if (tickerList.length === 0) {
    res.status(400).json({
      error: 'At least one ticker is required',
    });
    return;
  }

  try {
    const yahooFinance = new YahooFinance();
    const results: Record<string, number | null> = {};

    // Fetch all prices in parallel
    const promises = tickerList.map(async (ticker) => {
      const cached = cache[ticker];
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return { ticker, price: cached.price };
      }

      try {
        const quote = await yahooFinance.quote(ticker);
        const price = quote.regularMarketPrice
          ? parseFloat(String(quote.regularMarketPrice))
          : null;
        
        if (price !== null) {
          cache[ticker] = { price, timestamp: Date.now() };
        }
        
        return { ticker, price };
      } catch {
        return { ticker, price: null };
      }
    });

    const fetchResults = await Promise.all(promises);

    for (const { ticker, price } of fetchResults) {
      results[ticker] = price;
    }

    res.status(200).json({
      prices: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: `Unable to fetch prices: ${errorMessage}`,
    });
  }
}
