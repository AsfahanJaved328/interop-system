import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const steps = [
  { id: "tour-hero", title: "Router Health", body: "Track system KPIs and uptime at a glance." },
  { id: "tour-stats", title: "Protocol Stats", body: "Live stats for volume, intents, and solvers." },
  { id: "tour-actions", title: "Quick Actions", body: "Jump to key flows like bridging or governance." }
];

export default function GuidedTour() {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(true);

  if (!open) return null;

  const step = steps[index];

  return (
    <div className="fixed inset-0 z-40 bg-black/50">
      <AnimatePresence>
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute left-1/2 top-12 w-full max-w-md -translate-x-1/2 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur"
        >
          <h3 className="text-base font-semibold">{step.title}</h3>
          <p className="mt-1 text-sm text-slate-300">{step.body}</p>
          <div className="mt-4 flex items-center justify-between">
            <button className="text-xs text-slate-400" onClick={() => setOpen(false)}>
              End tour
            </button>
            <div className="flex gap-2">
              {steps.map((_, i) => (
                <span
                  key={i}
                  className={`h-2 w-2 rounded-full ${i === index ? "bg-[#4F46E5]" : "bg-white/20"}`}
                />
              ))}
            </div>
            <button
              className="rounded-lg bg-[#4F46E5] px-3 py-2 text-xs font-semibold"
              onClick={() => {
                if (index === steps.length - 1) setOpen(false);
                else setIndex(index + 1);
              }}
            >
              {index === steps.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
