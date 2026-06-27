import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { mockPerformanceData, mockAllocationData } from '../../lib/mockData';
import { usePortfolio } from '../../hooks/usePortfolio';
import { calculatePortfolioStats, calculateAllocation } from '../../lib/portfolio/analytics';
import { TrendingUp, DollarSign, Activity } from 'lucide-react';

const COLORS = ['#ff325a', '#cc2848', '#ff5b7b', '#4a111f'];

export default function Home() {
  const { items: portfolio } = usePortfolio();
  const stats = calculatePortfolioStats(portfolio);
  const allocation = calculateAllocation(portfolio);

  const allocationForChart = allocation.map(item => ({
    name: item.ticker,
    value: Math.round(item.percentOfTotal),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
        <p className="text-textMuted mt-1">Welcome back. Here's how your portfolio is doing.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="bg-primary/10 p-3 rounded-full mr-4">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-textMuted">Total Balance</p>
              <h4 className="text-2xl font-bold text-white">${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="bg-green-500/10 p-3 rounded-full mr-4">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-textMuted">Total Return</p>
              <h4 className="text-2xl font-bold text-green-400">
                +${stats.totalGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({stats.gainPercent.toFixed(2)}%)
              </h4>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="bg-blue-500/10 p-3 rounded-full mr-4">
              <Activity className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-textMuted">Active Investments</p>
              <h4 className="text-2xl font-bold text-white">{stats.assetCount} Assets</h4>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader title="Performance History" subtitle="Portfolio value over time" />
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2e303a" vertical={false} />
                  <XAxis dataKey="month" stroke="#a0a0a0" tick={{ fill: '#a0a0a0' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#a0a0a0" tick={{ fill: '#a0a0a0' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#121212', borderColor: '#1e1e1e', color: '#fff' }}
                    itemStyle={{ color: '#ff325a' }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#ff325a" strokeWidth={3} dot={{ fill: '#000', stroke: '#ff325a', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#ff325a' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Asset Allocation" subtitle="By ticker" />
          <CardContent>
            <div className="h-[300px] w-full flex items-center justify-center mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationForChart.length > 0 ? allocationForChart : mockAllocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {(allocationForChart.length > 0 ? allocationForChart : mockAllocationData).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#121212', borderColor: '#1e1e1e', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {(allocationForChart.length > 0 ? allocationForChart : mockAllocationData).map((entry, index) => (
                <div key={entry.name} className="flex items-center text-xs text-textMuted">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  {entry.name} ({entry.value}%)
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
