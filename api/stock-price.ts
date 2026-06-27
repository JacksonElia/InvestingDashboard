import type { VercelRequest, VercelResponse } from '@vercel/node';
import { lookupStockData } from '../src/lib/stockPriceLookup';

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
    const results = await lookupStockData(tickerList);
    res.status(200).json({
      prices: results.prices,
      names: results.names,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: `Unable to fetch prices: ${errorMessage}`,
    });
  }
}
