import { portfolioRepository } from '../../services/portfolioService';

export async function initializePortfolioIfEmpty(): Promise<void> {
  const items = await portfolioRepository.getAll();

  const starterTickers = ['AAPL', 'MSFT', 'NVDA', 'TSLA'];
  const hasLegacyStarterPortfolio =
    items.length === starterTickers.length &&
    items.every(item => starterTickers.includes(item.ticker.toUpperCase()));

  if (hasLegacyStarterPortfolio) {
    localStorage.removeItem('portfolio_items');
    return;
  }

  if (items.length === 0) {
    return;
  }
}
