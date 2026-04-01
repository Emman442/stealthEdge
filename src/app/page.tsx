"use client";

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Zap,
  History,
  Activity,
  Lock,
  ArrowRightLeft,
  Search,
  MoreVertical,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  analyzePrivateTradeDecision,
  type AnalyzeTradeDecisionOutput,
} from '../ai/flows/compute-optimal-swap-quote';
import { useToast } from "@/hooks/use-toast";
import { WalletConnectButton } from '@solana/wallet-adapter-react-ui';

// Types
interface Token {
  symbol: string;
  name: string;
  priceUsd: number;
  change24h: number;
  liquidityUsd: number;
  volume24hUsd: number;
  priceImpact: number;
}

interface Trade {
  id: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  amountOut: number;
  exchange: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp: Date;
}

type RiskTolerance = 'low' | 'medium' | 'high';

interface StrategyState {
  tokenIn: string;
  tokenOut: string;
  amount: string;
  goal: string;
  riskTolerance: RiskTolerance;
}

const MOCK_TOKENS: Token[] = [
  { symbol: 'ETH', name: 'Ethereum', priceUsd: 2845.20, change24h: 2.5, liquidityUsd: 500000000, volume24hUsd: 120000000, priceImpact: 0.05 },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', priceUsd: 64120.50, change24h: -1.2, liquidityUsd: 800000000, volume24hUsd: 250000000, priceImpact: 0.03 },
  { symbol: 'USDC', name: 'USD Coin', priceUsd: 1.00, change24h: 0.01, liquidityUsd: 2000000000, volume24hUsd: 450000000, priceImpact: 0.01 },
  { symbol: 'SOL', name: 'Solana', priceUsd: 142.75, change24h: 5.4, liquidityUsd: 300000000, volume24hUsd: 90000000, priceImpact: 0.12 },
  { symbol: 'LINK', name: 'Chainlink', priceUsd: 18.20, change24h: 1.8, liquidityUsd: 150000000, volume24hUsd: 40000000, priceImpact: 0.25 },
];

