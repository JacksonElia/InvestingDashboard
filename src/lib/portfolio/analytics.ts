import type { PortfolioItem } from '../../types';

export interface PortfolioStats {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  gainPercent: number;
  assetCount: number;
}

export interface AllocationBreakdown {
  ticker: string;
  name: string;
  value: number;
  percentOfTotal: number;
}

export function calculateTotalValue(items: PortfolioItem[]): number {
  return items.reduce((sum, item) => sum + (item.shares * item.currentPrice), 0);
}

export function calculateTotalCost(items: PortfolioItem[]): number {
  return items.reduce((sum, item) => sum + (item.shares * item.avgPrice), 0);
}

export function calculateTotalGain(items: PortfolioItem[]): number {
  const totalValue = calculateTotalValue(items);
  const totalCost = calculateTotalCost(items);
  return totalValue - totalCost;
}

export function calculateGainPercent(items: PortfolioItem[]): number {
  const totalCost = calculateTotalCost(items);
  if (totalCost === 0) return 0;
  const totalGain = calculateTotalGain(items);
  return (totalGain / totalCost) * 100;
}

export function calculatePortfolioStats(items: PortfolioItem[]): PortfolioStats {
  const totalValue = calculateTotalValue(items);
  const totalCost = calculateTotalCost(items);
  const totalGain = totalValue - totalCost;
  const gainPercent = totalCost === 0 ? 0 : (totalGain / totalCost) * 100;

  return {
    totalValue,
    totalCost,
    totalGain,
    gainPercent,
    assetCount: items.length,
  };
}

export function calculateAllocation(items: PortfolioItem[]): AllocationBreakdown[] {
  const totalValue = calculateTotalValue(items);

  if (totalValue === 0) {
    return [];
  }

  return items.map(item => {
    const value = item.shares * item.currentPrice;
    const percentOfTotal = (value / totalValue) * 100;

    return {
      ticker: item.ticker,
      name: item.name,
      value,
      percentOfTotal,
    };
  });
}
