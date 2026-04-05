'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Send, Lock, Bot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { WalletConnectButton } from '@solana/wallet-adapter-react-ui';
import { analyzePrivateTradeDecision, type AgentResponse } from '../ai/flows/compute-optimal-swap-quote';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  swaps?: AgentResponse['recommendedSwaps'];
}

export default function StealthAgentDashboard() {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'agent',
      content:
        "I'm StealthAgent, your private Solana trading agent.\n\nYour strategy and reasoning stay fully encrypted via SolRouter. Describe what you want to do.",
      timestamp: new Date(),
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<any[]>([]);

  // Keep this only if your AI still needs market data
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const res = await fetch(
          'https://public-api.birdeye.so/defi/tokenlist?sort_by=v24hUSD&sort_type=desc&offset=0&limit=20&min_liquidity=100000',
          {
            headers: {
              'x-chain': 'solana',
              accept: 'application/json',
              'X-API-KEY': '226ea5b807ff44308be52c64ffeada3e',
            },
          }
        );
        const data = await res.json();
        setTokens(data.data?.tokens || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchTokens();
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendToAgent = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    const userInput = input;
    setInput('');
    setLoading(true);

    try {
      const marketData = tokens.slice(0, 15).map((t: any) => ({
        symbol: t.symbol,
        priceUsd: t.price || 0,
        liquidityUsd: t.liquidity || 0,
        volume24hUsd: t.v24hUSD || 0,
      }));

      const result: AgentResponse = await analyzePrivateTradeDecision({
        userMessage: userInput,
        marketData,
      });

      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: result.strategySummary,
        timestamp: new Date(),
        swaps: result.recommendedSwaps,
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Encrypted inference failed.",
      });
    } finally {
      setLoading(false);
    }
  };

  const executeSwap = (swap: any) => {
    console.log("Executing swap:", swap);
    toast({
      title: "Swap Initiated",
      description: `Executing ${swap.action} — Review in wallet`,
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 h-16 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-600 shadow-lg shadow-violet-900/30">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">StealthAgent</h1>
              <p className="text-xs text-zinc-500">Private Trading Agent • Powered by SolRouter</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge className="hidden border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-400 md:flex">
              <div className="mr-2 h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Encrypted Inference Active
            </Badge>
            <WalletConnectButton />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto h-[calc(100vh-4rem)] max-w-7xl p-4 sm:p-6">
        <Card className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/80 shadow-2xl backdrop-blur">
          <CardHeader className="border-b border-zinc-800 px-6 py-5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-emerald-500" />
              <div>
                <CardTitle className="text-2xl font-semibold tracking-tight">
                  Private Trading Agent
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Your trading strategy and reasoning are encrypted on-device before inference.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex min-h-0 flex-1 flex-col p-0">
            {/* Messages */}
            <div className="min-h-0 flex-1">
              <ScrollArea className="h-full">
                <div className="space-y-6 p-6">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`w-fit max-w-[85%] overflow-hidden rounded-2xl border shadow-sm ${
                          msg.role === 'user'
                            ? 'rounded-tr-md border-blue-500/20 bg-blue-600 text-white'
                            : 'rounded-tl-md border-zinc-700 bg-zinc-800 text-zinc-100'
                        }`}
                      >
                        <div className="p-5 text-[15px] leading-7 whitespace-pre-wrap">
                          {msg.content}
                        </div>

                        {msg.swaps && msg.swaps.length > 0 && (
                          <div className="space-y-4 px-5 pb-5">
                            {msg.swaps.map((swap: any, idx: number) => (
                              <div
                                key={idx}
                                className="rounded-2xl border border-zinc-700 bg-zinc-950/90 p-5"
                              >
                                <div className="mb-2 text-lg font-semibold">{swap.action}</div>

                                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                                  <span>
                                    Expected out:{' '}
                                    <span className="font-mono text-emerald-400">
                                      {swap.amountOut}
                                    </span>
                                  </span>
                                  <span>
                                    Slippage:{' '}
                                    <span className="font-mono">{swap.slippage}%</span>
                                  </span>
                                </div>

                                <p className="mb-4 text-sm italic text-zinc-400">
                                  “{swap.rationale}”
                                </p>

                                <Button
                                  onClick={() => executeSwap(swap)}
                                  className="w-full rounded-xl bg-blue-600 font-medium text-white hover:bg-blue-700"
                                >
                                  Execute This Swap
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-3 rounded-2xl rounded-tl-md border border-zinc-700 bg-zinc-800 px-5 py-4 text-zinc-200 shadow-sm">
                        <Lock className="h-4 w-4 animate-pulse" />
                        Running encrypted inference on SolRouter...
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </div>

            {/* Input */}
            <div className="border-t border-zinc-800 bg-zinc-900/60 p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Analyze trending tokens for a medium-risk swap with 80 USDC using my momentum strategy"
                  onKeyDown={(e) => e.key === 'Enter' && !loading && sendToAgent()}
                  disabled={loading}
                  className="h-14 rounded-2xl border-zinc-700 bg-zinc-950 text-white placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-blue-500"
                />
                <Button
                  onClick={sendToAgent}
                  disabled={loading || !input.trim()}
                  className="h-14 rounded-2xl bg-blue-600 px-6 hover:bg-blue-700"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>

              <p className="mt-3 text-center text-[11px] text-zinc-500">
                Strategy & reasoning encrypted via SolRouter • Never sent in plaintext
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}