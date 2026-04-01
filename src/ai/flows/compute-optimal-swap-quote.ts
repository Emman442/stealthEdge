'use server';

import { z } from 'zod';
import { SolRouter } from '@solrouter/sdk';

const client = new SolRouter({
  apiKey: process.env.NEXT_PUBLIC_SOL_ROUTER_API_KEY!,
});

console.log("API Key:", process.env.NEXT_PUBLIC_SOL_ROUTER_API_KEY);

const TokenDataSchema = z.object({
  symbol: z.string(),
  priceUsd: z.number(),
  liquidityUsd: z.number(),
  volume24hUsd: z.number(),
  priceImpact: z.number(),
});

const TradingStrategySchema = z.object({
  goal: z.string(),
  riskTolerance: z.enum(['low', 'medium', 'high']),
  amountIn: z.number(),
  tokenInSymbol: z.string(),
  tokenOutSymbol: z.string(),
});

const AnalyzeTradeDecisionInputSchema = z.object({
  tradingStrategy: TradingStrategySchema,
  marketData: z.array(TokenDataSchema),
});

export type AnalyzeTradeDecisionInput = z.infer<typeof AnalyzeTradeDecisionInputSchema>;

const SwapQuoteSchema = z.object({
  exchange: z.string(),
  amountOut: z.number(),
  slippage: z.number(),
  gasFeeUsd: z.number(),
  rationale: z.string(),
});

const AnalyzeTradeDecisionOutputSchema = z.object({
  optimalSwapQuotes: z.array(SwapQuoteSchema),
  strategySummary: z.string(),
});

export type AnalyzeTradeDecisionOutput = z.infer<typeof AnalyzeTradeDecisionOutputSchema>;

// export async function analyzePrivateTradeDecision(
//   input: AnalyzeTradeDecisionInput
// ): Promise<AnalyzeTradeDecisionOutput> {
//   const prompt = `
// You are a private DeFi trading assistant.

// A user wants swap guidance based on their private strategy.

// Trading Strategy:
// - Goal: ${input.tradingStrategy.goal}
// - Risk Tolerance: ${input.tradingStrategy.riskTolerance}
// - Amount In: ${input.tradingStrategy.amountIn} ${input.tradingStrategy.tokenInSymbol}
// - Token Out: ${input.tradingStrategy.tokenOutSymbol}

// Market Data:
// ${input.marketData
//   .map(
//     (t) =>
//       `- ${t.symbol}: price=$${t.priceUsd}, liquidity=$${t.liquidityUsd}, volume24h=$${t.volume24hUsd}, priceImpact=${t.priceImpact}%`
//   )
//   .join('\n')}

// Return ONLY valid JSON matching this shape:
// {
//   "optimalSwapQuotes": [
//     {
//       "exchange": "string",
//       "amountOut": number,
//       "slippage": number,
//       "gasFeeUsd": number,
//       "rationale": "string"
//     }
//   ],
//   "strategySummary": "string"
// }

// Rules:
// - Recommend 2-3 realistic swap options
// - Prefer low slippage and high liquidity
// - Tailor suggestions to the user's goal and risk tolerance
// - No markdown, no explanation outside JSON
// `;

//   const response = await client.chat(prompt);
  

//   try {
//     const parsed = JSON.parse(response.message);
//     return AnalyzeTradeDecisionOutputSchema.parse(parsed);
//   } catch (error) {
//     console.error('Failed to parse SolRouter response:', response.message);
//     throw new Error('Invalid AI response format');
//   }
// }



export async function analyzePrivateTradeDecision(input: AnalyzeTradeDecisionInput) {
  const response = await client.chat("Say hello in JSON: {\"message\":\"hello\"}");
  console.log("SOLROUTER RAW RESPONSE:", response);
  return {
    optimalSwapQuotes: [
      {
        exchange: "TestDEX",
        amountOut: 100,
        slippage: 0.2,
        gasFeeUsd: 0.05,
        rationale: "Test response while debugging SolRouter",
      },
    ],
    strategySummary: response.message || "SolRouter test completed",
  };
}