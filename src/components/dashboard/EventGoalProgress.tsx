"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils/formatting";
import type { DashboardStats } from "@/types";

interface EventGoalProgressProps {
  stats: DashboardStats;
}

export function EventGoalProgress({ stats }: EventGoalProgressProps) {
  const preEventTotal =
    stats.initialTicketSales +
    stats.initialSponsorships +
    stats.initialPrePledges;

  const galaNightTotal =
    stats.galaNightDonations +
    stats.raffleRevenue +
    stats.fiftyFiftyRevenue +
    stats.auctionRevenue;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Fundraising Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Pre-Event Total</span>
            <span className="font-medium">{formatCurrency(preEventTotal)}</span>
          </div>
          <div className="ml-4 space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Ticket Sales</span>
              <span>{formatCurrency(stats.initialTicketSales)}</span>
            </div>
            <div className="flex justify-between">
              <span>Sponsorships</span>
              <span>{formatCurrency(stats.initialSponsorships)}</span>
            </div>
            <div className="flex justify-between">
              <span>Pre-Pledges</span>
              <span>{formatCurrency(stats.initialPrePledges)}</span>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Gala Night Total</span>
            <span className="font-medium">{formatCurrency(galaNightTotal)}</span>
          </div>
          <div className="ml-4 space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Donations</span>
              <span>{formatCurrency(stats.galaNightDonations)}</span>
            </div>
            <div className="flex justify-between">
              <span>Pre-Pledged Donations</span>
              <span>{formatCurrency(stats.prePledgedDonations)}</span>
            </div>
            <div className="flex justify-between">
              <span>Raffle</span>
              <span>{formatCurrency(stats.raffleRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span>50/50</span>
              <span>{formatCurrency(stats.fiftyFiftyRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span>Auction</span>
              <span>{formatCurrency(stats.auctionRevenue)}</span>
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between text-sm font-bold">
          <span>Combined Total</span>
          <span className="text-primary">{formatCurrency(stats.totalRaised)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
