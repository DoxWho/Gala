"use client";

import { Badge } from "@/components/ui/badge";
import { CheckInToggle } from "./CheckInToggle";
import { GuestActions } from "./GuestActions";
import { cn } from "@/lib/utils/cn";
import { formatTime } from "@/lib/utils/date";
import type { GuestWithParty } from "@/types";

interface GuestRowProps {
  guest: GuestWithParty;
  eventId: string;
  onCheckIn: (guestId: string, isCheckedIn: boolean) => void;
  isCheckingIn: boolean;
}

export function GuestRow({
  guest,
  eventId,
  onCheckIn,
  isCheckingIn,
}: GuestRowProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border p-3 transition-colors sm:flex-row sm:items-center sm:gap-4",
        guest.isCheckedIn &&
          "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900"
      )}
    >
      {/* Check-in toggle - large touch target */}
      <div className="flex items-center gap-3 sm:w-44 min-h-[44px]">
        <CheckInToggle
          isCheckedIn={guest.isCheckedIn}
          onToggle={(checked) => onCheckIn(guest.id, checked)}
          disabled={isCheckingIn}
        />
        {guest.isCheckedIn && guest.checkedInAt && (
          <span className="text-xs text-green-600 hidden sm:inline">
            {formatTime(guest.checkedInAt)}
          </span>
        )}
      </div>

      {/* Guest info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium truncate">
            {guest.firstName} {guest.lastName}
          </span>
          {guest.isWalkIn && (
            <Badge variant="warning" className="text-[10px] px-1.5 py-0">
              Walk-in
            </Badge>
          )}
          {guest.isPlusOne && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              +1
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {guest.party.partyName}
          {guest.email && ` | ${guest.email}`}
        </div>
      </div>

      {/* Stats badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {guest.raffleQuantity > 0 && (
          <Badge variant="outline" className="gap-1 text-xs">
            Raffle: {guest.raffleQuantity}
          </Badge>
        )}
        {guest.fiftyFiftyQuantity > 0 && (
          <Badge variant="outline" className="gap-1 text-xs">
            50/50: {guest.fiftyFiftyQuantity}
          </Badge>
        )}
      </div>

      {/* Actions - large touch target */}
      <div className="flex items-center min-h-[44px]">
        <GuestActions
          guestId={guest.id}
          guestName={`${guest.firstName} ${guest.lastName}`}
          eventId={eventId}
        />
      </div>
    </div>
  );
}
