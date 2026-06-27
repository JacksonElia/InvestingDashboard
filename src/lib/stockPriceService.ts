interface PriceCache {
  price: number;
  timestamp: number;
}

interface BackendPrice {
  ticker: string;
  price: number;
  timestamp: string;
}

interface BackendPrices {
  prices: Record<string, number | null>;
  timestamp: string;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const priceCache = new Map<string, PriceCache>();

// Backend API base URL - adjust based on your environment
const API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:3001'
  : '/api';

export async function fetchStockPrice(ticker: string): Promise<number> {
  const normalizedTicker = ticker.toUpperCase().trim();

  console.log(`[stockPriceService] Fetching price for ${normalizedTicker}`);

  // Check cache first
  const cached = priceCache.get(normalizedTicker);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`[stockPriceService] Using cached price for ${normalizedTicker}: $${cached.price}`);
    return cached.price;
  }

  try {
    const url = `${API_BASE_URL}/api/price/${normalizedTicker}`;
    console.log(`[stockPriceService] Calling backend: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    const data: BackendPrice = await response.json();
    const price = data.price;

    if (typeof price !== 'number' || isNaN(price) || price <= 0) {
      throw new Error(`Invalid price value for ${normalizedTicker}: ${price}`);
    }

    console.log(`[stockPriceService] Successfully fetched price for ${normalizedTicker}: $${price}`);

    // Cache the result
    priceCache.set(normalizedTicker, {
      price,
      timestamp: Date.now(),
    });

    return price;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[stockPriceService] Failed to fetch price for ${normalizedTicker}:`, errorMessage);
    throw new Error(`Unable to fetch price for ${normalizedTicker}: ${errorMessage}`, { cause: error });
  }
}

export async function fetchMultiplePrices(tickers: string[]): Promise<Map<string, number | null>> {
  const results = new Map<string, number | null>();

  console.log(`[stockPriceService] Fetching prices for ${tickers.length} tickers:`, tickers);

  const normalizedTickers = tickers.map(t => t.toUpperCase().trim());
  const tickerQuery = normalizedTickers.join(',');

  try {
    const url = `${API_BASE_URL}/api/prices?tickers=${encodeURIComponent(tickerQuery)}`;
    console.log(`[stockPriceService] Calling backend: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    const data: BackendPrices = await response.json();

    // Cache all results
    for (const [ticker, price] of Object.entries(data.prices)) {
      if (price !== null) {
        priceCache.set(ticker, {
          price,
          timestamp: Date.now(),
        });
      }
      results.set(ticker, price);
    }

    console.log(`[stockPriceService] Price fetch complete. Results:`, Object.fromEntries(results));

    return results;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[stockPriceService] Failed to fetch multiple prices:`, errorMessage);

    // Return null for all tickers on error
    for (const ticker of normalizedTickers) {
      results.set(ticker, null);
    }

    return results;
  }
}

export function clearPriceCache(): void {
  console.log('[stockPriceService] Clearing price cache');
  priceCache.clear();
}

export function invalidateCachedPrice(ticker: string): void {
  const normalizedTicker = ticker.toUpperCase().trim();
  console.log(`[stockPriceService] Invalidating cached price for ${normalizedTicker}`);
  priceCache.delete(normalizedTicker);
}
