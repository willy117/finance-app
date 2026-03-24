import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, AlertCircle, Database } from 'lucide-react';

export default function Settings() {
  const [url, setUrl] = useState('');
  const [saved, setSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  useEffect(() => {
    const savedUrl = localStorage.getItem('google_sheets_url') || '';
    setUrl(savedUrl);
  }, []);

  const handleSave = () => {
    localStorage.setItem('google_sheets_url', url);
    setSaved(true);
    setTestStatus('idle');
    setTimeout(() => setSaved(false), 3000);
    // Reload page to apply changes
    window.location.reload();
  };

  const handleTest = async () => {
    if (!url) return;
    
    setTestStatus('testing');
    try {
      const response = await fetch(`${url}?sheet=Categories`);
      if (response.ok) {
        setTestStatus('success');
      } else {
        setTestStatus('error');
      }
    } catch (error) {
      console.error('Test failed:', error);
      setTestStatus('error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">系統設定</h2>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 text-green-600 rounded-lg">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Google Sheets 資料庫串接</h3>
            <p className="text-sm text-gray-500">設定 Google Apps Script Web App 網址以啟用雲端同步</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Web App 網址 (URL)
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
            <h4 className="font-semibold mb-2">部署步驟：</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>在 Google 試算表中點擊「擴充功能」 {'>'} 「Apps Script」</li>
              <li>將系統提供的 <code>google-apps-script.js</code> 程式碼貼上並儲存</li>
              <li>點擊右上角「部署」 {'>'} 「新增部署作業」</li>
              <li>選擇類型「網頁應用程式」</li>
              <li>執行身分選擇「您自己」，誰可以存取選擇「所有人」</li>
              <li>點擊「部署」，授權後複製「網頁應用程式網址」並貼到上方欄位</li>
            </ol>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Save className="w-4 h-4" />
              儲存設定
            </button>
            
            <button
              onClick={handleTest}
              disabled={!url || testStatus === 'testing'}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
            >
              {testStatus === 'testing' ? '測試中...' : '測試連線'}
            </button>

            {saved && (
              <span className="flex items-center text-green-600 text-sm font-medium">
                <CheckCircle className="w-4 h-4 mr-1" />
                已儲存
              </span>
            )}
            
            {testStatus === 'success' && (
              <span className="flex items-center text-green-600 text-sm font-medium">
                <CheckCircle className="w-4 h-4 mr-1" />
                連線成功
              </span>
            )}
            
            {testStatus === 'error' && (
              <span className="flex items-center text-red-600 text-sm font-medium">
                <AlertCircle className="w-4 h-4 mr-1" />
                連線失敗，請檢查網址或權限設定
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
