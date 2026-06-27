import { portfolioRepository } from '../../services/portfolioService';
import { mockPortfolio } from '../mockData';

export async function initializePortfolioIfEmpty(): Promise<void> {
  const items = await portfolioRepository.getAll();
  
  if (items.length === 0) {
    for (const item of mockPortfolio) {
      await portfolioRepository.add({
        ticker: item.ticker,
        name: item.name,
        shares: item.shares,
        avgPrice: item.avgPrice,
        currentPrice: item.currentPrice,
        dailyChange: item.dailyChange,
      });
    }
  }
}
