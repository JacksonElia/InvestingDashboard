import { useReducer, useCallback, useEffect } from 'react';
import type { PortfolioItem } from '../types';
import { portfolioRepository } from '../services/portfolioService';
import { fetchStockSplits } from '../lib/stockPriceService';

interface PortfolioState {
  items: PortfolioItem[];
  loading: boolean;
  error: string | null;
  splitWarnings: string[];
}

type PortfolioAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SPLIT_WARNINGS'; payload: string[] }
  | { type: 'SET_ITEMS'; payload: PortfolioItem[] }
  | { type: 'ADD_ITEM'; payload: PortfolioItem }
  | { type: 'UPDATE_ITEM'; payload: PortfolioItem }
  | { type: 'DELETE_ITEM'; payload: string }
  | { type: 'OPTIMISTIC_ADD'; payload: PortfolioItem }
  | { type: 'OPTIMISTIC_UPDATE'; payload: PortfolioItem }
  | { type: 'OPTIMISTIC_DELETE'; payload: string };

function portfolioReducer(state: PortfolioState, action: PortfolioAction): PortfolioState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_SPLIT_WARNINGS':
      return { ...state, splitWarnings: action.payload };
    case 'SET_ITEMS':
      return { ...state, items: action.payload, error: null };
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.payload], error: null };
    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map(item => item.id === action.payload.id ? action.payload : item),
        error: null,
      };
    case 'DELETE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
        error: null,
      };
    case 'OPTIMISTIC_ADD':
      return { ...state, items: [...state.items, action.payload] };
    case 'OPTIMISTIC_UPDATE':
      return {
        ...state,
        items: state.items.map(item => item.id === action.payload.id ? action.payload : item),
      };
    case 'OPTIMISTIC_DELETE':
      return { ...state, items: state.items.filter(item => item.id !== action.payload) };
    default:
      return state;
  }
}

const initialState: PortfolioState = {
  items: [],
  loading: true,
  error: null,
  splitWarnings: [],
};

export interface UsePortfolioActions {
  fetchAll: () => Promise<void>;
  addItem: (item: Omit<PortfolioItem, 'id'>) => Promise<void>;
  updateItem: (id: string, item: Omit<PortfolioItem, 'id'>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export function usePortfolio(): PortfolioState & UsePortfolioActions {
  const [state, dispatch] = useReducer(portfolioReducer, initialState);

  const fetchAll = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const baseItems = await portfolioRepository.getAll();
      const splitWarnings: string[] = [];
      
      // Calculate split adjustments
      const itemsWithSplits = await Promise.all(baseItems.map(async (item) => {
        if (!item.buyDate) return item;
        
        try {
          const splits = await fetchStockSplits(item.ticker, item.buyDate);
          
          if (splits && splits.length > 0) {
            let splitMultiplier = 1;
            splits.forEach(split => {
              if (split.stockSplits) {
                const [numerator, denominator] = split.stockSplits.split(':').map(Number);
                if (numerator && denominator) {
                  splitMultiplier *= (numerator / denominator);
                }
              }
            });

            if (splitMultiplier !== 1) {
              return {
                ...item,
                adjustedShares: item.shares * splitMultiplier,
                adjustedAvgPrice: item.avgPrice / splitMultiplier,
                splitMultiplier,
                splitCount: splits.length
              };
            }
          }
        } catch (e) {
          console.error(`Failed to fetch splits for ${item.ticker}`, e);
          splitWarnings.push(
            `Could not verify splits for ${item.ticker} (${item.name}): ${e instanceof Error ? e.message : 'Unknown error'}`
          );
        }
        
        return item;
      }));

      dispatch({ type: 'SET_ITEMS', payload: itemsWithSplits });
      dispatch({ type: 'SET_SPLIT_WARNINGS', payload: splitWarnings });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch portfolio';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const addItem = useCallback(async (item: Omit<PortfolioItem, 'id'>) => {
    const optimisticItem: PortfolioItem = {
      ...item,
      id: `temp_${Date.now()}`,
    };

    dispatch({ type: 'OPTIMISTIC_ADD', payload: optimisticItem });

    try {
      const newItem = await portfolioRepository.add(item);
      dispatch({ type: 'UPDATE_ITEM', payload: newItem });
    } catch (error) {
      dispatch({ type: 'DELETE_ITEM', payload: optimisticItem.id });
      const errorMessage = error instanceof Error ? error.message : 'Failed to add item';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const updateItem = useCallback(async (id: string, item: Omit<PortfolioItem, 'id'>) => {
    const existingItem = state.items.find(currentItem => currentItem.id === id);
    const optimisticItem: PortfolioItem = existingItem
      ? { ...existingItem, ...item, id }
      : { ...item, id };
    const previousItems = state.items;

    dispatch({ type: 'OPTIMISTIC_UPDATE', payload: optimisticItem });

    try {
      const updated = await portfolioRepository.update(id, optimisticItem);
      dispatch({ type: 'UPDATE_ITEM', payload: updated });
    } catch (error) {
      dispatch({ type: 'SET_ITEMS', payload: previousItems });
      const errorMessage = error instanceof Error ? error.message : 'Failed to update item';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, [state.items]);

  const deleteItem = useCallback(async (id: string) => {
    const previousItems = state.items;

    dispatch({ type: 'OPTIMISTIC_DELETE', payload: id });

    try {
      await portfolioRepository.delete(id);
      dispatch({ type: 'DELETE_ITEM', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ITEMS', payload: previousItems });
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete item';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, [state.items]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    ...state,
    fetchAll,
    addItem,
    updateItem,
    deleteItem,
  };
}
