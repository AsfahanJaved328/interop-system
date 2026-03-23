"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { mainnet, polygon, arbitrum, optimism, base, avalanche, bsc } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const config = createConfig({
  connectors: [injected()],
  chains: [mainnet, polygon, arbitrum, optimism, base, avalanche, bsc],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
    [avalanche.id]: http(),
    [bsc.id]: http()
  }
});

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
