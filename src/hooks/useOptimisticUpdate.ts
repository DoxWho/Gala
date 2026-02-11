"use client";

import { trpc } from "@/lib/trpc/client";
import { toast } from "@/hooks/useToast";

export function useOptimisticUpdate(eventId: string | undefined) {
  const utils = trpc.useUtils();

  const checkInMutation = trpc.guests.checkIn.useMutation({
    onMutate: async ({ guestId, isCheckedIn }) => {
      // Cancel outgoing refetches
      if (eventId) {
        await utils.guests.getAll.cancel({ eventId });
      }

      // Optimistically update the guest list cache
      if (eventId) {
        utils.guests.getAll.setData(
          { eventId, search: undefined, isCheckedIn: undefined },
          (old) => {
            if (!old) return old;
            return old.map((g) =>
              g.id === guestId
                ? {
                    ...g,
                    isCheckedIn,
                    checkedInAt: isCheckedIn ? new Date() : null,
                  }
                : g
            );
          }
        );
      }
    },
    onSuccess: () => {
      // Refresh stats after check-in
      if (eventId) {
        utils.guests.getAttendanceStats.invalidate({ eventId });
        utils.dashboard.getStats.invalidate({ eventId });
      }
    },
    onError: () => {
      // Revert on error by refetching
      if (eventId) {
        utils.guests.getAll.invalidate();
      }
      toast({
        title: "Check-in failed",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  const recordRaffleSale = trpc.raffle.recordRaffleSale.useMutation({
    onSuccess: () => {
      if (eventId) {
        utils.guests.getAll.invalidate();
        utils.raffle.getRaffleTotals.invalidate({ eventId });
        utils.dashboard.getStats.invalidate({ eventId });
      }
      toast({ title: "Raffle tickets sold", variant: "success" });
    },
  });

  const recordFiftyFiftySale = trpc.raffle.recordFiftyFiftySale.useMutation({
    onSuccess: () => {
      if (eventId) {
        utils.guests.getAll.invalidate();
        utils.raffle.getFiftyFiftyTotals.invalidate({ eventId });
        utils.dashboard.getStats.invalidate({ eventId });
      }
      toast({ title: "50/50 tickets sold", variant: "success" });
    },
  });

  return {
    checkIn: checkInMutation.mutate,
    isCheckingIn: checkInMutation.isPending,
    recordRaffleSale: recordRaffleSale.mutate,
    recordFiftyFiftySale: recordFiftyFiftySale.mutate,
  };
}
