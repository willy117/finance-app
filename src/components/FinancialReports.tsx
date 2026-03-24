import React, { useState, useMemo } from 'react';
import { Transaction, Asset } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { GoogleGenAI } from '@google/genai';
import { Sparkles } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  assets: Asset[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function FinancialReports({ transactions, assets }: Props) {
  const [advice, setAdvice] = useState<string>('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  const assetData = useMemo(() => {
    const data: Record<string, number> = {};
    assets.forEach(a => {
      // Simplification: assume quantity is value for bank/forex, and averagePrice * quantity for stocks
      let value = a.quantity;
      if (a.type === 'stock_tw' || a.type === 'stock_us') {
        value = (a.averagePrice || 0) * a.quantity;
      }
      if (a.type === 'stock_us') {
        value *= 32; // Rough exchange rate for USD to TWD
      }
      data[a.type] = (data[a.type] || 0) + value;
    });

    return Object.entries(data).map(([name, value]) => ({
      name: name === 'bank' ? '銀行帳戶' : name === 'stock_tw' ? '台股' : name === 'stock_us' ? '美股' : '外幣',
      value
    })).filter(d => d.value > 0);
  }, [assets]);

  const expenseData = useMemo(() => {
    const data: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      data[t.category] = (data[t.category] || 0) + t.amount;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
  }, [transactions]);

  const totalAssets = assetData.reduce((sum, item) => sum + item.value, 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const generateAdvice = async () => {
    setLoadingAdvice(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `
        我是一位使用者，請根據我的財務狀況給予理財與投資建議。
        總資產：${totalAssets} TWD
        資產配置：${JSON.stringify(assetData)}
        總收入：${totalIncome} TWD
        總支出：${totalExpense} TWD
        支出分佈：${JSON.stringify(expenseData)}
        
        請用繁體中文，給出 3 點具體、實用的理財建議。
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setAdvice(response.text || '無法產生建議');
    } catch (error) {
      console.error("Failed to generate advice", error);
      setAdvice('產生建議時發生錯誤，請確認 API Key 是否設定正確。');
    } finally {
      setLoadingAdvice(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">財務報表</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-1">總資產 (估值)</h3>
          <p className="text-3xl font-bold text-gray-900">${totalAssets.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-1">總收入</h3>
          <p className="text-3xl font-bold text-green-600">${totalIncome.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-1">總支出</h3>
          <p className="text-3xl font-bold text-red-600">${totalExpense.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">資產配置</h3>
          {assetData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {assetData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">尚無資產資料</div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">支出分佈</h3>
          {expenseData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">尚無支出資料</div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl border border-blue-100">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-600" />
              AI 理財顧問
            </h3>
            <p className="text-blue-700 mt-1">根據您的資產與收支狀況，提供專屬理財建議</p>
          </div>
          <button
            onClick={generateAdvice}
            disabled={loadingAdvice}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loadingAdvice ? '分析中...' : '產生建議'}
          </button>
        </div>

        {advice && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-100">
            <div className="prose prose-blue max-w-none whitespace-pre-wrap">
              {advice}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
