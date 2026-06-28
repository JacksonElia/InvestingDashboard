import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { lookupStockData } from './src/lib/stockPriceLookup'
import * as dotenv from 'dotenv';
dotenv.config(); // Load .env file for local development

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'dev-stock-price-api',
      configureServer(server) {
        // Stock Price Mock API
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

        // News Mock API
        server.middlewares.use('/api/news', async (req, res) => {
          if (req.method !== 'GET') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }

          const url = new URL(req.url ?? '', 'http://localhost');
          const tickersRaw = url.searchParams.get('tickers');
          
          if (!tickersRaw) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing tickers parameter' }));
            return;
          }

          const tickers = tickersRaw.split(',').map(t => t.trim()).filter(Boolean);
          if (tickers.length === 0) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ top3: [], theRest: [] }));
            return;
          }

          const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
          const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

          if (!TAVILY_API_KEY || !GEMINI_API_KEY) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ 
              error: 'Server is missing API keys. Please configure TAVILY_API_KEY and GEMINI_API_KEY in .env' 
            }));
            return;
          }

          try {
            // 1. Fetch News from Tavily
            const query = `Latest financial and business news for stocks: ${tickers.join(', ')}`;
            const tavilyResponse = await fetch('https://api.tavily.com/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                api_key: TAVILY_API_KEY,
                query: query,
                search_depth: 'advanced',
                include_images: false,
                include_answer: false,
                days_back: 3,
                max_results: 15,
              }),
            });

            if (!tavilyResponse.ok) {
              throw new Error(`Tavily API returned ${tavilyResponse.status}`);
            }

            const tavilyData = await tavilyResponse.json();
            const searchResults = tavilyData.results || [];

            if (searchResults.length === 0) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ top3: [], theRest: [] }));
              return;
            }

            // 2. Process with Google Gemini 1.5 Flash
            const aiPrompt = `You are an expert financial news analyst. I am providing you with a list of recent news articles related to the following stock tickers: ${tickers.join(', ')}.
Your job is to read these articles, determine which ones are the most impactful/important for investors, and return a structured JSON response.

Here are the articles:
${JSON.stringify(searchResults, null, 2)}

Return a JSON object with this exact structure:
{
  "top3": [
    {
      "id": "unique-id",
      "title": "Clear, engaging headline",
      "summary": "A 2-3 sentence summary of the article and its impact",
      "source": "Source Name",
      "url": "article url",
      "date": "Date in MMM DD format (e.g., Jun 27)",
      "relatedTickers": ["AAPL", "TSLA"]
    }
  ],
  "theRest": []
}
CRITICAL: Return ONLY valid JSON. Do not include markdown code blocks.`;

            const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: aiPrompt }] }],
                generationConfig: {
                  temperature: 0.2,
                  responseMimeType: 'application/json',
                }
              })
            });

            if (!geminiResponse.ok) {
              const errorText = await geminiResponse.text();
              console.error('Gemini API Error Response:', errorText);
              throw new Error(`Gemini API returned ${geminiResponse.status}: ${errorText}`);
            }

            const geminiData = await geminiResponse.json();
            let responseText = geminiData.candidates[0].content.parts[0].text;
            
            // Clean up possible markdown formatting if the model ignored our instruction
            responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
            
            const parsedNews = JSON.parse(responseText);

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(parsedNews));
          } catch (error: any) {
            console.error('Error generating news:', error);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: error.message || 'Failed to fetch and process news' }));
          }
        });
      },
    },
  ],
})
