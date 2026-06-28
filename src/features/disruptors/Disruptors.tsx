import { useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Sparkles, Search, BookmarkPlus, ArrowRight, Loader2, Check, ExternalLink } from 'lucide-react';
import { useTrackedCompanies } from '../../hooks/useTrackedCompanies';

interface Disruptor {
  id: string;
  ticker: string;
  name: string;
  industry: string;
  thesis: string;
  potentialScore: number;
  url?: string;
}

export default function Disruptors() {
  const [industrySearch, setIndustrySearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [disruptors, setDisruptors] = useState<Disruptor[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const { trackedCompanies, addTrackedCompany, isTracked, removeTrackedCompany } = useTrackedCompanies();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!industrySearch.trim()) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({ query: industrySearch });
      const res = await fetch(`/api/disruptors?${params}`);
      
      if (!res.ok) {
        throw new Error('Failed to find disruptors');
      }

      const data = await res.json();
      setDisruptors(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while finding disruptors.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleTrackCompany = (company: Disruptor) => {
    addTrackedCompany(company);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">AI Disruptor Discovery</h1>
        <p className="text-textMuted mt-1">Leverage AI to find emerging public companies set to transform their industries.</p>
      </div>

      <Card className="bg-gradient-to-br from-surface to-surfaceHighlight/50 border-primary/20">
        <CardContent className="p-8 md:p-12 text-center max-w-3xl mx-auto">
          <Sparkles className="h-12 w-12 text-primary mx-auto mb-6 opacity-80" />
          <h2 className="text-2xl font-bold text-white mb-4">Discover Next-Gen Leaders</h2>
          <p className="text-textMuted mb-8">
            Type in any industry or technological trend, and our AI will analyze market data, news, and research to find potential public companies poised for massive growth.
          </p>
          
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="flex-1 max-w-md w-full relative">
              <Input 
                placeholder="e.g., Solid State Batteries, Quantum Computing, Vertical Farming..."
                value={industrySearch}
                onChange={(e) => setIndustrySearch(e.target.value)}
                className="py-3 text-base"
                icon={<Search className="h-5 w-5" />}
              />
            </div>
            <Button 
              type="submit" 
              className="py-3 px-8 text-base shadow-lg shadow-primary/20"
              disabled={isSearching || !industrySearch.trim()}
            >
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Find Disruptors
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>
          {error && <p className="text-red-400 mt-4">{error}</p>}
        </CardContent>
      </Card>

      {disruptors.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <Sparkles className="h-5 w-5" />
            <h2>Top Emerging Disruptors in "{industrySearch}"</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {disruptors.map(company => (
              <Card key={company.id} className="flex flex-col">
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        {company.ticker}
                        <a 
                          href={company.url || `https://finance.yahoo.com/quote/${company.ticker}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-textMuted hover:text-primary transition-colors"
                          title="View Company"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </h3>
                      <a 
                        href={company.url || `https://finance.yahoo.com/quote/${company.ticker}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-textMuted hover:text-primary hover:underline transition-colors"
                      >
                        {company.name}
                      </a>
                    </div>
                    <div className="bg-primary/20 text-primary text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      Score: {company.potentialScore}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <span className="text-xs font-semibold px-2 py-1 bg-surfaceHighlight rounded text-textMuted uppercase tracking-wider">
                      {company.industry}
                    </span>
                  </div>
                  
                  <p className="text-sm text-textMuted mb-6 flex-1">
                    {company.thesis}
                  </p>
                  
                  <Button 
                    variant={isTracked(company.ticker) ? "primary" : "outline"} 
                    className={`w-full gap-2 mt-auto ${isTracked(company.ticker) ? 'bg-primary/20 text-primary border-primary/50 hover:bg-primary/30' : ''}`}
                    onClick={() => handleTrackCompany(company)}
                    disabled={isTracked(company.ticker)}
                  >
                    {isTracked(company.ticker) ? (
                      <>
                        <Check className="h-4 w-4" />
                        Tracking
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="h-4 w-4" />
                        Track Company
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {trackedCompanies.length > 0 && (
        <div className="pt-8 border-t border-surfaceHighlight">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">Your Tracked Disruptors</h2>
              <p className="text-sm text-textMuted mt-1">Companies you are keeping an eye on but haven't invested in yet.</p>
            </div>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-textMuted uppercase bg-surfaceHighlight/30">
                    <tr>
                      <th className="px-6 py-4 font-medium">Company</th>
                      <th className="px-6 py-4 font-medium">Industry</th>
                      <th className="px-6 py-4 font-medium hidden md:table-cell">AI Thesis</th>
                      <th className="px-6 py-4 font-medium text-center">Score</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surfaceHighlight">
                    {trackedCompanies.map((company) => (
                      <tr key={company.id} className="hover:bg-surfaceHighlight/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-white">{company.ticker}</div>
                            <a 
                              href={company.url || `https://finance.yahoo.com/quote/${company.ticker}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-textMuted hover:text-primary transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          <div className="text-textMuted text-xs">{company.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs px-2 py-1 bg-surfaceHighlight rounded text-textMuted uppercase tracking-wider">
                            {company.industry}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-textMuted max-w-sm hidden md:table-cell">
                          <p className="line-clamp-2 text-xs">{company.thesis}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="font-bold text-primary">{company.potentialScore}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            variant="ghost" 
                            className="text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            onClick={() => removeTrackedCompany(company.ticker)}
                          >
                            Untrack
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
