import { useState } from 'react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { mockPortfolio } from '../../lib/mockData';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';

export default function Portfolio() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPortfolio = mockPortfolio.filter(item => 
    item.ticker.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Portfolio</h1>
          <p className="text-textMuted mt-1">Manage and track your investments.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Investment
        </Button>
      </div>

      <Card>
        <CardHeader 
          title="Holdings" 
          className="pb-4"
        />
        <div className="px-6 pb-4 border-b border-surfaceHighlight">
          <div className="max-w-md">
            <Input 
              placeholder="Search ticker or company..." 
              icon={<Search className="h-4 w-4" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-textMuted uppercase bg-surfaceHighlight/30">
                <tr>
                  <th className="px-6 py-4 font-medium">Asset</th>
                  <th className="px-6 py-4 font-medium">Shares</th>
                  <th className="px-6 py-4 font-medium">Avg Price</th>
                  <th className="px-6 py-4 font-medium">Current Price</th>
                  <th className="px-6 py-4 font-medium">Total Value</th>
                  <th className="px-6 py-4 font-medium">Today's Return</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surfaceHighlight">
                {filteredPortfolio.map((item) => {
                  const totalValue = item.shares * item.currentPrice;
                  const isPositive = item.dailyChange >= 0;
                  
                  return (
                    <tr key={item.id} className="hover:bg-surfaceHighlight/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{item.ticker}</div>
                        <div className="text-textMuted text-xs">{item.name}</div>
                      </td>
                      <td className="px-6 py-4 text-white">{item.shares}</td>
                      <td className="px-6 py-4 text-white">${item.avgPrice.toFixed(2)}</td>
                      <td className="px-6 py-4 text-white">${item.currentPrice.toFixed(2)}</td>
                      <td className="px-6 py-4 font-medium text-white">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className={`px-6 py-4 font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {isPositive ? '+' : ''}{item.dailyChange}%
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" className="p-2 h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" className="p-2 h-8 w-8 text-red-400 hover:text-red-300">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredPortfolio.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-textMuted">
                      No investments found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
