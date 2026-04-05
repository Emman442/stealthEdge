
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { SolanaProvider } from './SolanaProvider';

export const metadata: Metadata = {
  title: 'StealthSwap | Secure Private Trading Agent',
  description: 'Private trading agent with encrypted strategy inference.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <SolanaProvider>
          {children}
          <Toaster />

        </SolanaProvider>
      </body>
    </html>
  );
}
