"use client";

import { useNotifications } from "../../lib/ws";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "../ui/dropdown-menu";
import WalletButton from "../WalletButton";

export default function Header() {
  const notifications = useNotifications();
  return (
    <header className="flex items-center justify-between border-b border-white/10 px-8 py-4">
      <div className="text-sm text-slate-400">Network: Ethereum / Solana / Polygon</div>
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-lg border border-white/20 px-3 py-2 text-sm">
            Alerts
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64">
            {notifications.length === 0 ? (
              <div className="text-slate-400">No alerts yet</div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="mb-2">
                  <div className="font-semibold">{n.title}</div>
                  <div className="text-slate-400">{n.message}</div>
                </div>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <WalletButton />
        <button className="rounded-lg border border-white/20 px-3 py-2 text-sm">Theme</button>
      </div>
    </header>
  );
}
