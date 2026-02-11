"use client";

import { Badge } from "@/components/ui/badge";
import { CheckInToggle } from "./CheckInToggle";
import { GuestActions } from "./GuestActions";
import { cn } from "@/lib/utils/cn";
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
        guest.isCheckedIn && "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900"
      )}
    >
      {/* Check-in toggle */}
      <div className="flex items-center gap-3 sm:w-40">
        <CheckInToggle
          isCheckedIn={guest.isCheckedIn}
          onToggle={(checked) => onCheckIn(guest.id, checked)}
          disabled={isCheckingIn}
        />
      </div>

      {/* Guest info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">
            {guest.firstName} {guest.lastName}
          </span>
          {guest.isWalkIn && <Badge variant="warning">Walk-in</Badge>}
          {guest.isPlusOne && <Badge variant="secondary">+1</Badge>}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {guest.party.partyName}
          {guest.email && ` | ${guest.email}`}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {guest.raffleQuantity > 0 && (
          <Badge variant="outline" className="gap-1">
            Raffle: {guest.raffleQuantity}
          </Badge>
        )}
        {guest.fiftyFiftyQuantity > 0 && (
          <Badge variant="outline" className="gap-1">
            50/50: {guest.fiftyFiftyQuantity}
          </Badge>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center">
        <GuestActions
          guestId={guest.id}
          guestName={`${guest.firstName} ${guest.lastName}`}
          eventId={eventId}
        />
      </div>
    </div>
  );
}
