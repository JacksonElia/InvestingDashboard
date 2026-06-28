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

  const { ticker, startDate, endDate } = req.query;

  if (!ticker || typeof ticker !== 'string') {
    res.status(400).json({ error: 'ticker is required' });
    return;
  }

  if (!startDate || typeof startDate !== 'string') {
    res.status(400).json({ error: 'startDate is required' });
    return;
  }

  try {
    const period1 = new Date(startDate).toISOString().split('T')[0];
    const period2 = endDate && typeof endDate === 'string' 
      ? new Date(endDate).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0];

    const data = await yf.historical(ticker, {
      period1,
      period2,
      events: 'split'
    });

    res.status(200).json(data || []);
  } catch (error) {
    console.error('Stock splits error:', error);
    res.status(500).json({ error: 'Failed to fetch stock splits' });
  }
}
