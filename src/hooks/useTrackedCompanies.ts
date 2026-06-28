import { useState, useEffect } from 'react';

export interface TrackedCompany {
  id: string;
  ticker: string;
  name: string;
  industry: string;
  thesis: string;
  potentialScore: number;
  url?: string;
}

const STORAGE_KEY = 'tracked_companies';

export function useTrackedCompanies() {
  const [trackedCompanies, setTrackedCompanies] = useState<TrackedCompany[]>([]);

  useEffect(() => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        setTrackedCompanies(JSON.parse(data));
      } catch (e) {
        console.error('Failed to parse tracked companies from local storage');
      }
    }
  }, []);

  const addTrackedCompany = (company: Omit<TrackedCompany, 'id'> | TrackedCompany) => {
    setTrackedCompanies(prev => {
      // Prevent duplicates by ticker
      if (prev.some(c => c.ticker === company.ticker)) {
        return prev;
      }
      const newCompany = { ...company, id: 'id' in company ? company.id : crypto.randomUUID() };
      const updated = [...prev, newCompany];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const removeTrackedCompany = (ticker: string) => {
    setTrackedCompanies(prev => {
      const updated = prev.filter(c => c.ticker !== ticker);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const isTracked = (ticker: string) => {
    return trackedCompanies.some(c => c.ticker === ticker);
  };

  return {
    trackedCompanies,
    addTrackedCompany,
    removeTrackedCompany,
    isTracked
  };
}
