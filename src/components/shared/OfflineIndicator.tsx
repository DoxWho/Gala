"use client";

import { useSyncStore } from "@/store/syncStore";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function OfflineIndicator() {
  const { isOnline, isSyncing, pendingOperations } = useSyncStore();

  if (isOnline && pendingOperations === 0 && !isSyncing) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-lg",
        !isOnline
          ? "bg-destructive text-destructive-foreground"
          : isSyncing
            ? "bg-yellow-500 text-white"
            : "bg-blue-500 text-white"
      )}
    >
      {!isOnline ? (
        <>
          <WifiOff className="h-4 w-4" />
          <span>Offline</span>
          {pendingOperations > 0 && (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
              {pendingOperations} pending
            </span>
          )}
        </>
      ) : isSyncing ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Syncing...</span>
        </>
      ) : (
        <>
          <Wifi className="h-4 w-4" />
          <span>{pendingOperations} changes to sync</span>
        </>
      )}
    </div>
  );
}
