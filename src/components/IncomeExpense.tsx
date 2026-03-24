import React, { useState } from 'react';
import { Transaction, Category } from '../types';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  onSaveTransactions: (txs: Transaction[]) => void;
  onSaveCategories: (cats: Category[]) => void;
}

export default function IncomeExpense({ transactions, categories, onSaveTransactions, onSaveCategories }: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  
  const formatDisplayDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      // Format to YYYY-MM-DD in Taipei time using en-CA locale which natively uses this format
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Taipei',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      return formatter.format(date);
    } catch (e) {
      return dateString;
    }
  };

  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: 'expense',
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: 0,
    category: '',
    note: ''
  });

  const [newCategory, setNewCategory] = useState({ type: 'expense' as 'income' | 'expense', name: '' });

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.category) return;
    
    const newTx: Transaction = {
      id: Date.now().toString(),
      type: formData.type as 'income' | 'expense',
      category: formData.category,
      amount: Number(formData.amount),
      date: formData.date || format(new Date(), 'yyyy-MM-dd'),
      note: formData.note || ''
    };
    
    onSaveTransactions([newTx, ...transactions]);
    setIsAdding(false);
    setFormData({ ...formData, amount: 0, note: '' });
  };

  const handleDelete = (id: string) => {
    if (confirm('確定要刪除這筆紀錄嗎？')) {
      onSaveTransactions(transactions.filter(t => t.id !== id));
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name) return;
    const cat: Category = {
      id: Date.now().toString(),
      type: newCategory.type,
      name: newCategory.name
    };
    onSaveCategories([...categories, cat]);
    setNewCategory({ ...newCategory, name: '' });
  };

  const handleDeleteCategory = (id: string) => {
    onSaveCategories(categories.filter(c => c.id !== id));
  };

  const filteredCategories = categories.filter(c => c.type === formData.type);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">收支管理</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsManagingCategories(!isManagingCategories)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            管理類別
          </button>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            新增紀錄
          </button>
        </div>
      </div>

      {isManagingCategories && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">管理類別</h3>
          <form onSubmit={handleAddCategory} className="flex gap-4 mb-6">
            <select 
              value={newCategory.type}
              onChange={e => setNewCategory({...newCategory, type: e.target.value as any})}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="expense">支出</option>
              <option value="income">收入</option>
            </select>
            <input 
              type="text" 
              placeholder="類別名稱" 
              value={newCategory.name}
              onChange={e => setNewCategory({...newCategory, name: e.target.value})}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
            />
            <button type="submit" className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900">
              新增
            </button>
          </form>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-red-600 mb-2">支出類別</h4>
              <ul className="space-y-2">
                {categories.filter(c => c.type === 'expense').map(c => (
                  <li key={c.id} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded">
                    <span>{c.name}</span>
                    <button onClick={() => handleDeleteCategory(c.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-green-600 mb-2">收入類別</h4>
              <ul className="space-y-2">
                {categories.filter(c => c.type === 'income').map(c => (
                  <li key={c.id} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded">
                    <span>{c.name}</span>
                    <button onClick={() => handleDeleteCategory(c.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {isAdding && (
        <form onSubmit={handleAddTransaction} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">類型</label>
            <select 
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value as any, category: ''})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="expense">支出</option>
              <option value="income">收入</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
            <input 
              type="date" 
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">類別</label>
            <select 
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            >
              <option value="">請選擇類別</option>
              {filteredCategories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">金額 (TWD)</label>
            <input 
              type="number" 
              min="0"
              value={formData.amount || ''}
              onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
            <input 
              type="text" 
              value={formData.note}
              onChange={e => setFormData({...formData, note: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
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
              <th className="px-6 py-3 text-sm font-medium text-gray-500">日期</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">類型</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">類別</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">備註</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500 text-right">金額</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  尚無收支紀錄
                </td>
              </tr>
            ) : (
              transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{formatDisplayDate(tx.date)}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      tx.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {tx.type === 'income' ? '收入' : '支出'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{tx.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{tx.note}</td>
                  <td className={`px-6 py-4 text-sm font-medium text-right ${
                    tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    <button onClick={() => handleDelete(tx.id)} className="text-gray-400 hover:text-red-500 transition-colors">
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
