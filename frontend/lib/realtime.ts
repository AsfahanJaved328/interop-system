import { useEffect, useState } from "react";

type Stats = {
  volume: string;
  intents: number;
  solvers: number;
  gasSaved: string;
};

export function useRealtimeStats() {
  const [stats, setStats] = useState<Stats>({
    volume: "$1.2B",
    intents: 342,
    solvers: 56,
    gasSaved: "32%"
  });

  useEffect(() => {
    const id = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        intents: prev.intents + Math.floor(Math.random() * 3),
        solvers: prev.solvers + (Math.random() > 0.7 ? 1 : 0)
      }));
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return stats;
}
