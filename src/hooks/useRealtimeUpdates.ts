"use client";

import { useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc/client";

export function useRealtimeUpdates(eventId: string | undefined) {
  const utils = trpc.useUtils();

  // Polling-based refresh for real-time feel
  // In production, this would be replaced with WebSocket/SSE
  const refreshData = useCallback(() => {
    if (!eventId) return;

    // Invalidate key queries to trigger refetch
    utils.dashboard.getStats.invalidate({ eventId });
    utils.guests.getAll.invalidate();
  }, [eventId, utils]);

  useEffect(() => {
    if (!eventId) return;

    // Poll every 10 seconds for updates from other users
    const interval = setInterval(refreshData, 10000);

    // Also refresh on window focus
    const handleFocus = () => refreshData();
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [eventId, refreshData]);

  return { refreshData };
}
