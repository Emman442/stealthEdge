'use server';

import { SolRouter } from '@solrouter/sdk';
import { z } from 'zod';

const client = new SolRouter({
  apiKey: process.env.NEXT_PUBLIC_SOL_ROUTER_API_KEY!,
});

const EdgeInputSchema = z.object({
  userMessage: z.string(),
});

export type EdgeInput = z.infer<typeof EdgeInputSchema>;

const MarketSchema = z.object({
  marketQuestion: z.string(),
  currentOdds: z.string(),
  edge: z.string(),
  rationale: z.string(),
});

const EdgeResponseSchema = z.object({
  edgeSummary: z.string(),
  keyMarkets: z.array(MarketSchema),
  overallTakeaway: z.string(),
});

export type EdgeResponse = z.infer<typeof EdgeResponseSchema>;

export async function analyzePolymarketEdge(input: EdgeInput): Promise<EdgeResponse> {
  let marketDataText = "Live Polymarket data is currently limited. Using general knowledge for analysis.";

  try {
    // Use the /markets endpoint with higher limit and no problematic ordering
    const res = await fetch(
      'https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=80',
      { headers: { accept: 'application/json' } }
    );

    if (res.ok) {
      const markets = await res.json();

      // Filter and format the top relevant markets
      const formattedMarkets = markets
        .filter((m: any) => m.active && !m.closed && m.outcomePrices)
        .slice(0, 25) // Keep prompt size reasonable
        .map((m: any) => {
          let yesPrice = 50;
          let noPrice = 50;

          try {
            const prices = JSON.parse(m.outcomePrices || '[]');
            if (Array.isArray(prices) && prices.length >= 2) {
              yesPrice = Math.round(parseFloat(prices[0]) * 100);
              noPrice = Math.round(parseFloat(prices[1]) * 100);
            }
          } catch (_) {}

          return `- "${m.question}": Yes ${yesPrice}% | No ${noPrice}% (Vol: ~$${(parseFloat(m.volume || 0) / 1_000_000).toFixed(1)}M)`;
        })
        .join('\n');

      if (formattedMarkets) {
        marketDataText = formattedMarkets;
      }
    }
  } catch (e) {
    console.error("Polymarket API error:", e);
  }

  const prompt = `
You are StealthEdge, a private Polymarket research agent.

User's research question: "${input.userMessage}"

Available Polymarket data:
${marketDataText}

Analyze for potential edges (where odds may differ from real-world sentiment or news).

Return ONLY valid JSON:

{
  "edgeSummary": "Short summary of your private analysis",
  "keyMarkets": [
    {
      "marketQuestion": "Full market question",
      "currentOdds": "Yes XX% | No YY%",
      "edge": "Bullish edge / Bearish edge / Neutral / No clear edge",
      "rationale": "Brief explanation"
    }
  ],
  "overallTakeaway": "Clear takeaway or advice"
}
`;

  const response = await client.chat(prompt);

  try {
    const parsed = JSON.parse(response.message || '{}');
    return EdgeResponseSchema.parse(parsed);
  } catch (e) {
    console.error("Parse error:", response.message);
    return {
      edgeSummary: "I analyzed your question using available market data.",
      keyMarkets: [],
      overallTakeaway: "No strong edge detected right now. Try asking about a more active topic or check back later.",
    };
  }
}