import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { lookupStockData } from './src/lib/stockPriceLookup'
import historicalPerformanceHandler from './api/historical-performance'
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


        // Stock Splits Mock API
        server.middlewares.use('/api/stock-splits', async (req, res) => {
          if (req.method !== 'GET') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }

          const url = new URL(req.url ?? '', 'http://localhost');
          const ticker = url.searchParams.get('ticker');
          const startDate = url.searchParams.get('startDate');
          const endDate = url.searchParams.get('endDate');

          if (!ticker || !startDate) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'ticker and startDate are required' }));
            return;
          }

          try {
            const { default: stockSplitsHandler } = await import('./api/stock-splits');
            
            const mockReq = {
              method: 'GET',
              query: { ticker, startDate, endDate },
            } as any;

            let statusCode = 200;
            const mockRes: any = {
              status: (code: number) => {
                statusCode = code;
                return mockRes;
              },
              json: (data: any) => {
                res.statusCode = statusCode;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
              }
            };

            await stockSplitsHandler(mockReq, mockRes);
          } catch (err) {
             console.error(err);
             res.statusCode = 500;
             res.setHeader('Content-Type', 'application/json');
             res.end(JSON.stringify({ error: 'Failed to process stock splits' }));
          }
        });

        // Historical Price Mock API
        server.middlewares.use('/api/historical-price', async (req, res) => {
          if (req.method !== 'GET') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }

          const url = new URL(req.url ?? '', 'http://localhost');
          const ticker = url.searchParams.get('ticker');
          const date = url.searchParams.get('date');

          if (!ticker || !date) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'ticker and date are required' }));
            return;
          }

          try {
            // Re-use the Vercel handler logic
            const { default: historicalPriceHandler } = await import('./api/historical-price');
            
            // Mock VercelRequest & VercelResponse
            const mockReq = {
              method: 'GET',
              query: { ticker, date },
            } as any;

            let statusCode = 200;
            const mockRes = {
              status: (code: number) => {
                statusCode = code;
                return mockRes;
              },
              json: (data: any) => {
                res.statusCode = statusCode;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
              }
            } as any;

            await historicalPriceHandler(mockReq, mockRes);
          } catch (err: any) {
             console.error(err);
             res.statusCode = 500;
             res.setHeader('Content-Type', 'application/json');
             res.end(JSON.stringify({ error: 'Failed to process historical price' }));
          }
        });

        // Historical Performance Mock API
        server.middlewares.use('/api/historical-performance', (req, res) => {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', async () => {
            try {
              (req as any).body = JSON.parse(body);
              (res as any).status = (code: number) => {
                res.statusCode = code;
                return res;
              };
              (res as any).json = (data: any) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
              };
              await historicalPerformanceHandler(req as any, res as any);
            } catch (err: any) {
              console.error('Error in historical-performance middleware:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message || 'Failed to parse body' }));
            }
          });
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

            const tavilyData: any = await tavilyResponse.json();
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

            const geminiData: any = await geminiResponse.json();
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
        // Disruptors Mock API
        server.middlewares.use('/api/disruptors', async (req, res) => {
          if (req.method !== 'GET') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }

          const url = new URL(req.url ?? '', 'http://localhost');
          const query = url.searchParams.get('query');
          
          if (!query) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing query parameter' }));
            return;
          }

          const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
          const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

          if (!TAVILY_API_KEY || !GEMINI_API_KEY) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Server is missing API keys.' }));
            return;
          }

          try {
            const searchTopic = `Top promising public companies startups disruptors in ${query}`;
            const tavilyResponse = await fetch('https://api.tavily.com/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                api_key: TAVILY_API_KEY,
                query: searchTopic,
                search_depth: 'advanced',
                include_images: false,
                include_answer: false,
                days_back: 30,
                max_results: 15,
              }),
            });

            if (!tavilyResponse.ok) {
              throw new Error(`Tavily API returned ${tavilyResponse.status}`);
            }

            const tavilyData: any = await tavilyResponse.json();
            const searchResults = tavilyData.results || [];

            if (searchResults.length === 0) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify([]));
              return;
            }

            const aiPrompt = `
You are an expert venture capitalist and technology analyst.
I have searched the web for companies disrupting the following space: "${query}".

Here are the search results:
${JSON.stringify(searchResults, null, 2)}

Based on these results and your knowledge, identify 3-5 of the most promising public companies (they MUST have a stock ticker) that are disrupting this industry.

Return a JSON array of objects with this exact structure:
[
  {
    "id": "unique-string-id",
    "ticker": "TICKER_SYMBOL",
    "name": "Company Name",
    "industry": "Specific Niche",
    "thesis": "A 2-3 sentence thesis on WHY they are disruptive and their potential.",
    "potentialScore": 85,
    "url": "https://company-website.com or https://finance.yahoo.com/quote/TICKER_SYMBOL"
  }
]
CRITICAL: Return ONLY valid JSON array. Do not include markdown code blocks.`;

            const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: aiPrompt }] }],
                generationConfig: {
                  temperature: 0.4,
                  responseMimeType: 'application/json',
                }
              })
            });

            if (!geminiResponse.ok) {
              const errorText = await geminiResponse.text();
              console.error('Gemini API Error Response:', errorText);
              throw new Error(`Gemini API returned ${geminiResponse.status}: ${errorText}`);
            }

            const geminiData: any = await geminiResponse.json();
            let responseText = geminiData.candidates[0].content.parts[0].text;
            
            responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsedDisruptors = JSON.parse(responseText);

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(parsedDisruptors));
          } catch (error: any) {
            console.error('Error finding disruptors:', error);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: error.message || 'Failed to analyze disruptors' }));
          }
        });
      },
    },
  ],
})
