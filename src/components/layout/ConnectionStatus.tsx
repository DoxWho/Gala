"use client";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useSyncStore } from "@/store/syncStore";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function ConnectionStatus() {
  const isOnline = useOnlineStatus();
  const { isSyncing, pendingOperations } = useSyncStore();

  return (
    <div className="flex items-center gap-2">
      {isOnline ? (
        <Wifi className="h-4 w-4 text-green-500" />
      ) : (
        <WifiOff className="h-4 w-4 text-destructive" />
      )}
      {isSyncing && (
        <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
      )}
      {pendingOperations > 0 && (
        <span className="text-xs text-muted-foreground">
          {pendingOperations} pending
        </span>
      )}
    </div>
  );
}
