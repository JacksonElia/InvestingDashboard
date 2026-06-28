import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Get tickers from query string, e.g., ?tickers=AAPL,TSLA
  const tickersRaw = req.query.tickers as string;
  if (!tickersRaw) {
    return res.status(400).json({ error: 'Missing tickers parameter' });
  }

  const tickers = tickersRaw.split(',').map(t => t.trim()).filter(Boolean);
  
  if (tickers.length === 0) {
    return res.status(200).json({ top3: [], theRest: [] });
  }

  // Ensure API keys are present
  const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!TAVILY_API_KEY || !GEMINI_API_KEY) {
    console.error('Missing API Keys');
    return res.status(500).json({ 
      error: 'Server is missing API keys. Please configure TAVILY_API_KEY and GEMINI_API_KEY in Vercel.' 
    });
  }

  try {
    // 1. Fetch News from Tavily
    const query = `Latest financial and business news for stocks: ${tickers.join(', ')}`;
    
    const tavilyResponse = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
      return res.status(200).json({ top3: [], theRest: [] });
    }

    // 2. Process with Google Gemini 1.5 Flash
    // We want the AI to return JSON format directly
    const aiPrompt = `
You are an expert financial news analyst. I am providing you with a list of recent news articles related to the following stock tickers: ${tickers.join(', ')}.

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
      "relatedTickers": ["AAPL", "TSLA"] // Array of tickers from the list that this article mentions or impacts
    }
  ],
  "theRest": [
    // Same structure as above, for the remaining relevant articles. 
    // Filter out completely irrelevant articles.
  ]
}

CRITICAL: Return ONLY valid JSON. Do not include markdown code blocks like \`\`\`json. Just the raw JSON object.
    `;

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: aiPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json', // Force JSON output
        }
      })
    });

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API returned ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates[0].content.parts[0].text;
    
    // Parse the generated JSON
    const parsedNews = JSON.parse(responseText);

    // Cache the result heavily since we don't want to burn through API limits
    // s-maxage=7200 means Vercel's CDN will cache this for 2 hours for everyone
    res.setHeader('Cache-Control', 's-maxage=7200, stale-while-revalidate=3600');
    
    return res.status(200).json(parsedNews);

  } catch (error: any) {
    console.error('Error generating news:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch and process news' });
  }
}
