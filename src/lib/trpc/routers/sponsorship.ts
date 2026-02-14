import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../server";
import { parties, guests } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { SPONSORSHIP_TIERS } from "@/lib/constants";

export const sponsorshipRouter = router({
  // Get all sponsor parties with ticket pool info
  getSponsorParties: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const sponsorParties = await ctx.db
        .select({
          party: parties,
          assignedTickets: sql<number>`count(${guests.id}) filter (where ${guests.ticketType} = 'sponsored' and ${guests.sponsorPartyId} = ${parties.id})::int`,
        })
        .from(parties)
        .leftJoin(guests, eq(guests.sponsorPartyId, parties.id))
        .where(
          and(
            eq(parties.eventId, input.eventId),
            sql`${parties.sponsorshipTier} != 'none'`
          )
        )
        .groupBy(parties.id)
        .orderBy(parties.partyName);

      return sponsorParties.map((row) => ({
        ...row.party,
        assignedTickets: row.assignedTickets ?? 0,
        remainingTickets: row.party.sponsorshipTicketsTotal - (row.assignedTickets ?? 0),
      }));
    }),

  // Get overall ticket pool stats
  getTicketPoolStats: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Total sponsored tickets across all sponsors
      const totalResult = await ctx.db
        .select({
          totalTickets: sql<number>`coalesce(sum(${parties.sponsorshipTicketsTotal}), 0)::int`,
        })
        .from(parties)
        .where(
          and(
            eq(parties.eventId, input.eventId),
            sql`${parties.sponsorshipTier} != 'none'`
          )
        );

      // Assigned sponsored tickets
      const assignedResult = await ctx.db
        .select({
          assignedTickets: sql<number>`count(*)::int`,
        })
        .from(guests)
        .innerJoin(parties, eq(guests.partyId, parties.id))
        .where(
          and(
            eq(parties.eventId, input.eventId),
            eq(guests.ticketType, "sponsored")
          )
        );

      // Free tickets (assigned without a sponsor pool)
      const freeResult = await ctx.db
        .select({
          freeTickets: sql<number>`count(*)::int`,
        })
        .from(guests)
        .innerJoin(parties, eq(guests.partyId, parties.id))
        .where(
          and(
            eq(parties.eventId, input.eventId),
            eq(guests.ticketType, "free")
          )
        );

      const totalTickets = totalResult[0]?.totalTickets ?? 0;
      const assignedTickets = assignedResult[0]?.assignedTickets ?? 0;

      return {
        totalSponsoredTickets: totalTickets,
        assignedSponsoredTickets: assignedTickets,
        remainingSponsoredTickets: totalTickets - assignedTickets,
        freeTickets: freeResult[0]?.freeTickets ?? 0,
      };
    }),

  // Set a party's sponsorship tier (sets up ticket pool)
  setPartySponsorship: adminProcedure
    .input(
      z.object({
        partyId: z.string().uuid(),
        sponsorshipTier: z.enum([
          "builders",
          "framers",
          "foundation",
          "bar",
          "entertainment",
          "security",
          "none",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tier = SPONSORSHIP_TIERS.find(
        (t) => t.value === input.sponsorshipTier
      );
      const ticketCount = tier?.tickets ?? 0;

      const [updated] = await ctx.db
        .update(parties)
        .set({
          sponsorshipTier: input.sponsorshipTier,
          sponsorshipTicketsTotal: ticketCount,
          updatedAt: new Date(),
        })
        .where(eq(parties.id, input.partyId))
        .returning();

      return updated;
    }),

  // Assign a sponsored ticket to a guest (from a specific sponsor's pool)
  assignSponsoredTicket: protectedProcedure
    .input(
      z.object({
        guestId: z.string().uuid(),
        sponsorPartyId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check sponsor has remaining tickets
      const sponsor = await ctx.db.query.parties.findFirst({
        where: eq(parties.id, input.sponsorPartyId),
      });

      if (!sponsor) throw new Error("Sponsor party not found");

      const assignedCount = await ctx.db
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(guests)
        .where(
          and(
            eq(guests.sponsorPartyId, input.sponsorPartyId),
            eq(guests.ticketType, "sponsored")
          )
        );

      const assigned = assignedCount[0]?.count ?? 0;

      if (assigned >= sponsor.sponsorshipTicketsTotal) {
        throw new Error(
          `${sponsor.partyName} has no remaining sponsored tickets (${assigned}/${sponsor.sponsorshipTicketsTotal} used)`
        );
      }

      const [updated] = await ctx.db
        .update(guests)
        .set({
          ticketType: "sponsored",
          sponsorPartyId: input.sponsorPartyId,
          updatedAt: new Date(),
        })
        .where(eq(guests.id, input.guestId))
        .returning();

      return updated;
    }),

  // Assign a free ticket (no sponsor pool needed)
  assignFreeTicket: protectedProcedure
    .input(
      z.object({
        guestId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(guests)
        .set({
          ticketType: "free",
          sponsorPartyId: null,
          updatedAt: new Date(),
        })
        .where(eq(guests.id, input.guestId))
        .returning();

      return updated;
    }),

  // Return a sponsored ticket back to the pool
  returnTicketToPool: protectedProcedure
    .input(
      z.object({
        guestId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(guests)
        .set({
          ticketType: "paid",
          sponsorPartyId: null,
          updatedAt: new Date(),
        })
        .where(eq(guests.id, input.guestId))
        .returning();

      return updated;
    }),

  // Reassign a ticket from one sponsor to another
  reassignTicket: protectedProcedure
    .input(
      z.object({
        guestId: z.string().uuid(),
        newSponsorPartyId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check new sponsor has remaining tickets
      const sponsor = await ctx.db.query.parties.findFirst({
        where: eq(parties.id, input.newSponsorPartyId),
      });

      if (!sponsor) throw new Error("Sponsor party not found");

      const assignedCount = await ctx.db
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(guests)
        .where(
          and(
            eq(guests.sponsorPartyId, input.newSponsorPartyId),
            eq(guests.ticketType, "sponsored")
          )
        );

      const assigned = assignedCount[0]?.count ?? 0;

      if (assigned >= sponsor.sponsorshipTicketsTotal) {
        throw new Error(
          `${sponsor.partyName} has no remaining sponsored tickets`
        );
      }

      const [updated] = await ctx.db
        .update(guests)
        .set({
          ticketType: "sponsored",
          sponsorPartyId: input.newSponsorPartyId,
          updatedAt: new Date(),
        })
        .where(eq(guests.id, input.guestId))
        .returning();

      return updated;
    }),
});
