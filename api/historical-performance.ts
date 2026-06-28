import type { VercelRequest, VercelResponse } from '@vercel/node';
import yahooFinance from 'yahoo-finance2';

// In yahoo-finance2 v3, the default export is a class that needs to be instantiated
const YFClass = (yahooFinance as any).default || yahooFinance;
const yf = typeof YFClass === 'function' && YFClass.name === 'YahooFinance' 
  ? new YFClass({ suppressNotices: ['ripHistorical'] }) 
  : yahooFinance;

interface PortfolioItemInput {
  ticker: string;
  shares: number;
  avgPrice: number;
  buyDate: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { items } = req.body as { items: PortfolioItemInput[] };

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Valid portfolio items are required' });
      return;
    }

    // Find the earliest buy date
    let earliestTime = Infinity;
    for (const item of items) {
      const time = new Date(item.buyDate).getTime();
      if (time < earliestTime) {
        earliestTime = time;
      }
    }

    if (earliestTime === Infinity) {
      res.status(400).json({ error: 'Invalid dates in portfolio items' });
      return;
    }

    const earliestDate = new Date(earliestTime);
    // Ensure we start a little before to get good baseline (at least 1 month ago)
    const minDate = new Date();
    minDate.setMonth(minDate.getMonth() - 1);
    if (earliestDate > minDate) {
      earliestDate.setTime(minDate.getTime());
    }
    
    // Also push it back a few days just to ensure we get a data point
    earliestDate.setDate(earliestDate.getDate() - 5);

    const period1 = earliestDate.toISOString().split('T')[0];
    const period2 = new Date().toISOString().split('T')[0];

    // Determine interval based on duration
    const daysDiff = (new Date().getTime() - earliestDate.getTime()) / (1000 * 3600 * 24);
    const interval = daysDiff > 90 ? '1mo' : (daysDiff > 14 ? '1wk' : '1d');

    // Fetch SPY data as the baseline
    const spyData = await yf.historical('SPY', {
      period1,
      period2,
      interval
    });

    if (!spyData || spyData.length === 0) {
      throw new Error('Failed to fetch SPY data');
    }

    // Fetch data for all tickers
    const uniqueTickers = Array.from(new Set(items.map(i => i.ticker.toUpperCase())));
    const tickerHistoricalData: Record<string, any[]> = {};
    
    await Promise.all(uniqueTickers.map(async (ticker) => {
      try {
        const data = await yf.historical(ticker, {
          period1,
          period2,
          interval
        });
        tickerHistoricalData[ticker] = data;
      } catch (err) {
        console.warn(`Failed to fetch historical data for ${ticker}`);
        tickerHistoricalData[ticker] = [];
      }
    }));

    // Build the time series
    // We will use SPY's dates as our time anchors
    const chartData = [];

    // Monthly inflation rate calculation roughly
    // We adjust it based on the interval
    let periodInflationRate = 1;
    if (interval === '1mo') {
      periodInflationRate = 1.03 ** (1 / 12);
    } else if (interval === '1wk') {
      periodInflationRate = 1.03 ** (1 / 52);
    } else {
      periodInflationRate = 1.03 ** (1 / 365);
    }
    
    let simulatedSpyShares = 0;
    let totalInvestedCost = 0;
    let currentInflationFactor = 1;

    for (let i = 0; i < spyData.length; i++) {
      const pointDate = new Date(spyData[i].date);
      const spyPrice = spyData[i].close;

      let portfolioValue = 0;
      let newInvestmentsThisMonth = 0;

      // Accumulate portfolio value for this date
      for (const item of items) {
        const buyDate = new Date(item.buyDate);
        if (buyDate <= pointDate) {
          // It was bought on or before this point
          
          // Check if this investment was made within the current interval slice
          // For simplicity, we consider an investment "new" if its buyDate is after the previous pointDate (or before/equal to first point)
          let isNewThisPeriod = false;
          if (i === 0) {
            isNewThisPeriod = true; // Everything bought before or exactly on the first point
          } else {
            const prevPointDate = new Date(spyData[i-1].date);
            isNewThisPeriod = buyDate > prevPointDate && buyDate <= pointDate;
          }

          if (isNewThisPeriod) {
            const cost = item.shares * item.avgPrice;
            newInvestmentsThisMonth += cost;
          }

          const tickerData = tickerHistoricalData[item.ticker.toUpperCase()];
          // Find closest date in tickerData on or before pointDate
          let matchedPrice = item.avgPrice; // Fallback to avg price
          
          if (tickerData && tickerData.length > 0) {
            // Find closest date point
            const closestPoint = tickerData.find(d => {
               const dDate = new Date(d.date);
               return dDate.toISOString().split('T')[0] === pointDate.toISOString().split('T')[0];
            });
            if (closestPoint) {
              matchedPrice = closestPoint.close;
            } else {
               // Use last available before this point
               const prevPoints = tickerData.filter(d => new Date(d.date) <= pointDate);
               if (prevPoints.length > 0) {
                 matchedPrice = prevPoints[prevPoints.length - 1].close;
               }
            }
          }
          
          portfolioValue += (matchedPrice * item.shares);
        }
      }

      if (newInvestmentsThisMonth > 0) {
        totalInvestedCost += newInvestmentsThisMonth;
        simulatedSpyShares += (newInvestmentsThisMonth / spyPrice);
      }

      // Inflation compounding (roughly)
      // Apply inflation factor from the second data point onwards
      if (i > 0) {
        currentInflationFactor *= periodInflationRate;
      }
      
      const inflationAdjustedCost = totalInvestedCost * currentInflationFactor;
      const sp500Value = simulatedSpyShares * spyPrice;

      // Ensure that dates format nicely depending on interval
      let monthLabel = pointDate.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (interval === '1wk' || interval === '1d') {
        monthLabel = `${pointDate.toLocaleString('default', { month: 'short' })} ${pointDate.getDate()}`;
      }

      chartData.push({
        date: pointDate.toISOString().split('T')[0],
        month: monthLabel,
        portfolioValue: Math.round(portfolioValue * 100) / 100,
        sp500Value: Math.round(sp500Value * 100) / 100,
        investedCash: Math.round(totalInvestedCost * 100) / 100,
        inflationAdjustedCost: Math.round(inflationAdjustedCost * 100) / 100,
      });
    }

    res.status(200).json({ chartData });
  } catch (error) {
    console.error('Historical data error:', error);
    res.status(500).json({ error: 'Failed to compute historical performance' });
  }
}
