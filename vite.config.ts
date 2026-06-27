import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { lookupStockData } from './src/lib/stockPriceLookup'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'dev-stock-price-api',
      configureServer(server) {
        server.middlewares.use('/api/stock-price', async (req, res) => {
          if (req.method !== 'GET') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }

          const url = new URL(req.url ?? '', 'http://localhost');
          const tickers = url.searchParams.get('tickers');

          if (!tickers) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'tickers query parameter is required (comma-separated)' }));
            return;
          }

          const tickerList = tickers
            .split(',')
            .map((ticker) => ticker.trim().toUpperCase())
            .filter((ticker) => ticker.length > 0);

          if (tickerList.length === 0) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'At least one ticker is required' }));
            return;
          }

          const prices = await lookupStockData(tickerList);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            prices: prices.prices,
            names: prices.names,
            timestamp: new Date().toISOString(),
          }));
        });
      },
    },
  ],
})
