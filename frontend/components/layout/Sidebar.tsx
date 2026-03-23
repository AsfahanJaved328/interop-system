"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

export default function Sidebar() {
  const items = [
    { label: "Dashboard", href: "/" },
    { label: "Bridge", href: "/bridge" },
    { label: "Intents", href: "/intents" },
    { label: "Solvers", href: "/solvers" },
    { label: "Governance", href: "/governance" },
    { label: "Analytics", href: "/analytics" },
    { label: "Settings", href: "/settings" }
  ];

  return (
    <TooltipProvider>
      <aside className="w-64 border-r border-white/10 p-6">
      <div className="mb-8 text-lg font-semibold">Interop</div>
      <nav className="space-y-3">
        {items.map((item) => (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>
              <a href={item.href} className="block text-slate-300 hover:text-white">
                {item.label}
              </a>
            </TooltipTrigger>
            <TooltipContent>{item.label}</TooltipContent>
          </Tooltip>
        ))}
      </nav>
      </aside>
    </TooltipProvider>
  );
}
