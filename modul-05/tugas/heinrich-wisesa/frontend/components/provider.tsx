'use client';

import React, { useState, useEffect } from 'react';
import { WagmiProvider } from 'wagmi';
import { darkTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from '@/lib/wagmi';
import ReactQueryProvider from '@/lib/react-query';
import '@rainbow-me/rainbowkit/styles.css';

export function Provider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <WagmiProvider config={config}>
        <ReactQueryProvider dehydratedState={undefined}>
          <RainbowKitProvider theme={darkTheme()}>
            <div className="min-h-screen flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-[#0C63BA] border-t-transparent rounded-full animate-spin"></div>
            </div>
          </RainbowKitProvider>
        </ReactQueryProvider>
      </WagmiProvider>
    );
  }

  return (
    <WagmiProvider config={config}>
      <ReactQueryProvider dehydratedState={undefined}>
        <RainbowKitProvider theme={darkTheme()}>{children}</RainbowKitProvider>
      </ReactQueryProvider>
    </WagmiProvider>
  );
}
