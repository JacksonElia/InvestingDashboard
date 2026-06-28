import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { mockPerformanceData, mockAllocationData } from '../../lib/mockData';
import { usePortfolio } from '../../hooks/usePortfolio';
import { calculatePortfolioStats, calculateAllocation } from '../../lib/portfolio/analytics';
import { TrendingUp, TrendingDown, DollarSign, Activity, Loader, PieChart as PieChartIcon } from 'lucide-react';
import { fetchHistoricalPerformance } from '../../lib/stockPriceService';
import type { HistoricalDataPoint } from '../../lib/stockPriceService';
import { prefetchNewsForTickers } from '../news/News';

const COLORS = ['#ff325a', '#cc2848', '#ff5b7b', '#4a111f'];

// Module-level cache for historical data to prevent reloading on tab switch
let cachedHistoricalData: HistoricalDataPoint[] = [];
let lastPortfolioTickersForHistory = '';

export default function Home() {
  const { items: portfolio } = usePortfolio();
  const stats = calculatePortfolioStats(portfolio);
  const allocation = calculateAllocation(portfolio);

  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>(() => cachedHistoricalData || []);
  const [isLoadingHistory, setIsLoadingHistory] = useState(() => cachedHistoricalData.length === 0);

  useEffect(() => {
    if (portfolio.length > 0) {
      // Prefetch news data in the background
      const uniqueTickers = Array.from(new Set(portfolio.map(item => item.ticker))).slice(0, 5);
      prefetchNewsForTickers(uniqueTickers);

      // Handle historical data caching
      const currentTickersKey = portfolio.map(i => `${i.ticker}-${i.shares}`).sort().join('|');
      
      if (cachedHistoricalData.length > 0 && lastPortfolioTickersForHistory === currentTickersKey) {
        setHistoricalData(cachedHistoricalData);
        return;
      }

      setIsLoadingHistory(true);
      fetchHistoricalPerformance(portfolio)
        .then(data => {
          cachedHistoricalData = data;
          lastPortfolioTickersForHistory = currentTickersKey;
          setHistoricalData(data);
        })
        .catch(err => console.error(err))
        .finally(() => setIsLoadingHistory(false));
    }
  }, [portfolio]);

  const allocationForChart = allocation.map(item => ({
    name: item.ticker,
    value: Math.round(item.percentOfTotal),
  }));

  const isPortfolioEmpty = portfolio.length === 0;

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
            <div className={`p-3 rounded-full mr-4 ${stats.totalGain >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              {stats.totalGain >= 0 ? (
                <TrendingUp className="h-6 w-6 text-green-500" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-500" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-textMuted">Total Return</p>
              <h4 className={`text-2xl font-bold ${stats.totalGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.totalGain >= 0 ? '+' : ''}{stats.totalGain < 0 ? '-' : ''}${Math.abs(stats.totalGain).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({stats.gainPercent > 0 ? '+' : ''}{stats.gainPercent.toFixed(2)}%)
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
          <CardHeader title="Performance History" subtitle="Portfolio vs S&P 500 & Inflation" />
          <CardContent>
            <div className="h-[300px] w-full mt-4 relative">
              {isPortfolioEmpty && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-surface/80 backdrop-blur-sm rounded-lg">
                  <div className="flex flex-col items-center gap-2 p-6 text-center">
                    <TrendingUp className="h-10 w-10 text-textMuted mb-2 opacity-50" />
                    <p className="text-lg font-medium text-white">No performance data yet</p>
                    <p className="text-sm text-textMuted">Add investments to your portfolio to see your historical performance here.</p>
                  </div>
                </div>
              )}
              {isLoadingHistory && !isPortfolioEmpty && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/50 backdrop-blur-sm rounded-lg">
                  <div className="flex flex-col items-center gap-2">
                    <Loader className="h-8 w-8 text-primary animate-spin" />
                    <p className="text-sm text-textMuted">Calculating historical performance...</p>
                  </div>
                </div>
              )}
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={(historicalData.length > 0 ? historicalData : mockPerformanceData) as any[]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2e303a" vertical={false} />
                  <XAxis dataKey="month" stroke="#a0a0a0" tick={{ fill: '#a0a0a0' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#a0a0a0" tick={{ fill: '#a0a0a0' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#121212', borderColor: '#1e1e1e', color: '#fff' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Line name="Portfolio Value" type="monotone" dataKey={historicalData.length > 0 ? "portfolioValue" : "value"} stroke={isPortfolioEmpty ? "#4a4a4a" : "#ff325a"} strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#ff325a' }} />
                  {historicalData.length > 0 && (
                    <>
                      <Line name="S&P 500 (Simulated)" type="monotone" dataKey="sp500Value" stroke="#3b82f6" strokeWidth={2} dot={false} />
                      <Line name="Cost Basis (Inflation Adj)" type="monotone" dataKey="inflationAdjustedCost" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Asset Allocation" subtitle="By ticker" />
          <CardContent>
            <div className="h-[300px] w-full flex items-center justify-center mt-4 relative">
              {isPortfolioEmpty && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-surface/80 backdrop-blur-sm rounded-lg">
                  <div className="flex flex-col items-center gap-2 p-6 text-center">
                    <PieChartIcon className="h-10 w-10 text-textMuted mb-2 opacity-50" />
                    <p className="text-lg font-medium text-white">No allocation data</p>
                    <p className="text-sm text-textMuted">Add investments to see your portfolio breakdown.</p>
                  </div>
                </div>
              )}
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
                      <Cell key={`cell-${index}`} fill={isPortfolioEmpty ? "#4a4a4a" : COLORS[index % COLORS.length]} />
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
              {!isPortfolioEmpty && (allocationForChart.length > 0 ? allocationForChart : mockAllocationData).map((entry, index) => (
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
