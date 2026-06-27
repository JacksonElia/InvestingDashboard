# Portfolio Data Layer - Code Examples & Usage

## Repository Pattern Usage

### Add New Investment
```typescript
// From Portfolio.tsx
const { items, addItem } = usePortfolio();

const handleAddInvestment = async (investment: Omit<PortfolioItem, 'id'>) => {
  try {
    await addItem(investment);
    // UI automatically updates due to optimistic update
  } catch (error) {
    // Error handled and displayed by hook
  }
};
```

### Update Existing Investment
```typescript
const handleUpdateInvestment = async (id: string, investment: Omit<PortfolioItem, 'id'>) => {
  try {
    await updateItem(id, investment);
  } catch (error) {
    // Rolled back on error
  }
};
```

### Delete Investment with Confirmation
```typescript
const handleDeleteInvestment = async (id: string) => {
  if (confirm('Are you sure?')) {
    try {
      await deleteItem(id);
    } catch (error) {
      // Error displayed to user
    }
  }
};
```

## Analytics Usage

### Calculate Portfolio Stats
```typescript
import { calculatePortfolioStats } from '../../lib/portfolio/analytics';

const { items } = usePortfolio();
const stats = calculatePortfolioStats(items);

console.log(stats.totalValue);    // $58,500.00
console.log(stats.totalGain);     // $5,000.00
console.log(stats.gainPercent);   // 9.35%
console.log(stats.assetCount);    // 4
```

### Calculate Asset Allocation
```typescript
import { calculateAllocation } from '../../lib/portfolio/analytics';

const allocation = calculateAllocation(items);
// [
//   { ticker: 'AAPL', name: 'Apple Inc.', value: 9270, percentOfTotal: 15.8 },
//   { ticker: 'MSFT', name: 'Microsoft Corp.', value: 12603, percentOfTotal: 21.5 },
//   ...
// ]
```

## Component Integration

### Modal Workflow in Portfolio Component
```typescript
const [isAddModalOpen, setIsAddModalOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
const { items, addItem, updateItem, deleteItem } = usePortfolio();

// Open add modal
<Button onClick={() => setIsAddModalOpen(true)}>
  Add Investment
</Button>

// Pass to modal
<AddInvestmentModal
  isOpen={isAddModalOpen}
  onClose={() => setIsAddModalOpen(false)}
  onAdd={addItem}
/>

// Edit workflow
<Button onClick={() => {
  setSelectedItem(item);
  setIsEditModalOpen(true);
}}>
  Edit
</Button>

// Delete with confirmation
<Button onClick={() => {
  if (confirm('Delete this investment?')) {
    deleteItem(item.id);
  }
}}>
  Delete
</Button>
```

## Home Dashboard Integration

### Real-Time Stats Display
```typescript
import { usePortfolio } from '../../hooks/usePortfolio';
import { calculatePortfolioStats } from '../../lib/portfolio/analytics';

export default function Home() {
  const { items } = usePortfolio();
  const stats = calculatePortfolioStats(items);

  return (
    <>
      <Card>
        <h4>${stats.totalValue.toLocaleString(undefined, { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        })}</h4>
      </Card>

      <Card>
        <h4>+${stats.totalGain.toLocaleString(undefined, { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        })} ({stats.gainPercent.toFixed(2)}%)</h4>
      </Card>

      <Card>
        <h4>{stats.assetCount} Assets</h4>
      </Card>
    </>
  );
}
```

## Future: API Adapter Implementation

### Step 1: Create API Adapter
```typescript
// src/services/portfolioService.ts (add new class)

export class APIPortfolioRepository implements PortfolioRepository {
  private baseUrl = 'https://api.example.com';

  async getAll(): Promise<PortfolioItem[]> {
    const response = await fetch(`${this.baseUrl}/portfolio`);
    if (!response.ok) throw new Error('Failed to fetch portfolio');
    return response.json();
  }

  async getById(id: string): Promise<PortfolioItem | null> {
    const response = await fetch(`${this.baseUrl}/portfolio/${id}`);
    if (!response.ok) return null;
    return response.json();
  }

  async add(item: Omit<PortfolioItem, 'id'>): Promise<PortfolioItem> {
    const response = await fetch(`${this.baseUrl}/portfolio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!response.ok) throw new Error('Failed to add item');
    return response.json();
  }

  async update(id: string, item: Omit<PortfolioItem, 'id'>): Promise<PortfolioItem> {
    const response = await fetch(`${this.baseUrl}/portfolio/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!response.ok) throw new Error('Failed to update item');
    return response.json();
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/portfolio/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete item');
  }
}
```

### Step 2: Switch Repository
```typescript
// One line change in src/services/portfolioService.ts

// Before:
export const portfolioRepository = new LocalStoragePortfolioRepository();

// After:
export const portfolioRepository = new APIPortfolioRepository();

// All components work unchanged! ✨
```

## Error Handling Examples

### Handling Errors in Components
```typescript
const { items, error, addItem } = usePortfolio();

if (error) {
  return (
    <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4">
      <p className="text-red-400">{error}</p>
    </div>
  );
}
```

### Try-Catch in Modal
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    await onAdd(formData);
    onClose(); // Close on success
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    setError(message);
  } finally {
    setLoading(false);
  }
};
```

## Type Definitions Reference

### PortfolioItem
```typescript
interface PortfolioItem {
  id: string;
  ticker: string;
  name: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  dailyChange: number;
}
```

### PortfolioStats
```typescript
interface PortfolioStats {
  totalValue: number;      // Sum of all holdings
  totalCost: number;       // Sum of all purchases
  totalGain: number;       // Profit/loss
  gainPercent: number;     // Return percentage
  assetCount: number;      // Number of investments
}
```

### AllocationBreakdown
```typescript
interface AllocationBreakdown {
  ticker: string;
  name: string;
  value: number;           // Dollar value
  percentOfTotal: number;  // Percentage of portfolio
}
```

## Validation Examples

### Form Validation in Modals
```typescript
const validateForm = (): boolean => {
  if (!formData.ticker.trim()) {
    setError('Ticker is required');
    return false;
  }

  const shares = parseFloat(formData.shares);
  if (!formData.shares.trim() || isNaN(shares) || shares <= 0) {
    setError('Shares must be a positive number');
    return false;
  }

  const currentPrice = parseFloat(formData.currentPrice);
  if (!formData.currentPrice.trim() || isNaN(currentPrice) || currentPrice <= 0) {
    setError('Current price must be a positive number');
    return false;
  }

  return true;
};
```

## Keyboard Navigation

### Modal Close with Escape
```typescript
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
```

### Backdrop Click to Close
```typescript
const handleBackdropClick = (e: React.MouseEvent) => {
  if (dialogRef.current && e.target === dialogRef.current) {
    onClose();
  }
};

<div
  ref={dialogRef}
  onClick={handleBackdropClick}
  className="fixed inset-0 z-50 bg-black/80"
>
  {/* Modal content */}
</div>
```
