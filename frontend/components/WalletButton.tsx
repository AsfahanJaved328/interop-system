"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { useEffect, useState } from "react";

export default function WalletButton() {
  const { isConnected, address } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="rounded-lg bg-[#4F46E5] px-4 py-2 text-sm">Connect Wallet</button>
    );
  }

  if (isConnected) {
    return (
      <button
        className="rounded-lg border border-white/20 px-3 py-2 text-sm"
        onClick={() => disconnect()}
      >
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </button>
    );
  }

  return (
    <button
      className="rounded-lg bg-[#4F46E5] px-4 py-2 text-sm"
      onClick={() => connect({ connector: injected() })}
    >
      Connect Wallet
    </button>
  );
}
