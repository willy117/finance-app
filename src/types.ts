export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  date: string;
  note: string;
}

export type AssetType = 'bank' | 'stock_tw' | 'stock_us' | 'forex';

export interface Asset {
  id: string;
  type: AssetType;
  name: string; // e.g. "台新銀行", "2330", "AAPL", "USD"
  quantity: number; // 數量或金額
  averagePrice?: number; // 股票買入均價
  currency?: string; // 幣別
}

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  updatedAt: string;
}

export interface Category {
  id: string;
  type: TransactionType;
  name: string;
}
