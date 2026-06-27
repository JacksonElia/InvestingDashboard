interface BackendPrices {
  prices: Record<string, number | null>;
  names: Record<string, string | null>;
  timestamp: string;
}

// API URL - uses environment variable or defaults to relative path
const API_URL = import.meta.env.VITE_API_URL || '/api/stock-price';

// Local cache for prices on the client side
const priceCache = new Map<string, { price: number; name: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export interface StockInfo {
  price: number;
  name: string;
}

export async function fetchStockInfo(ticker: string): Promise<StockInfo> {
  const normalizedTicker = ticker.toUpperCase().trim();

  const cached = priceCache.get(normalizedTicker);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return { price: cached.price, name: cached.name };
  }

  try {
    const url = `${API_URL}?tickers=${encodeURIComponent(normalizedTicker)}`;
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    const data: BackendPrices = await response.json();
    const price = data.prices[normalizedTicker];
    const name = data.names?.[normalizedTicker] ?? normalizedTicker;

    if (typeof price !== 'number' || isNaN(price) || price <= 0) {
      throw new Error(`Invalid price value for ${normalizedTicker}: ${price}`);
    }

    priceCache.set(normalizedTicker, {
      price,
      name,
      timestamp: Date.now(),
    });

    return { price, name };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Unable to fetch price for ${normalizedTicker}: ${errorMessage}`, { cause: error });
  }
}

export async function fetchStockPrice(ticker: string): Promise<number> {
  const { price } = await fetchStockInfo(ticker);
  return price;
}

export async function fetchMultiplePrices(tickers: string[]): Promise<Map<string, number | null>> {
  const results = new Map<string, number | null>();
  const normalizedTickers = tickers.map(t => t.toUpperCase().trim());
  const tickerQuery = normalizedTickers.join(',');

  try {
    const url = `${API_URL}?tickers=${encodeURIComponent(tickerQuery)}`;
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    const data: BackendPrices = await response.json();

    // Cache all results and populate results map
    for (const ticker of normalizedTickers) {
      const price = data.prices[ticker] ?? null;
      if (price !== null) {
        priceCache.set(ticker, {
          price,
          name: data.names?.[ticker] ?? ticker,
          timestamp: Date.now(),
        });
      }
      results.set(ticker, price);
    }

    return results;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Return null for all tickers on error
    for (const ticker of normalizedTickers) {
      results.set(ticker, null);
    }

    throw new Error(`Unable to fetch prices: ${errorMessage}`, { cause: error });
  }
}

export function clearPriceCache(): void {
  priceCache.clear();
}

export function invalidateCachedPrice(ticker: string): void {
  const normalizedTicker = ticker.toUpperCase().trim();
  priceCache.delete(normalizedTicker);
}
