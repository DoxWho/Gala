"use client";

import { trpc } from "@/lib/trpc/client";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { AttendanceCounter } from "@/components/dashboard/AttendanceCounter";
import { FundraisingThermometer } from "@/components/dashboard/FundraisingThermometer";
import { LiveStats } from "@/components/dashboard/LiveStats";
import { EventGoalProgress } from "@/components/dashboard/EventGoalProgress";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils/date";
import { Calendar } from "lucide-react";

export default function DashboardPage() {
  const { data: event, isLoading: eventLoading } =
    trpc.dashboard.getActiveEvent.useQuery();

  const { data: stats, isLoading: statsLoading } =
    trpc.dashboard.getStats.useQuery(
      { eventId: event?.id! },
      {
        enabled: !!event?.id,
        refetchInterval: 10000,
      }
    );

  useRealtimeUpdates(event?.id);

  if (eventLoading) {
    return <LoadingSpinner text="Loading event..." className="py-12" />;
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

  if (statsLoading || !stats) {
    return <LoadingSpinner text="Loading dashboard..." className="py-12" />;
  }

  return (
    <div className="space-y-6">
      {/* Event Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{event.name}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Calendar className="h-4 w-4" />
            {formatDateTime(event.eventDate)}
          </div>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <AttendanceCounter
          totalGuests={stats.totalGuests}
          checkedInGuests={stats.checkedInGuests}
        />
        <FundraisingThermometer
          totalRaised={stats.totalRaised}
          goalAmount={stats.goalAmount}
        />
      </div>

      {/* Live Stats Grid */}
      <LiveStats
        initialTicketSales={stats.initialTicketSales}
        initialSponsorships={stats.initialSponsorships}
        initialPrePledges={stats.initialPrePledges}
        galaNightDonations={stats.galaNightDonations}
        prePledgedDonations={stats.prePledgedDonations}
        raffleRevenue={stats.raffleRevenue}
        fiftyFiftyRevenue={stats.fiftyFiftyRevenue}
        auctionRevenue={stats.auctionRevenue}
      />

      {/* Detailed Breakdown */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <EventGoalProgress stats={stats} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/guests"
              className="block rounded-lg border p-3 hover:bg-accent transition-colors"
            >
              <div className="font-medium text-sm">Guest Check-In</div>
              <div className="text-xs text-muted-foreground">
                Manage guest arrivals and check-ins
              </div>
            </a>
            <a
              href="/impact-board"
              className="block rounded-lg border p-3 hover:bg-accent transition-colors"
            >
              <div className="font-medium text-sm">Impact Board</div>
              <div className="text-xs text-muted-foreground">
                Record pledges and donations
              </div>
            </a>
            <a
              href="/auction"
              className="block rounded-lg border p-3 hover:bg-accent transition-colors"
            >
              <div className="font-medium text-sm">Live Auction</div>
              <div className="text-xs text-muted-foreground">
                Manage auction items and winners
              </div>
            </a>
            <a
              href="/reports"
              className="block rounded-lg border p-3 hover:bg-accent transition-colors"
            >
              <div className="font-medium text-sm">Reports & Export</div>
              <div className="text-xs text-muted-foreground">
                View reports and export data
              </div>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
