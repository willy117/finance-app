import { Transaction, Asset, Category } from '../types';

class DataService {
  private getWebAppUrl(): string {
    return localStorage.getItem('google_sheets_url') || import.meta.env.VITE_GOOGLE_SHEETS_WEB_APP_URL || '';
  }

  private get useLocalStorage(): boolean {
    return !this.getWebAppUrl();
  }

  async getTransactions(): Promise<Transaction[]> {
    if (this.useLocalStorage) {
      const data = localStorage.getItem('transactions');
      return data ? JSON.parse(data) : [];
    }
    try {
      const response = await fetch(`${this.getWebAppUrl()}?sheet=Transactions`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      if (Array.isArray(data)) return data;
      console.warn("API returned non-array for Transactions:", data);
      const localData = localStorage.getItem('transactions');
      return localData ? JSON.parse(localData) : [];
    } catch (e) {
      console.error("Failed to fetch from Google Sheets, using local storage", e);
      const data = localStorage.getItem('transactions');
      return data ? JSON.parse(data) : [];
    }
  }

  async saveTransactions(transactions: Transaction[]): Promise<void> {
    localStorage.setItem('transactions', JSON.stringify(transactions)); // Always save locally as backup
    if (this.useLocalStorage) return;
    
    try {
      await fetch(this.getWebAppUrl(), {
        method: 'POST',
        body: JSON.stringify({ sheet: 'Transactions', action: 'sync', payload: transactions }),
      });
    } catch (e) {
      console.error("Failed to save to Google Sheets", e);
    }
  }

  async getAssets(): Promise<Asset[]> {
    if (this.useLocalStorage) {
      const data = localStorage.getItem('assets');
      return data ? JSON.parse(data) : [];
    }
    try {
      const response = await fetch(`${this.getWebAppUrl()}?sheet=Assets`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      if (Array.isArray(data)) return data;
      console.warn("API returned non-array for Assets:", data);
      const localData = localStorage.getItem('assets');
      return localData ? JSON.parse(localData) : [];
    } catch (e) {
      console.error("Failed to fetch from Google Sheets, using local storage", e);
      const data = localStorage.getItem('assets');
      return data ? JSON.parse(data) : [];
    }
  }

  async saveAssets(assets: Asset[]): Promise<void> {
    localStorage.setItem('assets', JSON.stringify(assets)); // Always save locally as backup
    if (this.useLocalStorage) return;
    
    try {
      await fetch(this.getWebAppUrl(), {
        method: 'POST',
        body: JSON.stringify({ sheet: 'Assets', action: 'sync', payload: assets }),
      });
    } catch (e) {
      console.error("Failed to save to Google Sheets", e);
    }
  }

  async getCategories(): Promise<Category[]> {
    const defaultCategories = [
      { id: '1', type: 'income', name: '薪水' },
      { id: '2', type: 'income', name: '投資' },
      { id: '3', type: 'expense', name: '飲食' },
      { id: '4', type: 'expense', name: '交通' },
    ];
    
    if (this.useLocalStorage) {
      const data = localStorage.getItem('categories');
      return data ? JSON.parse(data) : defaultCategories;
    }
    try {
      const response = await fetch(`${this.getWebAppUrl()}?sheet=Categories`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) return data;
      if (Array.isArray(data)) return defaultCategories;
      console.warn("API returned non-array for Categories:", data);
      const localData = localStorage.getItem('categories');
      return localData ? JSON.parse(localData) : defaultCategories;
    } catch (e) {
      console.error("Failed to fetch from Google Sheets, using local storage", e);
      const data = localStorage.getItem('categories');
      return data ? JSON.parse(data) : defaultCategories;
    }
  }

  async saveCategories(categories: Category[]): Promise<void> {
    localStorage.setItem('categories', JSON.stringify(categories)); // Always save locally as backup
    if (this.useLocalStorage) return;
    
    try {
      await fetch(this.getWebAppUrl(), {
        method: 'POST',
        body: JSON.stringify({ sheet: 'Categories', action: 'sync', payload: categories }),
      });
    } catch (e) {
      console.error("Failed to save to Google Sheets", e);
    }
  }
}

export const dataService = new DataService();
