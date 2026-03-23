"use client";

import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

export default function SolversPage() {
  const schema = z.object({
    name: z.string().min(1),
    collateral: z.string().min(1),
    chains: z.string().min(1),
    intents: z.string().min(1)
  });
  const form = useForm({ resolver: zodResolver(schema) });
  const [countries, setCountries] = useState<any[]>([]);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";
    fetch(`${base}/api/countries`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCountries(data.slice(0, 5));
      })
      .catch(() => {});
  }, []);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h1 className="text-2xl font-semibold">Solver Network</h1>
      <motion.div whileHover={{ y: -3 }} className="rounded-2xl bg-white/5 p-6 backdrop-blur">
        <h2 className="text-lg font-semibold">Register Solver</h2>
        <form className="mt-4 grid gap-4 md:grid-cols-2">
          <input className="rounded-xl bg-black/30 p-3" placeholder="Solver name" {...form.register("name")} />
          <input className="rounded-xl bg-black/30 p-3" placeholder="Collateral (ETH)" {...form.register("collateral")} />
          <input className="rounded-xl bg-black/30 p-3" placeholder="Supported chains" {...form.register("chains")} />
          <input className="rounded-xl bg-black/30 p-3" placeholder="Intent types" {...form.register("intents")} />
        </form>
        <button className="mt-4 rounded-xl bg-[#10B981] px-6 py-3 text-sm font-semibold text-black">
          Register
        </button>
      </motion.div>

      <motion.div whileHover={{ y: -3 }} className="rounded-2xl bg-white/5 p-6 backdrop-blur">
        <h2 className="text-lg font-semibold">Leaderboard</h2>
        <table className="mt-4 w-full text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="py-2 text-left">Rank</th>
              <th className="py-2 text-left">Solver</th>
              <th className="py-2 text-left">Success</th>
              <th className="py-2 text-left">Volume</th>
            </tr>
          </thead>
          <tbody>
            {(countries.length ? countries.map((c) => c.name) : ["Atlas-01", "Hydra-02", "Nova-03"]).map((s, i) => (
              <tr key={s} className="border-t border-white/10">
                <td className="py-2">{i + 1}</td>
                <td className="py-2">{s}</td>
                <td className="py-2 text-emerald-400">99%</td>
                <td className="py-2">$120M</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </motion.div>
  );
}
