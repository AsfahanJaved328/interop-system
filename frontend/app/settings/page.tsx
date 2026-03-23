"use client";

import { motion } from "framer-motion";

export default function SettingsPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <motion.div whileHover={{ y: -3 }} className="rounded-2xl bg-white/5 p-6 backdrop-blur">
        <h2 className="text-lg font-semibold">Preferences</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <input className="rounded-xl bg-black/30 p-3" placeholder="Default chains" />
          <input className="rounded-xl bg-black/30 p-3" placeholder="Default slippage %"/>
          <input className="rounded-xl bg-black/30 p-3" placeholder="Notification email" />
          <select className="rounded-xl bg-black/30 p-3">
            <option>Dark</option>
            <option>Light</option>
            <option>System</option>
          </select>
        </div>
      </motion.div>
    </motion.div>
  );
}
