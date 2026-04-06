# StealthEdge - Private Polymarket Research Agent

Hey there,

I built **StealthEdge** — a private research agent that lets you analyze Polymarket prediction markets without exposing your research intent or strategy to any third-party servers.

### What is StealthEdge?

StealthEdge is a simple chat interface where you can ask natural language questions about prediction markets on Polymarket (politics, crypto, pop culture, geopolitics, entertainment, etc.).

The key difference?  
Your entire question and reasoning are **encrypted on-device** using the SolRouter SDK before they leave your computer. The AI processes everything inside secure isolated hardware, and only the final analysis comes back.

This means no one (not even the AI provider) can see what you're researching or what private thesis you're testing.

### The Problem It Solves

When people research prediction markets using normal AI tools (ChatGPT, Claude, etc.), their full prompt — including sensitive angles, private theses, or competitive edges — gets sent in plaintext to external servers.  

That’s risky in a space where information asymmetry is everything.

StealthEdge solves this by keeping your research intent completely private while still delivering useful analysis based on live Polymarket odds.

### How It Works

1. You type a question in natural language.
2. The app fetches public Polymarket data (odds, volume, etc.).
3. Your full query is encrypted via SolRouter and sent for private inference.
4. The agent returns a clear summary, relevant markets, detected edges, and an overall takeaway.
5. Everything sensitive stays protected.

### Example Prompts You Can Test

Here are some good prompts to try:

**Simple tests:**
- "What are the current odds on New Rihanna Album before GTA VI?"
- "Show me the latest odds on Bitcoin hitting $1M before GTA VI"

**Strategic research:**
- "Is there any edge on the Russia-Ukraine ceasefire markets?"
- "Analyze entertainment and pop culture markets right now"
- "What does the market say about AI developments in 2026?"

**Advanced / Private thesis style:**
- "Using my private view on geopolitics, check for edges on Taiwan-related markets"
- "I have a specific thesis on US politics. Look for mispriced markets around Trump or elections"
- "Find any edges in the 'What will happen before GTA VI' market group"

### Tech Stack

- Next.js + TypeScript
- SolRouter SDK for encrypted inference
- shadcn/ui + Tailwind CSS
- Polymarket Gamma API for live market data
- Solana Wallet Adapter (for future features)

### Why This Matters for SolRouter

Prediction market research is one of the best use cases for private inference. Your edge, your timing, and your unique angle never leave your device in plaintext. This is exactly the kind of sensitive agent workflow SolRouter was built for.

### Setup Instructions

1. Clone the repo
2. Copy `.env.example` to `.env.local` and add your SolRouter API key which you can get <a href="https://www.solrouter.com/sdk">here</a>
3. Run `npm install`
4. Run `npm run dev`
5. Connect your Solana wallet (devnet recommended for testing)
6. Start chatting with the agent

### Future Ideas

- Portfolio-aware research (connect wallet to factor in your positions)
- Multi-step agent reasoning using SolRouter’s agent framework
- Better news sentiment integration
- Export research notes

Built as a submission for the SolRouter Bounty.

I’d love any feedback on the privacy feel, response quality, or UI!

---

Made with ❤️ for private DeFi intelligence.