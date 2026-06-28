import type { VercelRequest, VercelResponse } from '@vercel/node';
import yahooFinance from 'yahoo-finance2';

const YFClass = (yahooFinance as any).default || yahooFinance;
const yf = typeof YFClass === 'function' && YFClass.name === 'YahooFinance' 
  ? new YFClass({ suppressNotices: ['ripHistorical'] }) 
  : yahooFinance;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { ticker, date } = req.query;

  if (!ticker || typeof ticker !== 'string') {
    res.status(400).json({ error: 'ticker is required' });
    return;
  }

  if (!date || typeof date !== 'string') {
    res.status(400).json({ error: 'date is required' });
    return;
  }

  try {
    const queryDate = new Date(date);
    
    // Check if the date is today or in the future
    const today = new Date();
    if (queryDate.toISOString().split('T')[0] >= today.toISOString().split('T')[0]) {
      // Just fetch the current price
      const quote = await yf.quote(ticker);
      if (quote && quote.regularMarketPrice) {
        res.status(200).json({
          date: new Date().toISOString().split('T')[0],
          close: quote.regularMarketPrice,
        });
        return;
      }
    }

    // Set a window of a few days to catch the closest trading day (skip weekends/holidays)
    const nextDay = new Date(queryDate);
    nextDay.setDate(nextDay.getDate() + 5); 

    const period1 = queryDate.toISOString().split('T')[0];
    const period2 = nextDay.toISOString().split('T')[0];

    const data = await yf.historical(ticker, {
      period1,
      period2,
      interval: '1d'
    });

    if (!data || data.length === 0) {
      // Maybe try going backwards a few days in case they picked a weekend?
      const prevDay = new Date(queryDate);
      prevDay.setDate(prevDay.getDate() - 5);
      
      const retryData = await yf.historical(ticker, {
        period1: prevDay.toISOString().split('T')[0],
        period2: queryDate.toISOString().split('T')[0],
        interval: '1d'
      });
      
      if (!retryData || retryData.length === 0) {
         res.status(404).json({ error: 'No historical data found for this date' });
         return;
      }
      
      // Return the closest prior trading day
      res.status(200).json({
        date: retryData[retryData.length - 1].date.toISOString().split('T')[0],
        close: retryData[retryData.length - 1].close
      });
      return;
    }

    // Return the closest trading day on or after the requested date
    res.status(200).json({
      date: data[0].date.toISOString().split('T')[0],
      close: data[0].close,
    });
  } catch (error) {
    console.error('Historical price error:', error);
    res.status(500).json({ error: 'Failed to fetch historical price' });
  }
}
