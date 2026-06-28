import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Search, ExternalLink, Flame, Loader2 } from 'lucide-react';
import { usePortfolio } from '../../hooks/usePortfolio';

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  date: string;
  relatedTickers: string[];
}

export default function News() {
  const [searchTerm, setSearchTerm] = useState('');
  const { items, loading: portfolioLoading } = usePortfolio();
  
  const [topStories, setTopStories] = useState<NewsArticle[]>([]);
  const [otherStories, setOtherStories] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (portfolioLoading || items.length === 0) return;

    const fetchNews = async () => {
      setNewsLoading(true);
      setError(null);
      
      try {
        // Get unique tickers from portfolio, max 5 to keep the search focused
        const uniqueTickers = Array.from(new Set(items.map(item => item.ticker))).slice(0, 5);
        
        if (uniqueTickers.length === 0) {
          setNewsLoading(false);
          return;
        }

        const params = new URLSearchParams({ tickers: uniqueTickers.join(',') });
        const res = await fetch(`/api/news?${params}`);
        
        if (!res.ok) {
          throw new Error('Failed to fetch news');
        }

        const data = await res.json();
        setTopStories(data.top3 || []);
        setOtherStories(data.theRest || []);
      } catch (err: any) {
        setError(err.message || 'An error occurred loading news.');
      } finally {
        setNewsLoading(false);
      }
    };

    fetchNews();
  }, [items, portfolioLoading]);

  const filteredNews = otherStories.filter(article => 
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    article.relatedTickers.some(ticker => ticker.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Market News</h1>
        <p className="text-textMuted mt-1">Stay updated with the latest stories impacting your portfolio.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {(portfolioLoading || newsLoading) && !error ? (
        <div className="flex flex-col items-center justify-center py-12 text-textMuted">
          <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
          <p>Analyzing the web for the most impactful news on your portfolio...</p>
        </div>
      ) : (
        <>
          {topStories.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <Flame className="h-5 w-5" />
                <h2>Top Stories</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {topStories.map(article => (
                  <Card key={`top-${article.id}`} className="hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => window.open(article.url, '_blank')}>
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-semibold px-2 py-1 bg-surfaceHighlight rounded text-textMuted">
                          {article.source}
                        </span>
                        <span className="text-xs text-textMuted">{article.date}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-sm text-textMuted mb-4 flex-1">
                        {article.summary}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-auto">
                        {article.relatedTickers.map(ticker => (
                          <span key={ticker} className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                            ${ticker}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="pt-8 border-t border-surfaceHighlight space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Search by Ticker or Topic</h2>
              <div className="max-w-xl">
                <Input 
                  placeholder="e.g., TSLA, Earnings, AI..." 
                  icon={<Search className="h-4 w-4" />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              {filteredNews.map(article => (
                <Card key={article.id} className="hover:bg-surfaceHighlight/30 transition-colors">
                  <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-semibold text-textMuted">{article.source}</span>
                        <span className="text-xs text-textMuted">•</span>
                        <span className="text-xs text-textMuted">{article.date}</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-white mb-1">
                        {article.title}
                      </h3>
                      <p className="text-sm text-textMuted line-clamp-2">
                        {article.summary}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {article.relatedTickers.map(ticker => (
                          <span key={ticker} className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                            ${ticker}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <a href={article.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-lg p-2 bg-surfaceHighlight hover:bg-surfaceHighlight/80 text-white transition-colors">
                        <ExternalLink className="h-5 w-5" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredNews.length === 0 && otherStories.length > 0 && (
                <div className="text-center py-12 text-textMuted">
                  No news found matching "{searchTerm}".
                </div>
              )}
              {filteredNews.length === 0 && otherStories.length === 0 && !newsLoading && topStories.length === 0 && (
                <div className="text-center py-12 text-textMuted">
                  {items.length === 0 ? "Add investments to your portfolio to see related news." : "No recent news found for your portfolio."}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
