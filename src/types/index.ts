export interface PortfolioItem {
  id: string;
  ticker: string;
  name: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  buyDate: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  date: string;
  summary: string;
  relatedTickers: string[];
  url: string;
}

export interface DisruptorCandidate {
  id: string;
  ticker: string;
  name: string;
  industry: string;
  thesis: string;
  potentialScore: number;
}
