import React, { useState, useEffect } from 'react';
import { Asset, MarketData } from '../types';
import { marketApi } from '../services/marketApi';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface Props {
  assets: Asset[];
}

export default function MarketTrends({ assets }: Props) {
  const [marketData, setMarketData] = useState<Record<string, MarketData>>({});
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMarketData = async () => {
    setLoading(true);
    const newData: Record<string, MarketData> = {};
    const now = new Date().toISOString();

    try {
      // Fetch TWSE data via backend proxy to TWSE API
      const twAssets = assets.filter(a => a.type === 'stock_tw');
      for (const asset of twAssets) {
        const symbol = asset.name.split(' ')[0];
        const quote = await marketApi.getTwseStockQuote(symbol);
        if (quote && quote.price) {
          newData[asset.name] = {
            symbol: asset.name,
            price: quote.price,
            change: quote.change,
            changePercent: quote.changePercent,
            updatedAt: now
          };
        }
      }

      // Fetch US data
      const usAssets = assets.filter(a => a.type === 'stock_us');
      for (const asset of usAssets) {
        const quote = await marketApi.getUsStockQuote(asset.name);
        if (quote && quote.c) {
          newData[asset.name] = {
            symbol: asset.name,
            price: quote.c,
            change: quote.d,
            changePercent: quote.dp,
            updatedAt: now
          };
        }
      }

      // Fetch Forex data
      const forexAssets = assets.filter(a => a.type === 'forex');
      if (forexAssets.length > 0) {
        const rates = await marketApi.getForexRates();
        if (rates) {
          forexAssets.forEach(asset => {
            const rate = rates[asset.name];
            if (rate) {
              newData[asset.name] = {
                symbol: asset.name,
                price: 1 / rate, // TWD per 1 unit of foreign currency
                change: 0, // Free API might not have daily change
                changePercent: 0,
                updatedAt: now
              };
            }
          });
        }
      }

      setMarketData(newData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching market data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
  }, [assets]);

  const renderAssetGroup = (title: string, type: 'stock_tw' | 'stock_us' | 'forex') => {
    const groupAssets = assets.filter(a => a.type === type);
    if (groupAssets.length === 0) return null;

    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupAssets.map(asset => {
            const data = marketData[asset.name];
            const currentValue = data ? data.price * asset.quantity : 0;
            const costValue = asset.averagePrice ? asset.averagePrice * asset.quantity : 0;
            const profitLoss = currentValue - costValue;
            const profitLossPercent = costValue > 0 ? (profitLoss / costValue) * 100 : 0;

            return (
              <div key={asset.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-900">{asset.name}</h4>
                  {data && (
                    <span className={`flex items-center text-sm font-medium ${data.change >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {data.change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                      {Math.abs(data.changePercent).toFixed(2)}%
                    </span>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">目前報價</span>
                    <span className="font-medium">
                      {data ? (type === 'stock_us' ? '$' : '') + data.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '載入中...'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">持有數量</span>
                    <span className="font-medium">{asset.quantity.toLocaleString()}</span>
                  </div>
                  <div className="pt-3 border-t border-gray-100 flex justify-between items-end">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">總市值 (TWD)</div>
                      <div className="text-lg font-bold text-gray-900">
                        ${(type === 'stock_us' && data && marketData['USD'] ? currentValue * marketData['USD'].price : currentValue).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                    {asset.averagePrice && (
                      <div className={`text-sm font-medium ${profitLoss >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {profitLoss >= 0 ? '+' : ''}{profitLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })} 
                        ({profitLossPercent >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">市場趨勢與資產價值</h2>
        <button 
          onClick={fetchMarketData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {lastUpdated ? `最後更新: ${lastUpdated.toLocaleTimeString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false })}` : '更新報價'}
        </button>
      </div>

      {assets.filter(a => a.type !== 'bank').length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center text-gray-500">
          請先至「資產管理」新增股票或外幣資產
        </div>
      ) : (
        <>
          {renderAssetGroup('台灣股市', 'stock_tw')}
          {renderAssetGroup('美國股市', 'stock_us')}
          {renderAssetGroup('外幣資產', 'forex')}
        </>
      )}
    </div>
  );
}
