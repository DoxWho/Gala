"use client";

import { useEffect, useCallback } from "react";
import { useSyncStore } from "@/store/syncStore";
import { useOnlineStatus } from "./useOnlineStatus";

export function useSync() {
  const isOnline = useOnlineStatus();
  const { setIsSyncing, setLastSyncTime, setPendingOperations } =
    useSyncStore();

  const sync = useCallback(async () => {
    if (!isOnline) return;

    try {
      setIsSyncing(true);
      // Import dynamically to avoid SSR issues
      const { getSyncManager } = await import("@/lib/offline/sync");
      const { getPendingCount } = await import("@/lib/offline/queue");

      const syncManager = getSyncManager();
      await syncManager.processQueue();

      const remaining = await getPendingCount();
      setPendingOperations(remaining);
      setLastSyncTime(new Date().toISOString());
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, setIsSyncing, setLastSyncTime, setPendingOperations]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline) {
      sync();
    }
  }, [isOnline, sync]);

  // Periodic sync
  useEffect(() => {
    if (!isOnline) return;

    const interval = setInterval(sync, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [isOnline, sync]);

  return { sync, isOnline };
}
