import YahooFinance from 'yahoo-finance2';

interface StockQuoteCache {
  price: number;
  name: string;
  timestamp: number;
}

interface QuoteResult {
  regularMarketPrice?: number | string | null;
  longName?: string | null;
  shortName?: string | null;
  displayName?: string | null;
  symbol?: string | null;
}

const CACHE_DURATION = 5 * 60 * 1000;
const cache = new Map<string, StockQuoteCache>();

export interface StockLookupResult {
  prices: Record<string, number | null>;
  names: Record<string, string | null>;
}

function getCompanyName(
  quote: QuoteResult,
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

  const yahooFinance = new YahooFinance({
    suppressNotices: ['yahooSurvey'],
  });

  const normalizedTickers = Array.from(
    new Set(
      tickers
        .map((ticker) => ticker.toUpperCase().trim())
        .filter((ticker) => ticker.length > 0)
    )
  );

  const uncachedTickers: string[] = [];

  for (const ticker of normalizedTickers) {
    const cached = cache.get(ticker);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      prices[ticker] = cached.price;
      names[ticker] = cached.name;
      continue;
    }

    uncachedTickers.push(ticker);
  }

  if (uncachedTickers.length > 0) {
    try {
      const quotes = await yahooFinance.quote(uncachedTickers, {
        return: 'object',
        fields: ['symbol', 'regularMarketPrice', 'longName', 'shortName', 'displayName'],
      });

      for (const ticker of uncachedTickers) {
        const quote = quotes[ticker] as QuoteResult | undefined;
        const priceValue = quote?.regularMarketPrice;
        const price = typeof priceValue === 'number' ? priceValue : Number(priceValue);
        const name = quote ? getCompanyName(quote, ticker) : ticker;

        if (Number.isFinite(price) && price > 0) {
          cache.set(ticker, { price, name, timestamp: Date.now() });
          prices[ticker] = price;
          names[ticker] = name;
          continue;
        }

        prices[ticker] = null;
        names[ticker] = name;
      }
    } catch {
      for (const ticker of uncachedTickers) {
        prices[ticker] = null;
        names[ticker] = ticker;
      }
    }
  }

  return { prices, names };
}
