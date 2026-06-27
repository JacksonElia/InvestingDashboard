import YahooFinance from 'yahoo-finance2';

interface PriceCache {
  price: number;
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const priceCache = new Map<string, PriceCache>();
const yahooFinance = new YahooFinance();

export async function fetchStockPrice(ticker: string): Promise<number> {
  const normalizedTicker = ticker.toUpperCase().trim();

  // Check cache first
  const cached = priceCache.get(normalizedTicker);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.price;
  }

  try {
    const result = await yahooFinance.quote(normalizedTicker);

    // Check if the price data is available
    if (!result.regularMarketPrice || result.regularMarketPrice === null) {
      throw new Error(`No price data found for ticker: ${normalizedTicker}`);
    }

    const price = parseFloat(String(result.regularMarketPrice));

    // Cache the result
    priceCache.set(normalizedTicker, {
      price,
      timestamp: Date.now(),
    });

    return price;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch stock price';
    throw new Error(`Unable to fetch price for ${normalizedTicker}: ${errorMessage}`);
  }
}

export async function fetchMultiplePrices(tickers: string[]): Promise<Map<string, number | null>> {
  const results = new Map<string, number | null>();
  
  // Fetch all prices in parallel
  const promises = tickers.map(async (ticker) => {
    const normalizedTicker = ticker.toUpperCase().trim();
    try {
      const price = await fetchStockPrice(normalizedTicker);
      return { ticker: normalizedTicker, price };
    } catch {
      // Return null for failed fetches - don't break others
      return { ticker: normalizedTicker, price: null };
    }
  });

  const fetchResults = await Promise.all(promises);
  
  // Populate results map
  for (const { ticker, price } of fetchResults) {
    results.set(ticker, price);
  }
  
  return results;
}

export function clearPriceCache(): void {
  priceCache.clear();
}

export function invalidateCachedPrice(ticker: string): void {
  priceCache.delete(ticker.toUpperCase().trim());
}
