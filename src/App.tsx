import React, { useState, useEffect } from 'react';
import { Wallet, PieChart, TrendingUp, FileText, Settings as SettingsIcon } from 'lucide-react';
import IncomeExpense from './components/IncomeExpense';
import AssetManagement from './components/AssetManagement';
import MarketTrends from './components/MarketTrends';
import FinancialReports from './components/FinancialReports';
import Settings from './components/Settings';
import { dataService } from './services/googleSheets';
import { Transaction, Asset, Category } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState('income_expense');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [txs, asts, cats] = await Promise.all([
          dataService.getTransactions(),
          dataService.getAssets(),
          dataService.getCategories()
        ]);
        setTransactions(txs);
        setAssets(asts);
        setCategories(cats);
      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveTransactions = async (newTxs: Transaction[]) => {
    setTransactions(newTxs);
    await dataService.saveTransactions(newTxs);
  };

  const handleSaveAssets = async (newAssets: Asset[]) => {
    setAssets(newAssets);
    await dataService.saveAssets(newAssets);
  };

  const handleSaveCategories = async (newCats: Category[]) => {
    setCategories(newCats);
    await dataService.saveCategories(newCats);
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-500">載入中...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
            <Wallet className="w-6 h-6" />
            個人資產管理系統
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <NavItem 
            icon={<FileText />} 
            label="收支管理" 
            active={activeTab === 'income_expense'} 
            onClick={() => setActiveTab('income_expense')} 
            style={{ fontSize: '20px' }}
          />
          <NavItem 
            icon={<Wallet />} 
            label="資產管理" 
            active={activeTab === 'assets'} 
            onClick={() => setActiveTab('assets')} 
            style={{ fontSize: '20px', fontWeight: 'normal', color: '#a63c76' }}
          />
          <NavItem 
            icon={<TrendingUp />} 
            label="市場趨勢" 
            active={activeTab === 'market'} 
            onClick={() => setActiveTab('market')} 
            style={{ fontSize: '20px' }}
          />
          <NavItem 
            icon={<PieChart />} 
            label="財務報表" 
            active={activeTab === 'reports'} 
            onClick={() => setActiveTab('reports')} 
            style={{ fontSize: '20px' }}
          />
          <NavItem 
            icon={<SettingsIcon />} 
            label="系統設定" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
            style={{ fontSize: '20px' }}
          />
        </nav>
        <div className="p-4 border-t border-gray-200 text-xs text-gray-400">
          預設幣值：新台幣 (TWD)
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-6xl mx-auto">
          {activeTab === 'income_expense' && (
            <IncomeExpense 
              transactions={transactions} 
              categories={categories}
              onSaveTransactions={handleSaveTransactions}
              onSaveCategories={handleSaveCategories}
            />
          )}
          {activeTab === 'assets' && (
            <AssetManagement 
              assets={assets} 
              onSaveAssets={handleSaveAssets} 
            />
          )}
          {activeTab === 'market' && (
            <MarketTrends assets={assets} />
          )}
          {activeTab === 'reports' && (
            <FinancialReports 
              transactions={transactions} 
              assets={assets} 
            />
          )}
          {activeTab === 'settings' && (
            <Settings />
          )}
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, style }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, style?: React.CSSProperties }) {
  return (
    <button
      onClick={onClick}
      style={style}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        active 
          ? 'bg-blue-50 text-blue-600 font-medium' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
      {label}
    </button>
  );
}

