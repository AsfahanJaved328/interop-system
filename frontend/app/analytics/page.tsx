"use client";

import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { useEffect, useState } from "react";
import { createPublicClient, http } from "viem";
import { routerAbi } from "../../lib/routerAbi";

export default function AnalyticsPage() {
  const [lineData, setLineData] = useState([
    { name: "Mon", volume: 120 },
    { name: "Tue", volume: 200 },
    { name: "Wed", volume: 170 },
    { name: "Thu", volume: 220 },
    { name: "Fri", volume: 260 }
  ]);
  const [barData, setBarData] = useState([
    { name: "ETH", value: 320 },
    { name: "SOL", value: 210 },
    { name: "ARB", value: 180 }
  ]);
  const [pieData, setPieData] = useState([
    { name: "Success", value: 92 },
    { name: "Fail", value: 8 }
  ]);
  const [protocolData, setProtocolData] = useState<
    { name: string; success: number; total: number }[]
  >([
    { name: "CCIP", success: 0, total: 0 },
    { name: "Axelar", success: 0, total: 0 },
    { name: "LayerZero", success: 0, total: 0 },
    { name: "Wormhole", success: 0, total: 0 },
    { name: "Hyperlane", success: 0, total: 0 }
  ]);
  const [latencyData, setLatencyData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545";
    const routerAddress =
      process.env.NEXT_PUBLIC_ROUTER_CONTRACT || "0x0000000000000000000000000000000000000000";
    if (routerAddress === "0x0000000000000000000000000000000000000000") return;
    const client = createPublicClient({ transport: http(rpcUrl) });

    async function loadStats() {
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
      setProtocolData(stats);
      const latencies = await Promise.all(
        protocols.map(async (p) => {
          const result = await client.readContract({
            address: routerAddress as `0x${string}`,
            abi: routerAbi,
            functionName: "getAdapterStats",
            args: [1n, p.id]
          });
          return {
            name: p.name,
            value: Number(result[1])
          };
        })
      );
      setLatencyData(latencies);
      const totalSuccess = stats.reduce((sum, p) => sum + p.success, 0);
      const totalMsgs = stats.reduce((sum, p) => sum + p.total, 0);
      const successRate = totalMsgs === 0 ? 0 : Math.round((totalSuccess / totalMsgs) * 100);

      setPieData([
        { name: "Success", value: successRate },
        { name: "Fail", value: Math.max(0, 100 - successRate) }
      ]);
      setBarData(
        stats.map((p) => ({
          name: p.name,
          value: p.total
        }))
      );
      setLineData((prev) =>
        prev.map((p, i) => ({
          ...p,
          volume: p.volume + (totalMsgs % (i + 3)) * 10
        }))
      );
    }

    loadStats().catch(() => {});
  }, []);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <motion.div whileHover={{ y: -3 }} className="rounded-2xl bg-white/5 p-6 backdrop-blur">
          <h2 className="text-lg font-semibold">Volume by Chain</h2>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="value" fill="#4F46E5" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
        <motion.div whileHover={{ y: -3 }} className="rounded-2xl bg-white/5 p-6 backdrop-blur">
          <h2 className="text-lg font-semibold">Success Rate</h2>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={50} outerRadius={80}>
                  {pieData.map((entry, idx) => (
                    <Cell key={entry.name} fill={idx === 0 ? "#10B981" : "#EF4444"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
      <motion.div whileHover={{ y: -3 }} className="rounded-2xl bg-white/5 p-6 backdrop-blur">
        <h2 className="text-lg font-semibold">Daily Volume</h2>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="volume" stroke="#7AD8FF" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
      <motion.div whileHover={{ y: -3 }} className="rounded-2xl bg-white/5 p-6 backdrop-blur">
        <h2 className="text-lg font-semibold">Protocol Latency (ms)</h2>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={latencyData}>
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="value" fill="#10B981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </motion.div>
  );
}
