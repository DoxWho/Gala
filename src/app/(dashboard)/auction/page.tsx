"use client";

import { trpc } from "@/lib/trpc/client";
import { AuctionItemList } from "@/components/auction/AuctionItemList";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function AuctionPage() {
  const { data: event, isLoading } = trpc.dashboard.getActiveEvent.useQuery();

  if (isLoading) {
    return <LoadingSpinner text="Loading..." className="py-12" />;
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-lg font-semibold">No Active Event</h2>
        <p className="text-muted-foreground">
          Create an event in Settings to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Auction</h1>
        <p className="text-sm text-muted-foreground">
          Manage auction items, assign winners, and track revenue
        </p>
      </div>
      <AuctionItemList eventId={event.id} />
    </div>
  );
}
