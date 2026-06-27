interface StockQuoteCache {
  price: number;
  name: string;
  timestamp: number;
}

interface NasdaqQuoteResponse {
  data?: {
    symbol?: string | null;
    companyName?: string | null;
    primaryData?: {
      lastSalePrice?: string | null;
    } | null;
  } | null;
}

const CACHE_DURATION = 5 * 60 * 1000;
const cache = new Map<string, StockQuoteCache>();
const NASDAQ_HEADERS = {
  Accept: 'application/json, text/plain, */*',
  'User-Agent': 'Mozilla/5.0',
  Origin: 'https://www.nasdaq.com',
  Referer: 'https://www.nasdaq.com/',
};

export interface StockLookupResult {
  prices: Record<string, number | null>;
  names: Record<string, string | null>;
}

function getCompanyName(
  quote: NasdaqQuoteResponse,
  ticker: string
): string {
  const data = quote.data ?? null;
  const companyName = typeof data?.companyName === 'string' ? data.companyName : null;
  const symbol = typeof data?.symbol === 'string' ? data.symbol : null;

  return companyName ?? symbol ?? ticker;
}

export async function lookupStockData(tickers: string[]): Promise<StockLookupResult> {
  const prices: Record<string, number | null> = {};
  const names: Record<string, string | null> = {};

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
    const quoteResults = await Promise.allSettled(
      uncachedTickers.map(async (ticker) => {
        const response = await fetch(
          `https://api.nasdaq.com/api/quote/${encodeURIComponent(ticker)}/info?assetclass=stocks`,
          {
            headers: NASDAQ_HEADERS,
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return (await response.json()) as NasdaqQuoteResponse;
      })
    );

    for (let index = 0; index < uncachedTickers.length; index += 1) {
      const ticker = uncachedTickers[index];
      const result = quoteResults[index];

      if (result.status !== 'fulfilled') {
        prices[ticker] = null;
        names[ticker] = ticker;
        continue;
      }

      const quote = result.value;
      const priceText = quote.data?.primaryData?.lastSalePrice ?? null;
      const parsedPrice =
        typeof priceText === 'string'
          ? Number(priceText.replace(/[$,]/g, ''))
          : Number.NaN;
      const name = getCompanyName(quote, ticker);

      if (Number.isFinite(parsedPrice) && parsedPrice > 0) {
        cache.set(ticker, { price: parsedPrice, name, timestamp: Date.now() });
        prices[ticker] = parsedPrice;
        names[ticker] = name;
        continue;
      }

      prices[ticker] = null;
      names[ticker] = name;
    }
  }

  return { prices, names };
}
