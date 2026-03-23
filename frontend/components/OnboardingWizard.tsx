import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const steps = [
  {
    title: "Welcome to Interop",
    body: "Track cross-chain routing, intents, and governance in one control plane."
  },
  {
    title: "Connect Wallet",
    body: "Link your wallet to create intents, vote on proposals, and bridge assets."
  },
  {
    title: "Customize Preferences",
    body: "Set default chains and slippage to streamline every transaction."
  }
];

export default function OnboardingWizard() {
  const [open, setOpen] = useState(true);
  const [index, setIndex] = useState(0);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-xl font-semibold">{steps[index].title}</h2>
            <p className="mt-2 text-sm text-slate-300">{steps[index].body}</p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex items-center justify-between">
          <button
            className="rounded-lg border border-white/20 px-3 py-2 text-xs"
            onClick={() => setOpen(false)}
          >
            Skip
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
            className="rounded-lg bg-[#4F46E5] px-4 py-2 text-xs font-semibold"
            onClick={() => {
              if (index === steps.length - 1) {
                setOpen(false);
              } else {
                setIndex(index + 1);
              }
            }}
          >
            {index === steps.length - 1 ? "Finish" : "Next"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
