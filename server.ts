import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/twse/search", async (req, res) => {
    try {
      const response = await axios.get("https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL");
      res.json(response.data);
    } catch (error) {
      console.error("TWSE Search API Error:", error);
      res.status(500).json({ error: "Failed to fetch TWSE stocks" });
    }
  });

  app.get("/api/twse/quote", async (req, res) => {
    const { symbol } = req.query;
    if (!symbol || typeof symbol !== "string") {
      return res.status(400).json({ error: "Symbol is required" });
    }

    try {
      // The TWSE API requires a date, we can use today's date
      const date = new Date();
      let dateString = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
      
      let response = await axios.get(`https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&date=${dateString}&stockNo=${symbol}`);
      
      // If no data for current month (e.g. 1st of month is holiday), try previous month
      if (!response.data || !response.data.data || response.data.data.length === 0) {
        date.setMonth(date.getMonth() - 1);
        dateString = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}01`;
        response = await axios.get(`https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&date=${dateString}&stockNo=${symbol}`);
      }

      if (response.data && response.data.stat === "OK") {
        const data = response.data.data;
        if (data && data.length > 0) {
          // The last item in the array is the most recent trading day
          const latestDay = data[data.length - 1];
          // Data format: [Date, Trade Volume, Trade Value, Opening Price, Highest Price, Lowest Price, Closing Price, Change, Transaction]
          const closingPrice = parseFloat(latestDay[6].replace(/,/g, ''));
          const changeStr = latestDay[7];
          
          // The change might have HTML tags like <p style=color:red>+</p>X.XX
          let change = 0;
          const changeMatch = changeStr.match(/([+-]?\d+\.?\d*)/);
          if (changeMatch) {
             change = parseFloat(changeMatch[1]);
             if (changeStr.includes('green') || changeStr.includes('-')) {
                 change = -Math.abs(change);
             } else if (changeStr.includes('red') || changeStr.includes('+')) {
                 change = Math.abs(change);
             }
          }

          res.json({
            symbol,
            price: closingPrice,
            change: change,
            changePercent: (change / (closingPrice - change)) * 100
          });
        } else {
          res.status(404).json({ error: "No data found for this symbol" });
        }
      } else {
        res.status(400).json({ error: "Failed to fetch data from TWSE" });
      }
    } catch (error) {
      console.error("TWSE API Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
