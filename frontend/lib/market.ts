"use client";

import { useEffect, useState } from "react";

export type MarketEntry = {
  usd: number;
  usd_24h_change?: number;
};

export type MarketSnapshot = {
  ethereum?: MarketEntry;
  polygon?: MarketEntry;
  solana?: MarketEntry;
  avalanche?: MarketEntry;
  bnb?: MarketEntry;
};

export function useMarketPrices() {
  const [prices, setPrices] = useState<MarketSnapshot>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/market", { cache: "no-store" });
        const data = await response.json();
        if (!cancelled && !data.error) {
          setPrices(data);
        }
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { prices, loading };
}
