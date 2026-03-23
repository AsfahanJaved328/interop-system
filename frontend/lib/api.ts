"use client";

import { useEffect, useState } from "react";
import { createPublicClient, http, parseEventLogs } from "viem";
import { intentAbi } from "./intentAbi";
import { routerAbi } from "./routerAbi";

type Stats = {
  totalVolume: string;
  activeIntents: number;
  activeSolvers: number;
  avgGasSaved: string;
};

const fallback: Stats = {
  totalVolume: "Local Demo",
  activeIntents: 0,
  activeSolvers: 0,
  avgGasSaved: "Protocol estimate"
};

export function useProtocolStats() {
  const [stats, setStats] = useState<Stats>(fallback);

  useEffect(() => {
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545";
    const intentAddress =
      process.env.NEXT_PUBLIC_INTENT_CONTRACT || "0x0000000000000000000000000000000000000000";
    const routerAddress =
      process.env.NEXT_PUBLIC_ROUTER_CONTRACT || "0x0000000000000000000000000000000000000000";

    async function loadStats() {
      const client = createPublicClient({ transport: http(rpcUrl) });
      const nextStats: Stats = { ...fallback };

      if (intentAddress !== "0x0000000000000000000000000000000000000000") {
        const intentLogs = await client.getLogs({
          address: intentAddress as `0x${string}`,
          event: {
            type: "event",
            name: "IntentCreated",
            inputs: [
              { name: "intentId", type: "bytes32", indexed: true },
              { name: "user", type: "address", indexed: true },
              { name: "intentType", type: "uint8", indexed: false }
            ]
          },
          fromBlock: 0n,
          toBlock: "latest"
        });
        const parsedIntents = parseEventLogs({ abi: intentAbi, logs: intentLogs });
        nextStats.activeIntents = parsedIntents.length;
      }

      if (routerAddress !== "0x0000000000000000000000000000000000000000") {
        const protocols = [0, 1, 2, 3, 4];
        const protocolStats = await Promise.all(
          protocols.map(async (protocol) =>
            client.readContract({
              address: routerAddress as `0x${string}`,
              abi: routerAbi,
              functionName: "getProtocolStats",
              args: [protocol]
            })
          )
        );
        const totalMessages = protocolStats.reduce((sum, result) => sum + Number(result[0]), 0);
        const successfulMessages = protocolStats.reduce((sum, result) => sum + Number(result[1]), 0);

        nextStats.totalVolume = `${totalMessages} routed msgs`;
        nextStats.activeSolvers = protocolStats.filter((result) => Number(result[0]) > 0).length;
        nextStats.avgGasSaved =
          totalMessages === 0
            ? "Protocol estimate"
            : `${Math.round((successfulMessages / totalMessages) * 100)}% success`;
      }

      setStats(nextStats);
    }

    loadStats().catch(() => {
      setStats(fallback);
    });
  }, []);

  return stats;
}
