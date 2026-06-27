import { useState, useRef, useEffect } from 'react';
import type { PortfolioItem } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { X, Loader } from 'lucide-react';
import { fetchStockPrice } from '../../lib/stockPriceService';

interface AddInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: Omit<PortfolioItem, 'id'>) => Promise<void>;
}

export default function AddInvestmentModal({ isOpen, onClose, onAdd }: AddInvestmentModalProps) {
  const [formData, setFormData] = useState({
    ticker: '',
    name: '',
    shares: '',
    avgPrice: '',
    currentPrice: '',
    dailyChange: '0',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [priceError, setPriceError] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const priceAbortRef = useRef<AbortController | null>(null);

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

  useEffect(() => {
    return () => {
      // Clean up any pending price fetches when component unmounts
      priceAbortRef.current?.abort();
    };
  }, []);

  const handleFetchPrice = async (ticker: string) => {
    const trimmedTicker = ticker.trim();
    if (!trimmedTicker) {
      setPriceError('');
      return;
    }

    console.log(`[AddInvestmentModal] Fetching price for ${trimmedTicker}`);
    setPriceError('');
    setFetchingPrice(true);
    priceAbortRef.current?.abort();
    priceAbortRef.current = new AbortController();

    try {
      const price = await fetchStockPrice(trimmedTicker);
      console.log(`[AddInvestmentModal] Price fetch successful for ${trimmedTicker}: $${price}`);
      setFormData(prev => ({
        ...prev,
        currentPrice: price.toFixed(2),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch price';
      console.error(`[AddInvestmentModal] Price fetch error for ${trimmedTicker}:`, message);
      setPriceError(message);
    } finally {
      setFetchingPrice(false);
    }
  };

  const handleTickerBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const ticker = e.target.value.trim();
    if (ticker && !formData.currentPrice) {
      handleFetchPrice(ticker);
    }
  };

  const handleTickerKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const ticker = formData.ticker.trim();
      if (ticker) {
        await handleFetchPrice(ticker);
      }
    }
  };

  if (!isOpen) return null;

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
      setError('Average price must be a positive number');
      return false;
    }

    // Current price is optional - portfolio will fetch it on load
    if (formData.currentPrice.trim()) {
      const currentPrice = parseFloat(formData.currentPrice);
      if (isNaN(currentPrice) || currentPrice <= 0) {
        setError('Current price must be a positive number');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // If current price is empty, use avgPrice as fallback
      const currentPrice = formData.currentPrice.trim() 
        ? parseFloat(formData.currentPrice)
        : parseFloat(formData.avgPrice);

      await onAdd({
        ticker: formData.ticker.trim().toUpperCase(),
        name: formData.name.trim(),
        shares: parseFloat(formData.shares),
        avgPrice: parseFloat(formData.avgPrice),
        currentPrice,
        dailyChange: parseFloat(formData.dailyChange || '0'),
      });

      setFormData({
        ticker: '',
        name: '',
        shares: '',
        avgPrice: '',
        currentPrice: '',
        dailyChange: '0',
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add investment');
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
          <h3 className="text-lg font-semibold text-white">Add Investment</h3>
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
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="e.g., AAPL"
                value={formData.ticker}
                onChange={(e) => {
                  setFormData({ ...formData, ticker: e.target.value });
                  setPriceError('');
                }}
                onBlur={handleTickerBlur}
                onKeyDown={handleTickerKeyDown}
                disabled={loading || fetchingPrice}
              />
              {formData.ticker && !fetchingPrice && (
                <Button
                  type="button"
                  variant="outline"
                  className="px-3 h-10"
                  onClick={() => handleFetchPrice(formData.ticker)}
                  disabled={loading}
                  title="Fetch current price"
                >
                  Get Price
                </Button>
              )}
              {fetchingPrice && (
                <div className="flex items-center justify-center px-3">
                  <Loader className="h-4 w-4 text-blue-400 animate-spin" />
                </div>
              )}
            </div>
            {priceError && (
              <p className="text-xs text-red-400 mt-1">{priceError}</p>
            )}
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
                Avg Price ($)
              </label>
              <Input
                type="number"
                placeholder="150.00"
                step="0.01"
                value={formData.avgPrice}
                onChange={(e) => setFormData({ ...formData, avgPrice: e.target.value })}
                disabled={loading}
              />
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
                Daily Change (%)
              </label>
              <Input
                type="number"
                placeholder="0"
                step="0.01"
                value={formData.dailyChange}
                onChange={(e) => setFormData({ ...formData, dailyChange: e.target.value })}
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
              {loading ? 'Adding...' : 'Add Investment'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
