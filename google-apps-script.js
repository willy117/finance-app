/**
 * Google Apps Script for Personal Asset Management System
 * 
 * 部署步驟：
 * 1. 在 Google 試算表中點擊「擴充功能」->「Apps Script」
 * 2. 將此程式碼貼上並儲存
 * 3. 點擊右上角「部署」->「新增部署作業」
 * 4. 選擇類型「網頁應用程式」
 * 5. 執行身分選擇「您自己」，誰可以存取選擇「所有人」
 * 6. 點擊「部署」，授權後複製「網頁應用程式網址」
 * 7. 將網址貼到 AI Studio 系統的環境變數 VITE_GOOGLE_SHEETS_WEB_APP_URL 中
 */

function doGet(e) {
  var sheetName = e.parameter.sheet;
  if (!sheetName) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Missing sheet parameter" })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Sheet not found" })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var result = [];
  
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    result.push(obj);
  }
  
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var requestData = JSON.parse(e.postData.contents);
    var sheetName = requestData.sheet;
    var action = requestData.action; // 'insert', 'update', 'delete', 'sync'
    var payload = requestData.payload;
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) {
      // Create sheet if it doesn't exist
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(sheetName);
      if (payload && payload.length > 0) {
        var headers = Object.keys(payload[0]);
        sheet.appendRow(headers);
      }
    }
    
    if (action === 'sync') {
      // Clear all and rewrite
      sheet.clear();
      if (payload && payload.length > 0) {
        var headers = Object.keys(payload[0]);
        sheet.appendRow(headers);
        var rows = payload.map(function(item) {
          return headers.map(function(header) { return item[header]; });
        });
        sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Synced successfully" })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Unknown action" })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
