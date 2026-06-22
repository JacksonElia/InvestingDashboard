import { useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { mockDisruptors } from '../../lib/mockData';
import { Sparkles, Search, BookmarkPlus, ArrowRight } from 'lucide-react';

export default function Disruptors() {
  const [industrySearch, setIndustrySearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!industrySearch.trim()) return;
    
    // Placeholder for future AI integration
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
    }, 1500);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">AI Disruptor Discovery</h1>
        <p className="text-textMuted mt-1">Leverage AI to find emerging companies set to transform their industries.</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary font-semibold">
          <Sparkles className="h-5 w-5" />
          <h2>Top Emerging Disruptors</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mockDisruptors.slice(0, 3).map(company => (
            <Card key={`top-${company.id}`} className="flex flex-col">
              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{company.ticker}</h3>
                    <p className="text-sm text-textMuted">{company.name}</p>
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
                
                <Button variant="outline" className="w-full gap-2 mt-auto">
                  <BookmarkPlus className="h-4 w-4" />
                  Track Company
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="bg-gradient-to-br from-surface to-surfaceHighlight/50 border-primary/20">
        <CardContent className="p-8 md:p-12 text-center max-w-3xl mx-auto">
          <Sparkles className="h-12 w-12 text-primary mx-auto mb-6 opacity-80" />
          <h2 className="text-2xl font-bold text-white mb-4">Discover Next-Gen Leaders</h2>
          <p className="text-textMuted mb-8">
            Type in any industry or technological trend, and our AI will analyze market data, patents, and research to find potential public companies poised for massive growth.
          </p>
          
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="flex-1 max-w-md w-full relative">
              <Input 
                placeholder="e.g., Solid State Batteries, Quantum Computing, Vertical Farming..."
                value={industrySearch}
                onChange={(e) => setIndustrySearch(e.target.value)}
                className="py-3 px-4 text-base"
                icon={<Search className="h-5 w-5" />}
              />
            </div>
            <Button 
              type="submit" 
              className="py-3 px-8 text-base shadow-lg shadow-primary/20"
              disabled={isSearching}
            >
              {isSearching ? 'Analyzing...' : (
                <>
                  Find Disruptors
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-bold text-white mb-4">Your Tracked Disruptors</h2>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-textMuted uppercase bg-surfaceHighlight/30">
                  <tr>
                    <th className="px-6 py-4 font-medium">Company</th>
                    <th className="px-6 py-4 font-medium">Industry</th>
                    <th className="px-6 py-4 font-medium">AI Thesis Summary</th>
                    <th className="px-6 py-4 font-medium">Score</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surfaceHighlight">
                  {mockDisruptors.map((item) => (
                    <tr key={item.id} className="hover:bg-surfaceHighlight/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{item.ticker}</div>
                        <div className="text-textMuted text-xs">{item.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs px-2 py-1 bg-surfaceHighlight rounded text-textMuted">
                          {item.industry}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-textMuted max-w-xs truncate">
                        {item.thesis}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-primary">{item.potentialScore}/100</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="outline" className="text-xs h-8">
                          View Details
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
    </div>
  );
}
