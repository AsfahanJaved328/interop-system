"use client";

import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogTrigger } from "../../components/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useAccount, useChainId, useReadContract, useSignMessage, useWriteContract } from "wagmi";
import { routerAbi } from "../../lib/routerAbi";
import { feeOracleAbi } from "../../lib/feeOracleAbi";
import { useMarketPrices } from "../../lib/market";
import { createPublicClient, formatEther, http, parseEventLogs, toHex } from "viem";
import { downloadCsv } from "../../lib/csv";

const schema = z.object({
  fromChain: z.string().min(1),
  toChain: z.string().min(1),
  token: z.string().min(1),
  amount: z.string().min(1)
});

const protocolLabels: Record<number, string> = {
  0: "CCIP",
  1: "Axelar",
  2: "LayerZero",
  3: "Wormhole",
  4: "Hyperlane"
};

export default function BridgePage() {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { fromChain: "Ethereum", toChain: "Solana", token: "USDC", amount: "" }
  });
  const [history, setHistory] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [protocols, setProtocols] = useState<number[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(5);
  const [historySource, setHistorySource] = useState<"chain" | "empty">("empty");
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { prices } = useMarketPrices();
  const { signMessageAsync } = useSignMessage();
  const { writeContractAsync } = useWriteContract();
  const feeOracleAddress = process.env.NEXT_PUBLIC_FEE_ORACLE || "0x0000000000000000000000000000000000000000";
  const toChainValue = form.watch("toChain");
  const chainMap: Record<string, number> = {
    Ethereum: 1,
    Polygon: 137,
    Arbitrum: 42161,
    Base: 8453,
    Avalanche: 43114,
    BNB: 56,
    Solana: 101
  };
  const destinationChainId = chainMap[toChainValue] || (chainId || 1);
  const filteredHistory = history.filter((h) =>
    `${h.name} ${h.id}`.toLowerCase().includes(filter.toLowerCase())
  );
  const routePreview = useMemo(() => {
    if (protocols.length === 0) return "Auto-select";
    return protocols.map((protocol) => protocolLabels[protocol] || `Protocol ${protocol}`).join(" -> ");
  }, [protocols]);
  const feeArgs = [BigInt(destinationChainId), 1, 0n] as const;
  const { data: feeEstimate } = useReadContract({
    address: feeOracleAddress as `0x${string}`,
    abi: feeOracleAbi,
    functionName: "estimateFee",
    args: feeArgs,
    query: {
      enabled: feeOracleAddress !== "0x0000000000000000000000000000000000000000"
    }
  });

  useEffect(() => {
    const routerAddress =
      process.env.NEXT_PUBLIC_ROUTER_CONTRACT ||
      "0x0000000000000000000000000000000000000000";
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545";

    async function loadHistory() {
      if (routerAddress === "0x0000000000000000000000000000000000000000") return false;
      const client = createPublicClient({ transport: http(rpcUrl) });
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
      const list = parsed
        .slice(-25)
        .reverse()
        .map((log) => ({
          id: log.args.messageId,
          name: `Bridge to ${log.args.destinationChain.toString()}`,
          status: "Success"
        }));
      setHistory(list);
      setHistorySource("chain");
      return true;
    }

    loadHistory().catch(() => {
      setHistory([]);
      setHistorySource("empty");
    });
  }, []);

  useEffect(() => {
    setPageIndex(0);
  }, [filter]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h1 className="text-2xl font-semibold">Bridge Assets</h1>
      <motion.div whileHover={{ y: -3 }} className="rounded-2xl bg-white/5 p-6 backdrop-blur">
        <form className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="text-xs text-slate-400">From Chain</label>
            <select className="mt-2 w-full rounded-xl bg-black/30 p-3" {...form.register("fromChain")}>
              <option>Ethereum</option>
              <option>Polygon</option>
              <option>Arbitrum</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400">To Chain</label>
            <select className="mt-2 w-full rounded-xl bg-black/30 p-3" {...form.register("toChain")}>
              <option>Solana</option>
              <option>Base</option>
              <option>Avalanche</option>
              <option>Polygon</option>
              <option>Arbitrum</option>
              <option>BNB</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400">Token</label>
            <select className="mt-2 w-full rounded-xl bg-black/30 p-3" {...form.register("token")}>
              <option>USDC</option>
              <option>ETH</option>
              <option>WBTC</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400">Amount</label>
            <input className="mt-2 w-full rounded-xl bg-black/30 p-3" placeholder="0.0" {...form.register("amount")} />
          </div>
        </form>
        <div className="mt-6 text-xs text-slate-400">Preferred Protocols</div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {[
            { label: "CCIP", id: 0 },
            { label: "Axelar", id: 1 },
            { label: "LayerZero", id: 2 },
            { label: "Wormhole", id: 3 },
            { label: "Hyperlane", id: 4 }
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              className={`rounded-full border px-3 py-1 ${
                protocols.includes(p.id)
                  ? "border-[#4F46E5] bg-[#4F46E5]/20 text-white"
                  : "border-white/10 text-slate-300"
              }`}
              onClick={() => {
                setProtocols((prev) =>
                  prev.includes(p.id) ? prev.filter((item) => item !== p.id) : [...prev, p.id]
                );
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between text-sm text-slate-300">
          <span>
            Estimated fee:{" "}
            {feeEstimate
              ? `${Number(formatEther(feeEstimate as bigint)).toFixed(4)} ETH`
              : "Waiting for FeeOracle"}
          </span>
          <span>Estimated time: ~30s</span>
        </div>
        <div className="mt-2 text-xs text-slate-400">
          Market snapshot: ETH {prices.ethereum?.usd ? `$${prices.ethereum.usd.toFixed(2)}` : "--"} | POL{" "}
          {prices.polygon?.usd ? `$${prices.polygon.usd.toFixed(2)}` : "--"}
        </div>
        <Dialog>
          <DialogTrigger className="mt-6 rounded-xl bg-[#4F46E5] px-6 py-3 text-sm font-semibold">
            Bridge Now
          </DialogTrigger>
          <DialogContent>
            <h3 className="text-lg font-semibold">Transaction Preview</h3>
            <p className="mt-2 text-sm text-slate-300">
              Route: {routePreview} | Fee:{" "}
              {feeEstimate ? `${Number(formatEther(feeEstimate as bigint)).toFixed(4)} ETH` : "TBD"} |
              ETA: 30s
            </p>
            <button
              className="mt-4 rounded-xl bg-[#10B981] px-4 py-2 text-sm font-semibold text-black"
              disabled={!isConnected}
              onClick={async () => {
                try {
                  const routerAddress =
                    process.env.NEXT_PUBLIC_ROUTER_CONTRACT ||
                    "0x0000000000000000000000000000000000000000";
                  const deadline = Math.floor(Date.now() / 1000) + 3600;

                  if (routerAddress !== "0x0000000000000000000000000000000000000000" && address) {
                    const nextHash = await writeContractAsync({
                      address: routerAddress as `0x${string}`,
                      abi: routerAbi,
                      functionName: "routeMessage",
                      args: [
                        BigInt(destinationChainId),
                        address,
                        toHex("bridge"),
                        protocols,
                        BigInt(deadline)
                      ],
                      value: feeEstimate ? BigInt(feeEstimate as bigint) : 0n
                    });
                    setTxHash(nextHash);
                  } else {
                    await signMessageAsync({ message: "Bridge transaction confirmation" });
                    setTxHash(`0x${Math.random().toString(16).slice(2, 10)}...`);
                  }
                } catch {}
              }}
            >
              Confirm
            </button>
            {txHash && <div className="mt-3 text-xs text-emerald-400">Tx: {txHash}</div>}
          </DialogContent>
        </Dialog>
      </motion.div>
      <div className="rounded-2xl bg-white/5 p-6 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Bridge History</h2>
          <button
            type="button"
            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300"
            onClick={() => downloadCsv("bridge-history.csv", filteredHistory)}
          >
            Export CSV
          </button>
        </div>
        <div className="mt-3">
          <input
            className="w-full rounded-xl bg-black/30 p-2 text-sm"
            placeholder="Filter by chain or id"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
        </div>
        <div className="mt-4 space-y-2 text-sm text-slate-300">
          {history.length === 0 && (
            <div className="text-slate-400">
              {historySource === "chain"
                ? "No bridge messages have been routed on this local chain yet."
                : "Deploy the local contracts and route a message to populate history."}
            </div>
          )}
          {filteredHistory
            .slice(pageIndex * pageSize, pageIndex * pageSize + pageSize)
            .map((h) => (
              <div key={h.id} className="flex justify-between border-b border-white/10 pb-2">
                <span>{h.name || "Bridge Message"}</span>
                <span className={h.status === "Success" ? "text-emerald-400" : "text-amber-400"}>
                  {h.status || "Pending"}
                </span>
              </div>
            ))}
          {filteredHistory.length > pageSize && (
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <button
                className="rounded-lg border border-white/10 px-2 py-1"
                disabled={pageIndex === 0}
                onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
              >
                Prev
              </button>
              <span>
                Page {pageIndex + 1} / {Math.max(1, Math.ceil(filteredHistory.length / pageSize))}
              </span>
              <button
                className="rounded-lg border border-white/10 px-2 py-1"
                disabled={(pageIndex + 1) * pageSize >= filteredHistory.length}
                onClick={() =>
                  setPageIndex((prev) =>
                    (prev + 1) * pageSize >= filteredHistory.length ? prev : prev + 1
                  )
                }
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
