import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const query = req.query.query as string;
  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter' });
  }

  const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!TAVILY_API_KEY || !GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Server is missing API keys.' });
  }

  try {
    // 1. Fetch data about the industry/trend using Tavily
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
        days_back: 30, // Look back a bit further for general industry research
        max_results: 15,
      }),
    });

    if (!tavilyResponse.ok) {
      throw new Error(`Tavily API returned ${tavilyResponse.status}`);
    }

    const tavilyData: any = await tavilyResponse.json();
    const searchResults = tavilyData.results || [];

    if (searchResults.length === 0) {
      return res.status(200).json([]);
    }

    // 2. Process with Google Gemini to identify the companies
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
    "industry": "Specific Niche (e.g., Solid State Batteries)",
    "thesis": "A 2-3 sentence thesis on WHY they are disruptive and their potential.",
    "potentialScore": 85,
    "url": "https://company-website.com or https://finance.yahoo.com/quote/TICKER_SYMBOL"
  }
]

CRITICAL: Return ONLY valid JSON array. Do not include markdown code blocks.
`;

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

    // Cache the result to save API calls
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600'); // Cache for 24 hours
    
    return res.status(200).json(parsedDisruptors);

  } catch (error: any) {
    console.error('Error finding disruptors:', error);
    return res.status(500).json({ error: error.message || 'Failed to analyze disruptors' });
  }
}
