"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Filter } from "lucide-react";
import { useGuestStore } from "@/store/guestStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function GuestSearch() {
  const {
    searchQuery,
    setSearchQuery,
    filterCheckedIn,
    setFilterCheckedIn,
  } = useGuestStore();

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search guests by name, email, or party..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <Select
        value={filterCheckedIn === null ? "all" : filterCheckedIn ? "checked-in" : "not-checked-in"}
        onValueChange={(value) => {
          if (value === "all") setFilterCheckedIn(null);
          else if (value === "checked-in") setFilterCheckedIn(true);
          else setFilterCheckedIn(false);
        }}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <Filter className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Filter" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Guests</SelectItem>
          <SelectItem value="checked-in">Checked In</SelectItem>
          <SelectItem value="not-checked-in">Not Checked In</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
