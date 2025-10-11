'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

const WagmiProvider = dynamic(
  () =>
    import('@/components/provider').then((mod) => ({ default: mod.Provider })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#0C63BA] border-t-transparent rounded-full animate-spin"></div>
      </div>
    ),
  },
);

export function ClientProvider({ children }: { children: ReactNode }) {
  return <WagmiProvider>{children}</WagmiProvider>;
}
