import { useState, useRef, useEffect } from 'react';
import type { PortfolioItem } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { X } from 'lucide-react';

import { fetchHistoricalPriceForDate } from '../../lib/stockPriceService';

interface EditInvestmentModalProps {
  isOpen: boolean;
  item: PortfolioItem | null;
  onClose: () => void;
  onUpdate: (id: string, item: Omit<PortfolioItem, 'id'>) => Promise<void>;
}

interface FormData {
  ticker: string;
  name: string;
  shares: string;
  avgPrice: string;
  currentPrice: string;
  buyDate: string;
}

export default function EditInvestmentModal({ isOpen, item, onClose, onUpdate }: EditInvestmentModalProps) {
  const [formData, setFormData] = useState<FormData>({
    ticker: '',
    name: '',
    shares: '',
    avgPrice: '',
    currentPrice: '',
    buyDate: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingHistoricalPrice, setFetchingHistoricalPrice] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Update form data when item changes (intentional setState in effect to sync form with prop)
  useEffect(() => {
    if (item) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        ticker: item.ticker,
        name: item.name,
        shares: item.shares.toString(),
        avgPrice: item.avgPrice.toString(),
        currentPrice: item.currentPrice.toString(),
        buyDate: item.buyDate || new Date().toISOString().split('T')[0],
      });
    }
  }, [item]);

  // Auto-fetch historical price when buyDate changes
  useEffect(() => {
    const getHistoricalPrice = async () => {
      // Don't auto-fetch if we are just loading the modal with existing item data
      if (item && formData.buyDate === (item.buyDate || new Date().toISOString().split('T')[0])) {
        return;
      }

      const ticker = formData.ticker.trim();
      const date = formData.buyDate;
      if (!ticker || !date) return;

      setFetchingHistoricalPrice(true);
      try {
        const closePrice = await fetchHistoricalPriceForDate(ticker, date);
        setFormData(prev => ({
          ...prev,
          avgPrice: closePrice.toFixed(2)
        }));
      } catch (err) {
        console.error('Could not fetch historical price', err);
      } finally {
        setFetchingHistoricalPrice(false);
      }
    };

    const delay = setTimeout(getHistoricalPrice, 600);
    return () => clearTimeout(delay);
  }, [formData.buyDate, formData.ticker, item]);

  const validateForm = (): boolean => {
    setError('');

    if (!formData.ticker.trim()) {
      setError('Ticker is required');
      return false;
    }

    if (!formData.name.trim()) {
      setError('Company name is required');
      return false;
    }

    const shares = parseFloat(formData.shares);
    if (!formData.shares.trim() || isNaN(shares) || shares <= 0) {
      setError('Shares must be a positive number');
      return false;
    }

    const avgPrice = parseFloat(formData.avgPrice);
    if (!formData.avgPrice.trim() || isNaN(avgPrice) || avgPrice <= 0) {
      setError('Price when bought must be a positive number');
      return false;
    }

    const currentPrice = parseFloat(formData.currentPrice);
    if (!formData.currentPrice.trim() || isNaN(currentPrice) || currentPrice <= 0) {
      setError('Current price must be a positive number');
      return false;
    }

    if (!formData.buyDate.trim()) {
      setError('Buy date is required');
      return false;
    }

    return true;
  };

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!item) return;

    setLoading(true);
    try {
      await onUpdate(item.id, {
        ticker: formData.ticker.trim().toUpperCase(),
        name: formData.name.trim(),
        shares: parseFloat(formData.shares),
        avgPrice: parseFloat(formData.avgPrice),
        currentPrice: parseFloat(formData.currentPrice),
        buyDate: formData.buyDate,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update investment');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (dialogRef.current && e.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <div
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <Card className="w-full max-w-md mx-4">
        <div className="px-6 py-5 border-b border-surfaceHighlight flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Edit Investment</h3>
          <button
            onClick={onClose}
            className="text-textMuted hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg px-3 py-2">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Ticker Symbol
            </label>
            <Input
              type="text"
              placeholder="e.g., AAPL"
              value={formData.ticker}
              onChange={(e) => setFormData({ ...formData, ticker: e.target.value })}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Company Name
            </label>
            <Input
              type="text"
              placeholder="e.g., Apple Inc."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Shares
              </label>
              <Input
                type="number"
                placeholder="100"
                step="0.01"
                value={formData.shares}
                onChange={(e) => setFormData({ ...formData, shares: e.target.value })}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Price When Bought ($)
                {fetchingHistoricalPrice && <span className="ml-2 text-xs text-blue-400 italic">Fetching close...</span>}
              </label>
              <Input
                type="number"
                placeholder="150.00"
                step="0.01"
                value={formData.avgPrice}
                onChange={(e) => setFormData({ ...formData, avgPrice: e.target.value })}
                disabled={loading || fetchingHistoricalPrice}
              />
              <p className="mt-1 text-xs text-textMuted">
                Auto-fills to closing price on date change.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Current Price ($)
              </label>
              <Input
                type="number"
                placeholder="180.00"
                step="0.01"
                value={formData.currentPrice}
                onChange={(e) => setFormData({ ...formData, currentPrice: e.target.value })}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Buy Date
              </label>
              <Input
                type="date"
                value={formData.buyDate}
                onChange={(e) => setFormData({ ...formData, buyDate: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Updating...' : 'Update Investment'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
