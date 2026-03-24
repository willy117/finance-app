import axios from 'axios';

const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;

export interface TwseStock {
  Code: string;
  Name: string;
  TradeVolume: string;
  TradeValue: string;
  OpeningPrice: string;
  HighestPrice: string;
  LowestPrice: string;
  ClosingPrice: string;
  Change: string;
  Transaction: string;
}

class MarketApi {
  private twseCache: TwseStock[] | null = null;
  private twseLastFetch: number = 0;

  async getTwseStocks(): Promise<TwseStock[]> {
    const now = Date.now();
    if (this.twseCache && now - this.twseLastFetch < 3600000) {
      return this.twseCache;
    }
    try {
      const response = await axios.get('/api/twse/search');
      this.twseCache = response.data;
      this.twseLastFetch = now;
      return this.twseCache || [];
    } catch (error) {
      console.error("Failed to fetch TWSE stocks", error);
      return [];
    }
  }

  async searchTwseStock(query: string): Promise<TwseStock[]> {
    if (query.length < 2) return [];
    const stocks = await this.getTwseStocks();
    return stocks.filter(s => s.Code.startsWith(query) || s.Name.includes(query)).slice(0, 10);
  }

  async getTwseStockQuote(symbol: string): Promise<any> {
    try {
      const response = await axios.get(`/api/twse/quote?symbol=${symbol}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get quote for TWSE ${symbol}`, error);
      return null;
    }
  }

  async searchUsStock(query: string): Promise<any[]> {
    if (query.length < 2 || !FINNHUB_API_KEY) return [];
    try {
      const response = await axios.get(`https://finnhub.io/api/v1/search?q=${query}&token=${FINNHUB_API_KEY}`);
      return response.data.result || [];
    } catch (error) {
      console.error("Failed to search US stocks", error);
      return [];
    }
  }

  async getUsStockQuote(symbol: string): Promise<any> {
    if (!FINNHUB_API_KEY) return null;
    try {
      const response = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get quote for ${symbol}`, error);
      return null;
    }
  }

  async getForexRates(): Promise<any> {
    if (!FINNHUB_API_KEY) return null;
    try {
      // Finnhub forex rates require premium for some pairs, but we can try basic ones or use another free API
      // Actually, Finnhub provides forex symbols. Let's use a free exchange rate API for simplicity if Finnhub doesn't work well
      const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/TWD`);
      return response.data.rates;
    } catch (error) {
      console.error("Failed to get forex rates", error);
      return null;
    }
  }
}

export const marketApi = new MarketApi();
