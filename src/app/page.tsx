'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Send, Lock, Bot, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { WalletConnectButton } from '@solana/wallet-adapter-react-ui';
import { analyzePolymarketEdge, type EdgeResponse } from '../ai/flows/compute-polymarket-response';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  edgeData?: EdgeResponse;
}

export default function StealthEdgeDashboard() {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'agent',
      content: "I'm StealthEdge, your private Polymarket research agent.\n\nAsk me anything about prediction markets. Your research intent and reasoning stay fully encrypted via SolRouter.",
      timestamp: new Date(),
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendToAgent = async () => {
    if (!input.trim() || loading) return;

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
      const result: EdgeResponse = await analyzePolymarketEdge({
        userMessage: userInput,
      });

      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: result.edgeSummary,
        timestamp: new Date(),
        edgeData: result,
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Inference Error",
        description: "Failed to get encrypted response from SolRouter.",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
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
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">StealthEdge</h1>
              <p className="text-xs text-zinc-500">Private Polymarket Research Agent • Powered by SolRouter</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge className="hidden border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-400 md:flex">
              <div className="mr-2 h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Encrypted Inference Active
            </Badge>
            {/* <WalletConnectButton 
              style={{
                height: "2.5rem",
                borderRadius: "8px",
                background: "#2563EB",
                color: "white",              
                border: "none",
                padding: "0 1.5rem",
                fontSize: "0.875rem",
                fontWeight: "500",
              }} */}
            {/* /> */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto h-[calc(100vh-4rem)] max-w-7xl p-4 sm:p-6">
        <Card className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/80 shadow-2xl backdrop-blur">
          <CardHeader className="border-b border-zinc-800 px-6 py-5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-emerald-500" />
              <div>
                <CardTitle className="text-2xl font-semibold tracking-tight">
                  Private Polymarket Research Agent
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Research prediction markets privately. Your questions and reasoning are encrypted on-device before inference.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex min-h-0 flex-1 flex-col p-0">
            {/* Messages Area */}
            <div className="min-h-0 flex-1">
              <ScrollArea className="h-full">
                <div className="space-y-8 p-6">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`w-fit max-w-[90%] overflow-hidden rounded-2xl border shadow-sm ${
                          msg.role === 'user'
                            ? 'rounded-tr-md border-blue-500/20 bg-blue-600 text-white'
                            : 'rounded-tl-md border-zinc-700 bg-zinc-800 text-zinc-100'
                        }`}
                      >
                        <div className="p-5 text-[15px] leading-7 whitespace-pre-wrap">
                          {msg.content}
                        </div>

                        {/* Research Results */}
                        {msg.edgeData && (
                          <div className="space-y-4 px-5 pb-6">
                            <div className="rounded-2xl bg-zinc-950/90 border border-zinc-700 p-5">
                              <div className="mb-4 flex items-center gap-2 text-emerald-400">
                                <TrendingUp className="h-4 w-4" />
                                <span className="font-medium">Key Markets & Edges</span>
                              </div>

                              {msg.edgeData.keyMarkets.map((market: any, idx: number) => (
                                <div key={idx} className="mb-6 last:mb-0 border-b border-zinc-800 pb-6 last:border-b-0 last:pb-0">
                                  <div className="mb-2 font-semibold text-lg leading-tight">
                                    {market.marketQuestion}
                                  </div>
                                  <div className="mb-3 text-sm text-emerald-400 font-mono">
                                    {market.currentOdds}
                                  </div>
                                  <div className="mb-2 text-sm font-medium text-amber-400">
                                    {market.edge}
                                  </div>
                                  <p className="text-sm text-zinc-400 italic">
                                    {market.rationale}
                                  </p>
                                </div>
                              ))}

                              <div className="mt-4 pt-4 border-t border-zinc-700">
                                <p className="text-sm font-medium text-zinc-300">
                                  Overall Takeaway:
                                </p>
                                <p className="mt-1 text-sm text-zinc-400">
                                  {msg.edgeData.overallTakeaway}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-3 rounded-2xl rounded-tl-md border border-zinc-700 bg-zinc-800 px-5 py-4 text-zinc-200">
                        <Lock className="h-4 w-4 animate-pulse" />
                        Running encrypted inference on SolRouter...
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </div>

            {/* Input Area */}
            <div className="border-t border-zinc-800 bg-zinc-900/60 p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="What's the real edge on the next Fed rate decision market?"
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
                Your research intent is encrypted client-side via SolRouter • Nothing sensitive is exposed
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}