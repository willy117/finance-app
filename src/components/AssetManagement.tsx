import React, { useState, useEffect } from 'react';
import { Asset } from '../types';
import { Plus, Trash2, Edit2, Search } from 'lucide-react';
import { marketApi, TwseStock } from '../services/marketApi';

interface Props {
  assets: Asset[];
  onSaveAssets: (assets: Asset[]) => void;
}

export default function AssetManagement({ assets, onSaveAssets }: Props) {
  const [activeTab, setActiveTab] = useState<'bank' | 'stock_tw' | 'stock_us' | 'forex'>('bank');
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<Asset>>({
    type: 'bank',
    name: '',
    quantity: 0,
    averagePrice: 0,
    currency: 'TWD'
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [twseResults, setTwseResults] = useState<TwseStock[]>([]);
  const [usResults, setUsResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [forexResults, setForexResults] = useState<{code: string, name: string}[]>([]);

  const COMMON_FOREX = [
    { code: 'USD', name: '美元' },
    { code: 'EUR', name: '歐元' },
    { code: 'JPY', name: '日圓' },
    { code: 'GBP', name: '英鎊' },
    { code: 'AUD', name: '澳幣' },
    { code: 'CAD', name: '加幣' },
    { code: 'CHF', name: '瑞士法郎' },
    { code: 'CNY', name: '人民幣' },
    { code: 'HKD', name: '港幣' },
    { code: 'SGD', name: '新加坡幣' }
  ];

  useEffect(() => {
    setFormData(prev => ({ ...prev, type: activeTab, name: '', quantity: 0, averagePrice: 0, currency: activeTab === 'forex' ? 'USD' : 'TWD' }));
    setSearchQuery('');
    setTwseResults([]);
    setUsResults([]);
    setForexResults([]);
  }, [activeTab]);

  useEffect(() => {
    const search = async () => {
      if (searchQuery.length < 1) {
        setTwseResults([]);
        setUsResults([]);
        setForexResults([]);
        return;
      }
      setIsSearching(true);
      if (activeTab === 'stock_tw' && searchQuery.length >= 2) {
        const res = await marketApi.searchTwseStock(searchQuery);
        setTwseResults(res);
      } else if (activeTab === 'stock_us' && searchQuery.length >= 2) {
        const res = await marketApi.searchUsStock(searchQuery);
        setUsResults(res);
      } else if (activeTab === 'forex') {
        const query = searchQuery.toUpperCase();
        const res = COMMON_FOREX.filter(f => f.code.includes(query) || f.name.includes(query));
        setForexResults(res);
      }
      setIsSearching(false);
    };
    
    const timeoutId = setTimeout(search, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, activeTab]);

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    const newAsset: Asset = {
      id: Date.now().toString(),
      type: activeTab,
      name: formData.name,
      quantity: Number(formData.quantity),
      averagePrice: formData.averagePrice ? Number(formData.averagePrice) : undefined,
      currency: formData.currency || 'TWD'
    };
    
    onSaveAssets([...assets, newAsset]);
    setIsAdding(false);
    setFormData({ ...formData, name: '', quantity: 0, averagePrice: 0 });
    setSearchQuery('');
  };

  const handleDelete = (id: string) => {
    if (confirm('確定要刪除這筆資產嗎？')) {
      onSaveAssets(assets.filter(a => a.id !== id));
    }
  };

  const filteredAssets = assets.filter(a => a.type === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">資產管理</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          新增資產
        </button>
      </div>

      <div className="flex space-x-1 bg-gray-200 p-1 rounded-xl w-full max-w-md">
        {[
          { id: 'bank', label: '銀行帳戶' },
          { id: 'stock_tw', label: '台灣股市' },
          { id: 'stock_us', label: '美國股市' },
          { id: 'forex', label: '外幣' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.id 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isAdding && (
        <form onSubmit={handleAddAsset} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {activeTab === 'bank' ? '帳戶名稱' : activeTab === 'forex' ? '外幣代碼 (如 USD, JPY)' : '股票代碼/名稱'}
            </label>
            <div className="relative">
              <input 
                type="text" 
                value={activeTab === 'bank' ? formData.name : searchQuery}
                onChange={e => {
                  if (activeTab === 'bank') {
                    setFormData({...formData, name: e.target.value});
                  } else {
                    setSearchQuery(e.target.value);
                  }
                }}
                placeholder={activeTab === 'bank' ? '例如：台新銀行 Richart' : '輸入代碼或名稱...'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-10"
                required
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
            
            {/* Autocomplete Dropdown */}
            {(twseResults.length > 0 || usResults.length > 0 || forexResults.length > 0) && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {activeTab === 'stock_tw' && twseResults.map(stock => (
                  <div 
                    key={stock.Code}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex justify-between"
                    onClick={() => {
                      setFormData({...formData, name: `${stock.Code} ${stock.Name}`});
                      setSearchQuery(`${stock.Code} ${stock.Name}`);
                      setTwseResults([]);
                    }}
                  >
                    <span className="font-medium">{stock.Code}</span>
                    <span className="text-gray-600">{stock.Name}</span>
                  </div>
                ))}
                {activeTab === 'stock_us' && usResults.map(stock => (
                  <div 
                    key={stock.symbol}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex justify-between"
                    onClick={() => {
                      setFormData({...formData, name: stock.symbol});
                      setSearchQuery(stock.symbol);
                      setUsResults([]);
                    }}
                  >
                    <span className="font-medium">{stock.symbol}</span>
                    <span className="text-gray-600">{stock.description}</span>
                  </div>
                ))}
                {activeTab === 'forex' && forexResults.map(forex => (
                  <div 
                    key={forex.code}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex justify-between"
                    onClick={() => {
                      setFormData({...formData, name: forex.code});
                      setSearchQuery(forex.code);
                      setForexResults([]);
                    }}
                  >
                    <span className="font-medium">{forex.code}</span>
                    <span className="text-gray-600">{forex.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {activeTab === 'bank' ? '餘額' : activeTab === 'forex' ? '數量' : '持有股數'}
            </label>
            <input 
              type="number" 
              step="any"
              min="0"
              value={formData.quantity || ''}
              onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>

          {(activeTab === 'stock_tw' || activeTab === 'stock_us' || activeTab === 'forex') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                買入均價 {activeTab === 'stock_us' ? '(USD)' : activeTab === 'forex' ? '(TWD)' : '(TWD)'}
              </label>
              <input 
                type="number" 
                step="any"
                min="0"
                value={formData.averagePrice || ''}
                onChange={e => setFormData({...formData, averagePrice: Number(e.target.value)})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          )}

          <div className="md:col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              取消
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              儲存
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-3 text-sm font-medium text-gray-500">名稱/代碼</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500 text-right">
                {activeTab === 'bank' ? '餘額' : '數量'}
              </th>
              {(activeTab === 'stock_tw' || activeTab === 'stock_us' || activeTab === 'forex') && (
                <th className="px-6 py-3 text-sm font-medium text-gray-500 text-right">買入均價</th>
              )}
              <th className="px-6 py-3 text-sm font-medium text-gray-500 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredAssets.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  尚無資產紀錄
                </td>
              </tr>
            ) : (
              filteredAssets.map(asset => (
                <tr key={asset.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{asset.name}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900">
                    {asset.quantity.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                  {(activeTab === 'stock_tw' || activeTab === 'stock_us' || activeTab === 'forex') && (
                    <td className="px-6 py-4 text-sm text-right text-gray-500">
                      {asset.averagePrice ? asset.averagePrice.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '-'}
                    </td>
                  )}
                  <td className="px-6 py-4 text-sm text-center">
                    <button onClick={() => handleDelete(asset.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
