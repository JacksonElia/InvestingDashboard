import YahooFinance from 'yahoo-finance2';

interface StockQuoteCache {
  price: number;
  name: string;
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000;
const cache = new Map<string, StockQuoteCache>();

export interface StockLookupResult {
  prices: Record<string, number | null>;
  names: Record<string, string | null>;
}

function getCompanyName(
  quote: Record<string, unknown>,
  ticker: string
): string {
  const longName = typeof quote.longName === 'string' ? quote.longName : null;
  const shortName = typeof quote.shortName === 'string' ? quote.shortName : null;
  const displayName = typeof quote.displayName === 'string' ? quote.displayName : null;
  const symbol = typeof quote.symbol === 'string' ? quote.symbol : null;

  return (
    longName ??
    shortName ??
    displayName ??
    symbol ??
    ticker
  );
}

export async function lookupStockData(tickers: string[]): Promise<StockLookupResult> {
  const prices: Record<string, number | null> = {};
  const names: Record<string, string | null> = {};
  const yahooFinance = new YahooFinance();

  await Promise.all(
    tickers.map(async (ticker) => {
      const normalizedTicker = ticker.toUpperCase().trim();
      const cached = cache.get(normalizedTicker);

      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        prices[normalizedTicker] = cached.price;
        names[normalizedTicker] = cached.name;
        return;
      }

      try {
        const quote = await yahooFinance.quote(normalizedTicker);
        const price = quote.regularMarketPrice ? parseFloat(String(quote.regularMarketPrice)) : null;
        const name = getCompanyName(quote as Record<string, unknown>, normalizedTicker);

        if (price !== null) {
          cache.set(normalizedTicker, { price, name, timestamp: Date.now() });
        }

        prices[normalizedTicker] = price;
        names[normalizedTicker] = name;
      } catch {
        prices[normalizedTicker] = null;
        names[normalizedTicker] = null;
      }
    })
  );

  return { prices, names };
}
