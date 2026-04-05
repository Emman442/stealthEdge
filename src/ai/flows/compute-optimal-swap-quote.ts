'use server';

import { SolRouter } from '@solrouter/sdk';
import { z } from 'zod';

const client = new SolRouter({
  apiKey: process.env.NEXT_PUBLIC_SOL_ROUTER_API_KEY!,
});

const TokenDataSchema = z.object({
  symbol: z.string(),
  priceUsd: z.number(),
  liquidityUsd: z.number(),
  volume24hUsd: z.number(),
});

const AgentInputSchema = z.object({
  userMessage: z.string(),
  marketData: z.array(TokenDataSchema),
});

export type AgentInput = z.infer<typeof AgentInputSchema>;

const SwapSchema = z.object({
  action: z.string(),
  amountOut: z.number(),
  slippage: z.number(),
  rationale: z.string(),
});

const AgentResponseSchema = z.object({
  strategySummary: z.string(),
  recommendedSwaps: z.array(SwapSchema),
});

export type AgentResponse = z.infer<typeof AgentResponseSchema>;

export async function analyzePrivateTradeDecision(input: AgentInput): Promise<AgentResponse> {
  const prompt = `
You are StealthAgent, a private Solana trading agent that keeps the user's strategy completely confidential.

User request: "${input.userMessage}"

Latest market data:
${input.marketData.map(t => `- ${t.symbol}: $${t.priceUsd.toFixed(2)} | Liquidity: $${(t.liquidityUsd/1e6).toFixed(1)}M | 24h Vol: $${(t.volume24hUsd/1e6).toFixed(1)}M`).join('\n')}

Analyze the request using the user's private intent. 
Return ONLY valid JSON in this exact format:

{
  "strategySummary": "Brief summary of your understanding and overall recommendation",
  "recommendedSwaps": [
    {
      "action": "Swap X TOKEN → Y TOKEN",
      "amountOut": number,
      "slippage": number,
      "rationale": "Short explanation why this fits the user's request"
    }
  ]
}

Be realistic, prefer good liquidity, and tailor to risk implied in the request.
`;

  const response = await client.chat(prompt);

  try {
    const parsed = JSON.parse(response.message || '{}');
    return AgentResponseSchema.parse(parsed);
  } catch (e) {
    console.error("Parse error:", response.message);
    throw new Error("Failed to parse agent response");
  }
}