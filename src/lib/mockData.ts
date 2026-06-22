import type { PortfolioItem, NewsArticle, DisruptorCandidate } from '../types';

export const mockPortfolio: PortfolioItem[] = [
  { id: '1', ticker: 'AAPL', name: 'Apple Inc.', shares: 50, avgPrice: 150.2, currentPrice: 185.4, dailyChange: 1.2 },
  { id: '2', ticker: 'MSFT', name: 'Microsoft Corp.', shares: 30, avgPrice: 280.0, currentPrice: 420.1, dailyChange: -0.5 },
  { id: '3', ticker: 'NVDA', name: 'NVIDIA Corp.', shares: 15, avgPrice: 300.0, currentPrice: 850.5, dailyChange: 3.4 },
  { id: '4', ticker: 'TSLA', name: 'Tesla Inc.', shares: 100, avgPrice: 200.5, currentPrice: 175.2, dailyChange: -2.1 },
];

export const mockPerformanceData = [
  { month: 'Jan', value: 45000 },
  { month: 'Feb', value: 48000 },
  { month: 'Mar', value: 47500 },
  { month: 'Apr', value: 51000 },
  { month: 'May', value: 54000 },
  { month: 'Jun', value: 58500 },
];

export const mockAllocationData = [
  { name: 'Technology', value: 65 },
  { name: 'Consumer', value: 15 },
  { name: 'Healthcare', value: 10 },
  { name: 'Financials', value: 10 },
];

export const mockNews: NewsArticle[] = [
  {
    id: 'n1',
    title: 'AI Boom Pushes Tech Stocks to Record Highs',
    source: 'Financial Times',
    date: '2026-06-21',
    summary: 'Major technology companies see unprecedented growth as AI integration becomes standard across enterprise software.',
    relatedTickers: ['MSFT', 'NVDA'],
    url: '#'
  },
  {
    id: 'n2',
    title: 'Apple Announces Next-Gen Spatial Computing Device',
    source: 'Wall Street Journal',
    date: '2026-06-20',
    summary: 'The new wearable device aims to replace traditional workstations with immersive 3D environments.',
    relatedTickers: ['AAPL'],
    url: '#'
  },
  {
    id: 'n3',
    title: 'EV Market Faces Supply Chain Bottlenecks',
    source: 'Bloomberg',
    date: '2026-06-19',
    summary: 'Manufacturers are struggling to secure enough battery materials to meet growing consumer demand.',
    relatedTickers: ['TSLA'],
    url: '#'
  }
];

export const mockDisruptors: DisruptorCandidate[] = [
  {
    id: 'd1',
    ticker: 'CRSP',
    name: 'CRISPR Therapeutics',
    industry: 'Biotech',
    thesis: 'Pioneering gene-editing therapies that could cure previously untreatable genetic diseases.',
    potentialScore: 85,
  },
  {
    id: 'd2',
    ticker: 'PLTR',
    name: 'Palantir Technologies',
    industry: 'Data Analytics',
    thesis: 'Creating the standard OS for data-driven decision making in both defense and commercial sectors.',
    potentialScore: 78,
  },
  {
    id: 'd3',
    ticker: 'RKLB',
    name: 'Rocket Lab',
    industry: 'Aerospace',
    thesis: 'Making space access frequent, reliable, and affordable for small satellites.',
    potentialScore: 92,
  }
];
