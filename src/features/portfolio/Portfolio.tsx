import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { usePortfolio } from '../../hooks/usePortfolio';
import AddInvestmentModal from './AddInvestmentModal';
import EditInvestmentModal from './EditInvestmentModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { Plus, Search, Edit, Trash2, AlertCircle, Loader } from 'lucide-react';
import type { PortfolioItem } from '../../types';
import { fetchMultiplePrices } from '../../lib/stockPriceService';

export default function Portfolio() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<PortfolioItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [prices, setPrices] = useState<Map<string, number | null>>(new Map());
  const [fetchingPrices, setFetchingPrices] = useState<Set<string>>(new Set());
  const [priceFetchError, setPriceFetchError] = useState<string | null>(null);

  const { items, loading, error, addItem, updateItem, deleteItem } = usePortfolio();

  // Memoize tickers to avoid unnecessary effect runs
  const tickers = useMemo(() => items.map(item => item.ticker).sort(), [items]);

  // Auto-fetch prices when portfolio items load or tickers change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (tickers.length === 0) {
      return;
    }

    console.log('[Portfolio] Fetching prices for tickers:', tickers);

    let isMounted = true;
    setFetchingPrices(new Set(tickers));

    fetchMultiplePrices(tickers)
      .then(priceMap => {
        if (!isMounted) return;

        console.log('[Portfolio] Prices fetched successfully:', Object.fromEntries(priceMap));
        setPrices(priceMap);
        setPriceFetchError(null);

        // Save fetched prices to localStorage by updating each portfolio item
        // Only update if the price actually changed
        priceMap.forEach((fetchedPrice, ticker) => {
          if (fetchedPrice !== null) {
            const item = items.find(i => i.ticker === ticker);
            if (item && item.currentPrice !== fetchedPrice) {
              const updatedItem = { ...item, currentPrice: fetchedPrice };
              updateItem(item.id, {
                ticker: updatedItem.ticker,
                name: updatedItem.name,
                shares: updatedItem.shares,
                avgPrice: updatedItem.avgPrice,
                currentPrice: updatedItem.currentPrice,
                dailyChange: updatedItem.dailyChange,
              });
            }
          }
        });

        setFetchingPrices(new Set());
      })
      .catch(err => {
        if (!isMounted) return;

        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch prices';
        console.error('[Portfolio] Price fetch error:', errorMsg);
        setPriceFetchError(errorMsg);
        setFetchingPrices(new Set());
      });

    return () => {
      isMounted = false;
    };
  }, [tickers, items, updateItem]);

  const filteredPortfolio = items.filter(item => 
    item.ticker.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleOpenEditModal = (item: PortfolioItem) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedItem(null);
  };

  const handleDeleteClick = (item: PortfolioItem) => {
    setDeleteConfirmItem(item);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmItem) return;

    setIsDeleting(true);
    try {
      await deleteItem(deleteConfirmItem.id);
      setDeleteConfirmItem(null);
    } catch {
      // Error is handled by the hook and displayed
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmItem(null);
  };

  const getDisplayPrice = (item: PortfolioItem): { price: number; isLoading: boolean } => {
    const fetchedPrice = prices.get(item.ticker);
    const isFetching = fetchingPrices.has(item.ticker);

    if (isFetching) {
      return { price: item.currentPrice, isLoading: true };
    }

    if (fetchedPrice !== undefined && fetchedPrice !== null) {
      return { price: fetchedPrice, isLoading: false };
    }

    // Fallback to current price if fetch failed or not fetched yet
    return { price: item.currentPrice, isLoading: false };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Portfolio</h1>
          <p className="text-textMuted mt-1">Manage and track your investments.</p>
        </div>
        <Button className="gap-2" onClick={handleOpenAddModal} disabled={loading}>
          <Plus className="h-4 w-4" />
          Add Investment
        </Button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400">Error</p>
            <p className="text-sm text-red-300/80">{error}</p>
          </div>
        </div>
      )}

      {priceFetchError && (
        <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-400">Price Fetch Error</p>
            <p className="text-sm text-yellow-300/80">{priceFetchError}</p>
          </div>
        </div>
      )}

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
              disabled={loading}
            />
          </div>
        </div>
        <CardContent className="p-0">
          {loading && !items.length ? (
            <div className="px-6 py-8 text-center">
              <p className="text-textMuted">Loading portfolio...</p>
            </div>
          ) : (
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
                    const { price: displayPrice, isLoading: isPriceLoading } = getDisplayPrice(item);
                    const totalValue = item.shares * displayPrice;
                    const isPositive = item.dailyChange >= 0;
                    
                    return (
                      <tr key={item.id} className="hover:bg-surfaceHighlight/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">{item.ticker}</div>
                          <div className="text-textMuted text-xs">{item.name}</div>
                        </td>
                        <td className="px-6 py-4 text-white">{item.shares}</td>
                        <td className="px-6 py-4 text-white">${item.avgPrice.toFixed(2)}</td>
                        <td className="px-6 py-4 text-white">
                          <div className="flex items-center gap-2">
                            ${displayPrice.toFixed(2)}
                            {isPriceLoading && (
                              <Loader className="h-3 w-3 text-blue-400 animate-spin" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-white">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className={`px-6 py-4 font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                          {isPositive ? '+' : ''}{item.dailyChange}%
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              className="p-2 h-8 w-8"
                              onClick={() => handleOpenEditModal(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              className="p-2 h-8 w-8 text-red-400 hover:text-red-300"
                              onClick={() => handleDeleteClick(item)}
                            >
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
                        {items.length === 0 ? 'No investments yet. Add your first investment to get started.' : 'No investments found matching your search.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddInvestmentModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onAdd={addItem}
      />

      <EditInvestmentModal
        isOpen={isEditModalOpen}
        item={selectedItem}
        onClose={handleCloseEditModal}
        onUpdate={updateItem}
      />

      <DeleteConfirmationModal
        isOpen={deleteConfirmItem !== null}
        itemName={deleteConfirmItem ? `${deleteConfirmItem.ticker} (${deleteConfirmItem.name})` : ''}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
