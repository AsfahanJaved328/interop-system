"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createPublicClient, http, parseEventLogs } from "viem";
import OnboardingWizard from "../components/OnboardingWizard";
import GuidedTour from "../components/GuidedTour";
import { useRealtimeStats } from "../lib/realtime";
import { useProtocolStats } from "../lib/api";
import { useMarketPrices } from "../lib/market";
import { intentAbi } from "../lib/intentAbi";
import { routerAbi } from "../lib/routerAbi";

export default function HomePage() {
  const container = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { staggerChildren: 0.06 } }
  };
  const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };
  const statsLive = useRealtimeStats();
  const apiStats = useProtocolStats();
  const { prices } = useMarketPrices();
  const [recent, setRecent] = useState<
    { id: string; label: string; status: "Success" | "Pending" }[]
  >([]);
  const [protocolStats, setProtocolStats] = useState<
    { name: string; total: number; success: number }[]
  >([]);

  useEffect(() => {
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545";
    const intentAddress =
      process.env.NEXT_PUBLIC_INTENT_CONTRACT || "0x0000000000000000000000000000000000000000";
    const routerAddress =
      process.env.NEXT_PUBLIC_ROUTER_CONTRACT || "0x0000000000000000000000000000000000000000";

    async function loadChain() {
      const client = createPublicClient({ transport: http(rpcUrl) });
      const items: { id: string; label: string; status: "Success" | "Pending" }[] = [];

      if (intentAddress !== "0x0000000000000000000000000000000000000000") {
        const logs = await client.getLogs({
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
        const parsed = parseEventLogs({ abi: intentAbi, logs });
        parsed.slice(-3).reverse().forEach((log) => {
          items.push({
            id: log.args.intentId,
            label: `Intent ${log.args.intentId.toString().slice(0, 6)}`,
            status: "Pending"
          });
        });
      }

      if (routerAddress !== "0x0000000000000000000000000000000000000000") {
        const logs = await client.getLogs({
          address: routerAddress as `0x${string}`,
          event: {
            type: "event",
            name: "MessageRouted",
            inputs: [
              { name: "messageId", type: "bytes32", indexed: true },
              { name: "destinationChain", type: "uint256", indexed: true },
              { name: "receiver", type: "address", indexed: true }
            ]
          },
          fromBlock: 0n,
          toBlock: "latest"
        });
        const parsed = parseEventLogs({ abi: routerAbi, logs });
        parsed.slice(-2).reverse().forEach((log) => {
          items.push({
            id: log.args.messageId,
            label: `Bridge to ${log.args.destinationChain.toString()}`,
            status: "Success"
          });
        });
      }

      setRecent(items.slice(0, 5));

      if (routerAddress !== "0x0000000000000000000000000000000000000000") {
        const protocols = [
          { id: 0, name: "CCIP" },
          { id: 1, name: "Axelar" },
          { id: 2, name: "LayerZero" },
          { id: 3, name: "Wormhole" },
          { id: 4, name: "Hyperlane" }
        ];
        const stats = await Promise.all(
          protocols.map(async (p) => {
            const result = await client.readContract({
              address: routerAddress as `0x${string}`,
              abi: routerAbi,
              functionName: "getProtocolStats",
              args: [p.id]
            });
            return {
              name: p.name,
              total: Number(result[0]),
              success: Number(result[1])
            };
          })
        );
        setProtocolStats(stats);
      }
    }

    loadChain().catch(() => {});
  }, []);

  return (
    <motion.div className="space-y-8" variants={container} initial="hidden" animate="show">
      <OnboardingWizard />
      <GuidedTour />
      <motion.section
        id="tour-hero"
        className="rounded-2xl bg-white/5 p-8 shadow-xl backdrop-blur"
        variants={item}
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Interop Control Plane</h1>
            <p className="mt-2 text-slate-300">
              Real-time cross-chain routing, proof verification, and governance operations.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/intents" className="rounded-xl bg-[#4F46E5] px-4 py-2 text-sm font-semibold">
              Create Intent
            </Link>
            <Link href="/bridge" className="rounded-xl border border-white/20 px-4 py-2 text-sm">
              Bridge Assets
            </Link>
          </div>
        </div>
        <div id="tour-stats" className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Total Volume", value: apiStats.totalVolume, delta: "+12%" },
            { label: "Active Intents", value: apiStats.activeIntents, delta: "+8%" },
            { label: "Active Solvers", value: apiStats.activeSolvers, delta: "+4" },
            { label: "Avg Gas Saved", value: apiStats.avgGasSaved, delta: "+3%" }
          ].map((stat) => (
            <motion.div
              key={stat.label}
              variants={item}
              whileHover={{ y: -4, boxShadow: "0 18px 40px rgba(0,0,0,0.35)" }}
              className="rounded-xl bg-black/20 p-4"
            >
              <p className="text-xs text-slate-400">{stat.label}</p>
              <p className="text-2xl font-semibold">{stat.value}</p>
              <p className="text-xs text-emerald-400">{stat.delta}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section variants={item} className="rounded-2xl bg-white/5 p-6 backdrop-blur">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Market Snapshot</h2>
          <span className="text-xs text-slate-400">Live via CoinGecko</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          {[
            { label: "ETH", value: prices.ethereum?.usd, change: prices.ethereum?.usd_24h_change },
            { label: "POL", value: prices.polygon?.usd, change: prices.polygon?.usd_24h_change },
            { label: "SOL", value: prices.solana?.usd, change: prices.solana?.usd_24h_change },
            { label: "AVAX", value: prices.avalanche?.usd, change: prices.avalanche?.usd_24h_change },
            { label: "BNB", value: prices.bnb?.usd, change: prices.bnb?.usd_24h_change }
          ].map((entry) => (
            <div key={entry.label} className="rounded-xl bg-black/20 p-4">
              <div className="text-xs text-slate-400">{entry.label}</div>
              <div className="mt-1 text-xl font-semibold">
                {entry.value ? `$${entry.value.toFixed(2)}` : "--"}
              </div>
              <div className={entry.change && entry.change >= 0 ? "text-xs text-emerald-400" : "text-xs text-rose-400"}>
                {entry.change !== undefined ? `${entry.change.toFixed(2)}%` : "Waiting for feed"}
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3" variants={item}>
        <motion.div whileHover={{ y: -4 }} className="rounded-2xl bg-white/5 p-6 backdrop-blur">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            {recent.length === 0 && <li className="text-slate-400">No on-chain activity yet.</li>}
            {recent.map((activity) => (
              <li key={activity.id} className="flex justify-between">
                <span>{activity.label}</span>
                <span
                  className={activity.status === "Success" ? "text-emerald-400" : "text-amber-400"}
                >
                  {activity.status}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          id="tour-actions"
          whileHover={{ y: -4 }}
          className="rounded-2xl bg-white/5 p-6 backdrop-blur"
        >
          <h2 className="text-lg font-semibold">Protocol Routing</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            {protocolStats.length === 0 && (
              <div className="text-slate-400">Deploy router to view stats.</div>
            )}
            {protocolStats.map((protocol) => (
              <div key={protocol.name} className="flex items-center justify-between">
                <span>{protocol.name}</span>
                <span className="text-emerald-400">
                  {protocol.total === 0 ? "0%" : `${Math.round((protocol.success / protocol.total) * 100)}%`}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="rounded-2xl bg-white/5 p-6 backdrop-blur">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <div className="mt-4 grid gap-3">
            <Link
              href="/solvers"
              className="rounded-xl bg-[#10B981] px-4 py-2 text-sm font-semibold text-black"
            >
              Become a Solver
            </Link>
            <Link
              href="/analytics"
              className="rounded-xl bg-[#F59E0B] px-4 py-2 text-sm font-semibold text-black"
            >
              View Analytics
            </Link>
            <Link href="/governance" className="rounded-xl border border-white/20 px-4 py-2 text-sm">
              Open Governance
            </Link>
          </div>
        </motion.div>
      </motion.section>
    </motion.div>
  );
}
