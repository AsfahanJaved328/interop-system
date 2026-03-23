"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const tips = [
  "Use Bridge to move assets across chains",
  "Intents let solvers execute complex workflows",
  "Governance controls upgrades and parameters"
];

export default function GlobalTour() {
  const [open, setOpen] = useState(true);
  const [index, setIndex] = useState(0);

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-6 right-6 z-40 rounded-2xl border border-white/10 bg-black/80 p-4 text-sm text-white"
    >
      <div className="font-semibold">Quick Tour</div>
      <div className="mt-1 text-slate-300">{tips[index]}</div>
      <div className="mt-3 flex items-center justify-between">
        <button className="text-xs text-slate-400" onClick={() => setOpen(false)}>
          Dismiss
        </button>
        <button
          className="rounded-lg bg-[#4F46E5] px-3 py-1 text-xs"
          onClick={() => setIndex((index + 1) % tips.length)}
        >
          Next tip
        </button>
      </div>
    </motion.div>
  );
}
