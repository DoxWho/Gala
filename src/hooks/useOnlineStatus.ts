"use client";

import { useEffect } from "react";
import { useSyncStore } from "@/store/syncStore";

export function useOnlineStatus() {
  const { isOnline, setOnlineStatus } = useSyncStore();

  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Set initial status
    setOnlineStatus(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setOnlineStatus]);

  return isOnline;
}
