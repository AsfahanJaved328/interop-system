"use client";

import { motion } from "framer-motion";

export default function GovernancePage() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h1 className="text-2xl font-semibold">Governance</h1>
      <motion.div whileHover={{ y: -3 }} className="rounded-2xl bg-white/5 p-6 backdrop-blur">
        <h2 className="text-lg font-semibold">Active Proposals</h2>
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-white/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Proposal #21</div>
                <div className="text-xs text-slate-400">Upgrade Router v2</div>
              </div>
              <div className="flex gap-2">
                <button className="rounded-lg bg-emerald-500 px-3 py-1 text-xs text-black">Vote Yes</button>
                <button className="rounded-lg bg-red-500 px-3 py-1 text-xs text-white">Vote No</button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div whileHover={{ y: -3 }} className="rounded-2xl bg-white/5 p-6 backdrop-blur">
        <h2 className="text-lg font-semibold">Create Proposal</h2>
        <div className="mt-4 grid gap-4">
          <input className="rounded-xl bg-black/30 p-3" placeholder="Title" />
          <textarea className="rounded-xl bg-black/30 p-3" placeholder="Description" rows={4} />
          <button className="rounded-xl bg-[#4F46E5] px-6 py-3 text-sm font-semibold">
            Submit Proposal
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
