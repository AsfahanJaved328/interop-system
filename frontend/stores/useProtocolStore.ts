import { create } from "zustand";
import { persist } from "zustand/middleware";

type ProtocolState = {
  totalVolume: string;
  activeIntents: number;
  activeSolvers: number;
  avgGasSaved: string;
  preferredChains: string[];
  defaultSlippage: number;
  setPreferences: (chains: string[], slippage: number) => void;
};

export const useProtocolStore = create<ProtocolState>()(
  persist(
    (set) => ({
      totalVolume: "$1.2B",
      activeIntents: 342,
      activeSolvers: 56,
      avgGasSaved: "32%",
      preferredChains: ["Ethereum", "Polygon"],
      defaultSlippage: 0.5,
      setPreferences: (chains, slippage) =>
        set({ preferredChains: chains, defaultSlippage: slippage })
    }),
    { name: "interop-preferences" }
  )
);
