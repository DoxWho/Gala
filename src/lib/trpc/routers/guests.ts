import { z } from "zod";
import { router, protectedProcedure } from "../server";
import { guests, parties } from "@/lib/db/schema";
import { eq, and, or, ilike, sql } from "drizzle-orm";

export const guestsRouter = router({
  getAll: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        search: z.string().optional(),
        isCheckedIn: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(parties.eventId, input.eventId)];

      if (input.isCheckedIn !== undefined) {
        conditions.push(eq(guests.isCheckedIn, input.isCheckedIn));
      }

      let query = ctx.db
        .select()
        .from(guests)
        .innerJoin(parties, eq(guests.partyId, parties.id))
        .where(and(...conditions))
        .orderBy(guests.lastName, guests.firstName);

      if (input.search) {
        const searchTerm = `%${input.search}%`;
        conditions.push(
          or(
            ilike(guests.firstName, searchTerm),
            ilike(guests.lastName, searchTerm),
            ilike(parties.partyName, searchTerm),
            ilike(guests.email, searchTerm)
          )!
        );
        query = ctx.db
          .select()
          .from(guests)
          .innerJoin(parties, eq(guests.partyId, parties.id))
          .where(and(...conditions))
          .orderBy(guests.lastName, guests.firstName);
      }

      const results = await query;

      return results.map((row) => ({
        ...row.guests,
        party: row.parties,
      }));
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const guest = await ctx.db.query.guests.findFirst({
        where: eq(guests.id, input.id),
        with: {
          party: true,
          pledges: {
            with: {
              impactBoardItem: true,
            },
          },
          raffleSales: true,
          fiftyFiftySales: true,
        },
      });

      if (!guest) {
        throw new Error("Guest not found");
      }

      return guest;
    }),

  checkIn: protectedProcedure
    .input(
      z.object({
        guestId: z.string().uuid(),
        isCheckedIn: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(guests)
        .set({
          isCheckedIn: input.isCheckedIn,
          checkedInAt: input.isCheckedIn ? new Date() : null,
          checkedInBy: input.isCheckedIn ? ctx.user.id : null,
          updatedAt: new Date(),
        })
        .where(eq(guests.id, input.guestId))
        .returning();

      return updated;
    }),

  create: protectedProcedure
    .input(
      z.object({
        partyId: z.string().uuid(),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional().or(z.literal("")),
        isWalkIn: z.boolean().default(false),
        isPlusOne: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [guest] = await ctx.db
        .insert(guests)
        .values({
          partyId: input.partyId,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email || null,
          phone: input.phone || null,
          isWalkIn: input.isWalkIn,
          isPlusOne: input.isPlusOne,
        })
        .returning();

      return guest;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional().or(z.literal("")),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const [updated] = await ctx.db
        .update(guests)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(guests.id, id))
        .returning();

      return updated;
    }),

  updateRaffleQuantity: protectedProcedure
    .input(
      z.object({
        guestId: z.string().uuid(),
        quantity: z.number().int().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(guests)
        .set({
          raffleQuantity: input.quantity,
          updatedAt: new Date(),
        })
        .where(eq(guests.id, input.guestId))
        .returning();

      return updated;
    }),

  updateFiftyFiftyQuantity: protectedProcedure
    .input(
      z.object({
        guestId: z.string().uuid(),
        quantity: z.number().int().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(guests)
        .set({
          fiftyFiftyQuantity: input.quantity,
          updatedAt: new Date(),
        })
        .where(eq(guests.id, input.guestId))
        .returning();

      return updated;
    }),

  getAttendanceStats: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({
          total: sql<number>`count(*)::int`,
          checkedIn: sql<number>`count(*) filter (where ${guests.isCheckedIn} = true)::int`,
        })
        .from(guests)
        .innerJoin(parties, eq(guests.partyId, parties.id))
        .where(eq(parties.eventId, input.eventId));

      return {
        total: result[0]?.total ?? 0,
        checkedIn: result[0]?.checkedIn ?? 0,
      };
    }),
});
