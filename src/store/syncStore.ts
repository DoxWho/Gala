import { create } from "zustand";

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingOperations: number;
  lastSyncTime: string | null;
  setOnlineStatus: (status: boolean) => void;
  setIsSyncing: (syncing: boolean) => void;
  setPendingOperations: (count: number) => void;
  incrementPending: () => void;
  decrementPending: () => void;
  setLastSyncTime: (time: string) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  isSyncing: false,
  pendingOperations: 0,
  lastSyncTime: null,
  setOnlineStatus: (status) => set({ isOnline: status }),
  setIsSyncing: (syncing) => set({ isSyncing: syncing }),
  setPendingOperations: (count) => set({ pendingOperations: count }),
  incrementPending: () =>
    set((state) => ({ pendingOperations: state.pendingOperations + 1 })),
  decrementPending: () =>
    set((state) => ({
      pendingOperations: Math.max(0, state.pendingOperations - 1),
    })),
  setLastSyncTime: (time) => set({ lastSyncTime: time }),
}));