export default function StealthSwapDashboard() {
  const { toast } = useToast();

  // TEMP: keep this until you wire wallet adapter
  const [walletConnected] = useState(true);

  const [activeTab, setActiveTab] = useState('swap');
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [quotes, setQuotes] = useState<AnalyzeTradeDecisionOutput | null>(null);
  const [tradeHistory, setTradeHistory] = useState<Trade[]>([]);
  const [strategy, setStrategy] = useState<StrategyState>({
    tokenIn: 'ETH',
    tokenOut: 'USDC',
    amount: '1.0',
    goal: 'Minimize slippage',
    riskTolerance: 'medium',
  });

  // Hydrate local trade history
  useEffect(() => {
    const saved = localStorage.getItem('stealth_trades');
    if (saved) {
      setTradeHistory(
        JSON.parse(saved).map((t: any) => ({
          ...t,
          timestamp: new Date(t.timestamp),
        }))
      );
    }
  }, []);

  const saveTrade = (trade: Trade) => {
    const updated = [trade, ...tradeHistory];
    setTradeHistory(updated);
    localStorage.setItem('stealth_trades', JSON.stringify(updated));
  };

  const handleFetchQuote = async () => {
    if (!walletConnected) {
      toast({
        variant: "destructive",
        title: "Wallet Required",
        description: "Please connect your wallet to fetch secure quotes.",
      });
      return;
    }

    setLoadingQuote(true);

    try {
      const result = await analyzePrivateTradeDecision({
        tradingStrategy: {
          goal: strategy.goal,
          riskTolerance: strategy.riskTolerance,
          amountIn: parseFloat(strategy.amount),
          tokenInSymbol: strategy.tokenIn,
          tokenOutSymbol: strategy.tokenOut,
        },
        marketData: MOCK_TOKENS.map((t) => ({
          symbol: t.symbol,
          priceUsd: t.priceUsd,
          liquidityUsd: t.liquidityUsd,
          volume24hUsd: t.volume24hUsd,
          priceImpact: t.priceImpact,
        })),
      });

      setQuotes(result);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Inference Error",
        description: "Failed to securely compute swap quotes.",
      });
    } finally {
      setLoadingQuote(false);
    }
  };

  const executeSwap = (quote: any) => {
    toast({
      title: "Swap Executed",
      description: `Swapped ${strategy.amount} ${strategy.tokenIn} for ~${quote.amountOut} ${strategy.tokenOut} via ${quote.exchange}`,
    });

    saveTrade({
      id: Math.random().toString(36).substr(2, 9),
      tokenIn: strategy.tokenIn,
      tokenOut: strategy.tokenOut,
      amountIn: parseFloat(strategy.amount),
      amountOut: quote.amountOut,
      exchange: quote.exchange,
      status: 'completed',
      timestamp: new Date(),
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      {/* Navigation Header */}
      <header className="border-b bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <ShieldCheck className="text-white w-5 h-5" />
            </div>
            <h1 className="font-headline text-xl font-bold tracking-tight text-white">StealthSwap</h1>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => setActiveTab('swap')}
              className={`text-sm font-medium transition-colors ${activeTab === 'swap' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`text-sm font-medium transition-colors ${activeTab === 'history' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              History
            </button>
            <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Analytics
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <Badge variant="outline" className="hidden sm:flex gap-1.5 py-1 px-3 border-white/10 bg-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Mainnet
            </Badge>
            <WalletConnectButton style={{

              background: "#4F81D9",
              color: "#fff",
              height: "2.5rem",
              fontSize: "0.875rem",
              fontWeight: "500",
            }} />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Token Feed */}
        <div className="lg:col-span-3 space-y-6 order-2 lg:order-1">
          <Card className="glass-panel border-white/5 h-[calc(100vh-160px)] flex flex-col">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-headline uppercase tracking-widest text-muted-foreground">Market Feed</CardTitle>
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search tokens..." className="pl-9 bg-background/50 border-white/5 h-9 text-xs" />
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full px-4">
                <div className="space-y-4 py-4">
                  {MOCK_TOKENS.map((token) => (
                    <div key={token.symbol} className="group cursor-pointer">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold">
                            {token.symbol[0]}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{token.symbol}</div>
                            <div className="text-[10px] text-muted-foreground">{token.name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-mono text-white">${token.priceUsd.toLocaleString()}</div>
                          <div className={`text-[10px] font-mono ${token.change24h >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {token.change24h >= 0 ? '+' : ''}
                            {token.change24h}%
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                        <div className="bg-primary/30 h-full w-[60%]" />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Center/Right Columns: Action Center */}
        <div className="lg:col-span-9 space-y-6 order-1 lg:order-2">
          {activeTab === 'swap' ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Strategy Form */}
              <div className="space-y-6">
                <Card className="glass-panel border-white/5 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <ArrowRightLeft className="w-24 h-24" />
                  </div>
                  <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                      <Zap className="w-5 h-5 text-primary" />
                      Secure Swap
                    </CardTitle>
                    <CardDescription>
                      Define strategy parameters locally. Inference is encrypted.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Swap From</label>
                        <select
                          className="w-full bg-background border border-white/5 rounded-md h-10 px-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                          value={strategy.tokenIn}
                          onChange={(e) => setStrategy({ ...strategy, tokenIn: e.target.value })}
                        >
                          {MOCK_TOKENS.map((t) => (
                            <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Amount</label>
                        <Input
                          type="number"
                          className="bg-background border-white/5"
                          value={strategy.amount}
                          onChange={(e) => setStrategy({ ...strategy, amount: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Receive (Estimated)</label>
                      <select
                        className="w-full bg-background border border-white/5 rounded-md h-10 px-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                        value={strategy.tokenOut}
                        onChange={(e) => setStrategy({ ...strategy, tokenOut: e.target.value })}
                      >
                        {MOCK_TOKENS.map((t) => (
                          <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
                        ))}
                      </select>
                    </div>

                    <Separator className="bg-white/5" />

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Trading Goal</label>
                        <Input
                          className="bg-background border-white/5"
                          placeholder="e.g. Maximize profit, Minimize slippage"
                          value={strategy.goal}
                          onChange={(e) => setStrategy({ ...strategy, goal: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Risk Tolerance</label>
                        <div className="flex gap-2">
                          {(['low', 'medium', 'high'] as const).map((r) => (
                            <Button
                              key={r}
                              variant={strategy.riskTolerance === r ? "default" : "outline"}
                              className={`flex-1 h-8 text-[10px] uppercase font-bold border-white/5 ${strategy.riskTolerance === r ? 'bg-primary' : 'bg-transparent'}`}
                              onClick={() => setStrategy({ ...strategy, riskTolerance: r })}
                            >
                              {r}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Button
                      className="w-full mt-4 bg-primary hover:bg-primary/90 font-headline font-bold text-white shadow-lg shadow-primary/20 h-12"
                      disabled={loadingQuote}
                      onClick={handleFetchQuote}
                    >
                      {loadingQuote ? (
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 animate-spin" />
                          Encrypted Inference...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Compute Optimal Quote
                        </div>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <div className="p-4 rounded-lg bg-accent/10 border border-accent/20 flex gap-3">
                  <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-accent">Zero-Knowledge Inference</div>
                    <p className="text-muted-foreground leading-relaxed">
                      Your trading strategy parameters are processed in a secure enclave. Plaintext strategy details never persist on public infrastructure.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quotes Display */}
              <div className="space-y-6">
                <Card className="glass-panel border-white/5 h-full">
                  <CardHeader>
                    <CardTitle className="font-headline text-sm uppercase tracking-widest text-muted-foreground">Inference Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!quotes && !loadingQuote ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                        <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/20 mb-4 flex items-center justify-center">
                          <Search className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium">No active inference results</p>
                        <p className="text-[10px]">Adjust strategy and run computation</p>
                      </div>
                    ) : loadingQuote ? (
                      <div className="space-y-4">
                        {[1, 2].map((i) => (
                          <div key={i} className="animate-pulse space-y-3 p-4 rounded-lg border border-white/5 bg-white/5">
                            <div className="h-4 bg-white/10 rounded w-1/4" />
                            <div className="h-8 bg-white/10 rounded w-3/4" />
                            <div className="h-4 bg-white/10 rounded w-full" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400">
                          <div className="font-bold mb-1">Inference Summary:</div>
                          {quotes?.strategySummary}
                        </div>

                        <div className="space-y-4">
                          {quotes?.optimalSwapQuotes.map((quote: any, idx: number) => (
                            <div key={idx} className="p-4 rounded-lg border border-white/10 bg-white/5 hover:border-primary/50 transition-all group">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{quote.exchange}</div>
                                  <div className="text-2xl font-mono text-white flex items-baseline gap-2">
                                    {quote.amountOut.toFixed(4)}
                                    <span className="text-sm text-primary">{strategy.tokenOut}</span>
                                  </div>
                                </div>
                                <Badge className="bg-primary/20 text-primary border-primary/20">Optimal</Badge>
                              </div>

                              <div className="grid grid-cols-2 gap-4 text-[11px] mb-4">
                                <div className="flex justify-between border-b border-white/5 pb-1">
                                  <span className="text-muted-foreground">Slippage</span>
                                  <span className="font-mono text-white">{quote.slippage}%</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-1">
                                  <span className="text-muted-foreground">Gas (USD)</span>
                                  <span className="font-mono text-white">${quote.gasFeeUsd.toFixed(2)}</span>
                                </div>
                              </div>

                              <p className="text-xs text-muted-foreground italic mb-4 leading-relaxed">
                                &ldquo;{quote.rationale}&rdquo;
                              </p>

                              <Button
                                className="w-full bg-white text-black hover:bg-white/90 font-bold"
                                size="sm"
                                onClick={() => executeSwap(quote)}
                              >
                                Execute Swap Quote
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card className="glass-panel border-white/5">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-headline">Trade History</CardTitle>
                  <CardDescription>Locally stored execution records</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setTradeHistory([]);
                    localStorage.removeItem('stealth_trades');
                  }}
                >
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </Button>
              </CardHeader>
              <CardContent>
                {tradeHistory.length === 0 ? (
                  <div className="py-20 text-center opacity-50">
                    <History className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm">No recorded trades found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-white/5">
                        <tr>
                          <th className="px-4 py-3">Token Pair</th>
                          <th className="px-4 py-3">Input</th>
                          <th className="px-4 py-3">Output</th>
                          <th className="px-4 py-3">Exchange</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tradeHistory.map((trade) => (
                          <tr key={trade.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="px-4 py-4 font-bold">
                              {trade.tokenIn} / {trade.tokenOut}
                            </td>
                            <td className="px-4 py-4 font-mono">
                              {trade.amountIn} {trade.tokenIn}
                            </td>
                            <td className="px-4 py-4 font-mono text-emerald-400">
                              +{trade.amountOut.toFixed(4)} {trade.tokenOut}
                            </td>
                            <td className="px-4 py-4 text-xs">
                              {trade.exchange}
                            </td>
                            <td className="px-4 py-4">
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] py-0 px-2">
                                Success
                              </Badge>
                            </td>
                            <td className="px-4 py-4 text-right text-xs text-muted-foreground">
                              {trade.timestamp.toLocaleTimeString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <footer className="h-8 border-t bg-card text-[10px] flex items-center px-4 justify-between font-mono">
        <div className="flex items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            AI Network: Online
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            Encryption: Active (AES-256)
          </div>
        </div>
        <div className="text-muted-foreground uppercase tracking-tighter">
          v1.0.4-stealth // node_id: 0x442...a91
        </div>
      </footer>
    </div>
  );
}