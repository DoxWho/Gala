import { create } from "zustand";

interface GuestState {
  searchQuery: string;
  filterCheckedIn: boolean | null;
  selectedGuestId: string | null;
  setSearchQuery: (query: string) => void;
  setFilterCheckedIn: (filter: boolean | null) => void;
  setSelectedGuestId: (id: string | null) => void;
}

export const useGuestStore = create<GuestState>((set) => ({
  searchQuery: "",
  filterCheckedIn: null,
  selectedGuestId: null,
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterCheckedIn: (filter) => set({ filterCheckedIn: filter }),
  setSelectedGuestId: (id) => set({ selectedGuestId: id }),
}));
