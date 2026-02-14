"use client";

import { trpc } from "@/lib/trpc/client";
import { useGuestStore } from "@/store/guestStore";
import { useDebounce } from "@/hooks/useDebounce";
import { GuestRow } from "./GuestRow";
import { GuestSearch } from "./GuestSearch";
import { QuickAddGuest } from "./QuickAddGuest";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/useToast";

interface GuestListProps {
  eventId: string;
}

export function GuestList({ eventId }: GuestListProps) {
  const { searchQuery, filterCheckedIn } = useGuestStore();
  const debouncedSearch = useDebounce(searchQuery, 300);

  const utils = trpc.useUtils();

  const { data: guests, isLoading } = trpc.guests.getAll.useQuery(
    {
      eventId,
      search: debouncedSearch || undefined,
      isCheckedIn: filterCheckedIn ?? undefined,
    },
    { refetchInterval: 15000 }
  );

  const { data: parties } = trpc.parties.getAll.useQuery({ eventId });

  const { data: stats } = trpc.guests.getAttendanceStats.useQuery(
    { eventId },
    { refetchInterval: 10000 }
  );

  const checkInMutation = trpc.guests.checkIn.useMutation({
    onMutate: async ({ guestId, isCheckedIn }) => {
      await utils.guests.getAll.cancel();
      const previousGuests = utils.guests.getAll.getData({
        eventId,
        search: debouncedSearch || undefined,
        isCheckedIn: filterCheckedIn ?? undefined,
      });

      utils.guests.getAll.setData(
        {
          eventId,
          search: debouncedSearch || undefined,
          isCheckedIn: filterCheckedIn ?? undefined,
        },
        (old) =>
          old?.map((g) =>
            g.id === guestId
              ? { ...g, isCheckedIn, checkedInAt: isCheckedIn ? new Date() : null }
              : g
          )
      );

      return { previousGuests };
    },
    onError: (err, _vars, context) => {
      if (context?.previousGuests) {
        utils.guests.getAll.setData(
          {
            eventId,
            search: debouncedSearch || undefined,
            isCheckedIn: filterCheckedIn ?? undefined,
          },
          context.previousGuests
        );
      }
      toast({
        title: "Check-in failed",
        description: err.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      utils.guests.getAll.invalidate();
      utils.guests.getAttendanceStats.invalidate({ eventId });
      utils.dashboard.getStats.invalidate({ eventId });
    },
  });

  if (isLoading) {
    return <LoadingSpinner text="Loading guests..." className="py-12" />;
  }

  const partyList = parties?.map((p) => ({
    id: p.id,
    partyName: p.partyName,
  })) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Guest List</h2>
          {stats && (
            <Badge variant="outline">
              {stats.checkedIn} / {stats.total} checked in
            </Badge>
          )}
        </div>
        <QuickAddGuest eventId={eventId} parties={partyList} />
      </div>

      <GuestSearch />

      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="space-y-2">
          {guests && guests.length > 0 ? (
            guests.map((guest) => (
              <GuestRow
                key={guest.id}
                guest={guest}
                eventId={eventId}
                onCheckIn={(guestId, isCheckedIn) =>
                  checkInMutation.mutate({ guestId, isCheckedIn })
                }
                isCheckingIn={checkInMutation.isPending}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p className="text-lg font-medium">No guests found</p>
              <p className="text-sm">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Add guests to get started"}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
