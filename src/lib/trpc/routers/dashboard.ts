import { z } from "zod";
import { router, protectedProcedure } from "../server";
import {
  events,
  guests,
  parties,
  pledges,
  impactBoardItems,
  auctionItems,
  raffleSales,
  fiftyFiftySales,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import type { DashboardStats } from "@/types";

export const dashboardRouter = router({
  getStats: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }): Promise<DashboardStats> => {
      // Get event data
      const event = await ctx.db.query.events.findFirst({
        where: eq(events.id, input.eventId),
      });

      if (!event) {
        throw new Error("Event not found");
      }

      // Get attendance stats
      const attendanceResult = await ctx.db
        .select({
          total: sql<number>`count(*)::int`,
          checkedIn: sql<number>`count(*) filter (where ${guests.isCheckedIn} = true)::int`,
        })
        .from(guests)
        .innerJoin(parties, eq(guests.partyId, parties.id))
        .where(eq(parties.eventId, input.eventId));

      // Get pledge totals by donation type
      const pledgeTotals = await ctx.db
        .select({
          donationType: pledges.donationType,
          total: sql<string>`coalesce(sum(${pledges.amount}), 0)`,
        })
        .from(pledges)
        .innerJoin(guests, eq(pledges.guestId, guests.id))
        .innerJoin(parties, eq(guests.partyId, parties.id))
        .where(eq(parties.eventId, input.eventId))
        .groupBy(pledges.donationType);

      // Get auction revenue
      const auctionResult = await ctx.db
        .select({
          total: sql<string>`coalesce(sum(${auctionItems.finalBidAmount}), 0)`,
        })
        .from(auctionItems)
        .where(eq(auctionItems.eventId, input.eventId));

      // Get raffle revenue
      const raffleResult = await ctx.db
        .select({
          total: sql<string>`coalesce(sum(${raffleSales.totalAmount}), 0)`,
        })
        .from(raffleSales)
        .innerJoin(guests, eq(raffleSales.guestId, guests.id))
        .innerJoin(parties, eq(guests.partyId, parties.id))
        .where(eq(parties.eventId, input.eventId));

      // Get 50/50 revenue
      const fiftyFiftyResult = await ctx.db
        .select({
          total: sql<string>`coalesce(sum(${fiftyFiftySales.totalAmount}), 0)`,
        })
        .from(fiftyFiftySales)
        .innerJoin(guests, eq(fiftyFiftySales.guestId, guests.id))
        .innerJoin(parties, eq(guests.partyId, parties.id))
        .where(eq(parties.eventId, input.eventId));

      const galaNightDonations =
        parseFloat(
          pledgeTotals.find((p) => p.donationType === "gala_night")?.total as string || "0"
        ) || 0;

      const prePledgedDonations =
        parseFloat(
          pledgeTotals.find((p) => p.donationType === "pre_pledged")?.total as string || "0"
        ) || 0;

      const raffleRevenue =
        parseFloat(raffleResult[0]?.total as string) || 0;
      const fiftyFiftyRevenue =
        parseFloat(fiftyFiftyResult[0]?.total as string) || 0;
      const auctionRevenue =
        parseFloat(auctionResult[0]?.total as string) || 0;

      const initialTicketSales = parseFloat(event.initialTicketSales || "0");
      const initialSponsorships = parseFloat(event.initialSponsorships || "0");
      const initialPrePledges = parseFloat(event.initialPrePledges || "0");

      const totalRaised =
        initialTicketSales +
        initialSponsorships +
        initialPrePledges +
        galaNightDonations +
        prePledgedDonations +
        auctionRevenue +
        raffleRevenue +
        fiftyFiftyRevenue;

      return {
        totalGuests: attendanceResult[0]?.total ?? 0,
        checkedInGuests: attendanceResult[0]?.checkedIn ?? 0,
        goalAmount: parseFloat(event.goalAmount || "0"),
        initialTicketSales,
        initialSponsorships,
        initialPrePledges,
        galaNightDonations,
        prePledgedDonations,
        raffleRevenue,
        fiftyFiftyRevenue,
        auctionRevenue,
        totalRaised,
      };
    }),

  getActiveEvent: protectedProcedure.query(async ({ ctx }) => {
    const event = await ctx.db.query.events.findFirst({
      where: eq(events.isActive, true),
    });
    return event || null;
  }),

  updateEvent: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        goalAmount: z.number().min(0).optional(),
        initialTicketSales: z.number().min(0).optional(),
        initialSponsorships: z.number().min(0).optional(),
        initialPrePledges: z.number().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const updates: Record<string, unknown> = { updatedAt: new Date() };

      if (data.name !== undefined) updates.name = data.name;
      if (data.goalAmount !== undefined)
        updates.goalAmount = data.goalAmount.toFixed(2);
      if (data.initialTicketSales !== undefined)
        updates.initialTicketSales = data.initialTicketSales.toFixed(2);
      if (data.initialSponsorships !== undefined)
        updates.initialSponsorships = data.initialSponsorships.toFixed(2);
      if (data.initialPrePledges !== undefined)
        updates.initialPrePledges = data.initialPrePledges.toFixed(2);

      const [updated] = await ctx.db
        .update(events)
        .set(updates)
        .where(eq(events.id, id))
        .returning();

      return updated;
    }),
});
