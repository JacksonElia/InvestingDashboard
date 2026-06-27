import type { PortfolioItem } from '../types';

export interface PortfolioRepository {
  getAll(): Promise<PortfolioItem[]>;
  getById(id: string): Promise<PortfolioItem | null>;
  add(item: Omit<PortfolioItem, 'id'>): Promise<PortfolioItem>;
  update(id: string, item: Omit<PortfolioItem, 'id'>): Promise<PortfolioItem>;
  delete(id: string): Promise<void>;
}

export class LocalStoragePortfolioRepository implements PortfolioRepository {
  private readonly key = 'portfolio_items';

  async getAll(): Promise<PortfolioItem[]> {
    const data = localStorage.getItem(this.key);
    return data ? JSON.parse(data) : [];
  }

  async getById(id: string): Promise<PortfolioItem | null> {
    const items = await this.getAll();
    return items.find(item => item.id === id) || null;
  }

  async add(item: Omit<PortfolioItem, 'id'>): Promise<PortfolioItem> {
    const items = await this.getAll();
    const newItem: PortfolioItem = {
      ...item,
      id: Date.now().toString(),
    };
    items.push(newItem);
    localStorage.setItem(this.key, JSON.stringify(items));
    return newItem;
  }

  async update(id: string, item: Omit<PortfolioItem, 'id'>): Promise<PortfolioItem> {
    const items = await this.getAll();
    const index = items.findIndex(i => i.id === id);
    
    if (index === -1) {
      throw new Error(`Portfolio item with id ${id} not found`);
    }

    const updatedItem: PortfolioItem = { ...item, id };
    items[index] = updatedItem;
    localStorage.setItem(this.key, JSON.stringify(items));
    return updatedItem;
  }

  async delete(id: string): Promise<void> {
    const items = await this.getAll();
    const filtered = items.filter(item => item.id !== id);
    localStorage.setItem(this.key, JSON.stringify(filtered));
  }
}

export const portfolioRepository = new LocalStoragePortfolioRepository();
