"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/formatting";
import {
  Ticket,
  HandCoins,
  Heart,
  Gavel,
  DollarSign,
  Banknote,
} from "lucide-react";

interface LiveStatsProps {
  initialTicketSales: number;
  initialSponsorships: number;
  initialPrePledges: number;
  galaNightDonations: number;
  prePledgedDonations: number;
  raffleRevenue: number;
  fiftyFiftyRevenue: number;
  auctionRevenue: number;
}

export function LiveStats({
  initialTicketSales,
  initialSponsorships,
  initialPrePledges,
  galaNightDonations,
  prePledgedDonations,
  raffleRevenue,
  fiftyFiftyRevenue,
  auctionRevenue,
}: LiveStatsProps) {
  const stats = [
    {
      label: "Ticket Sales",
      value: initialTicketSales,
      icon: Ticket,
      color: "text-blue-500",
    },
    {
      label: "Sponsorships",
      value: initialSponsorships,
      icon: HandCoins,
      color: "text-purple-500",
    },
    {
      label: "Pre-Pledges",
      value: initialPrePledges,
      icon: Heart,
      color: "text-pink-500",
    },
    {
      label: "Gala Night Donations",
      value: galaNightDonations,
      icon: DollarSign,
      color: "text-green-500",
    },
    {
      label: "Pre-Pledged Donations",
      value: prePledgedDonations,
      icon: Banknote,
      color: "text-emerald-500",
    },
    {
      label: "Raffle Revenue",
      value: raffleRevenue,
      icon: Ticket,
      color: "text-orange-500",
    },
    {
      label: "50/50 Revenue",
      value: fiftyFiftyRevenue,
      icon: Ticket,
      color: "text-amber-500",
    },
    {
      label: "Auction Revenue",
      value: auctionRevenue,
      icon: Gavel,
      color: "text-indigo-500",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {stat.label}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold sm:text-xl">
              {formatCurrency(stat.value)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
