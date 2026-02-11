import { z } from "zod";
import { router, protectedProcedure } from "../server";
import { parties, guests } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export const partiesRouter = router({
  getAll: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({
          party: parties,
          guestCount: sql<number>`count(${guests.id})::int`,
          checkedInCount: sql<number>`count(*) filter (where ${guests.isCheckedIn} = true)::int`,
        })
        .from(parties)
        .leftJoin(guests, eq(parties.id, guests.partyId))
        .where(eq(parties.eventId, input.eventId))
        .groupBy(parties.id)
        .orderBy(parties.partyName);

      return result.map((row) => ({
        ...row.party,
        guestCount: row.guestCount,
        checkedInCount: row.checkedInCount,
      }));
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const party = await ctx.db.query.parties.findFirst({
        where: eq(parties.id, input.id),
        with: {
          guests: true,
        },
      });

      if (!party) {
        throw new Error("Party not found");
      }

      return party;
    }),

  create: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        partyName: z.string().min(1),
        primaryContactName: z.string().optional(),
        primaryContactEmail: z.string().email().optional().or(z.literal("")),
        primaryContactPhone: z.string().optional().or(z.literal("")),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [party] = await ctx.db
        .insert(parties)
        .values({
          eventId: input.eventId,
          partyName: input.partyName,
          primaryContactName: input.primaryContactName || null,
          primaryContactEmail: input.primaryContactEmail || null,
          primaryContactPhone: input.primaryContactPhone || null,
        })
        .returning();

      return party;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        partyName: z.string().min(1).optional(),
        primaryContactName: z.string().optional(),
        primaryContactEmail: z.string().email().optional().or(z.literal("")),
        primaryContactPhone: z.string().optional().or(z.literal("")),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const [updated] = await ctx.db
        .update(parties)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(parties.id, id))
        .returning();

      return updated;
    }),
});
