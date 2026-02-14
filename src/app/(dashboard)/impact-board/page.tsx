"use client";

import { trpc } from "@/lib/trpc/client";
import { ImpactBoardGrid } from "@/components/impact-board/ImpactBoardGrid";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function ImpactBoardPage() {
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
        <h1 className="text-2xl font-bold">Impact Board</h1>
        <p className="text-sm text-muted-foreground">
          Manage pledges and track funding progress for impact items
        </p>
      </div>
      <ImpactBoardGrid eventId={event.id} />
    </div>
  );
}
