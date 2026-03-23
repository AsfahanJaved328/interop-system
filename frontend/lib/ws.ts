"use client";

import { useEffect, useState } from "react";

export type Notification = {
  id: string;
  title: string;
  message: string;
  level: "info" | "success" | "warning" | "error";
};

export function useNotifications() {
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    const baseUrl =
      typeof window !== "undefined" ? window.location.origin : "http://localhost:3001";
    const source = new EventSource(`${baseUrl}/api/websocket`);

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as Notification;
        setItems((prev) => [payload, ...prev].slice(0, 5));
      } catch {}
    };

    source.onerror = () => {
      const id = Date.now().toString();
      setItems((prev) => [
        {
          id,
          title: "Stream Error",
          message: "Unable to connect to the notification stream.",
          level: "warning"
        },
        ...prev
      ].slice(0, 5));
      source.close();
    };

    return () => {
      source.close();
    };
  }, []);

  return items;
}
