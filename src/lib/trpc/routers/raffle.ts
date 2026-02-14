import { z } from "zod";
import { router, protectedProcedure } from "../server";
import { raffleSales, fiftyFiftySales, guests, parties } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export const raffleRouter = router({
  recordRaffleSale: protectedProcedure
    .input(
      z.object({
        guestId: z.string().uuid(),
        quantity: z.number().int().positive(),
        pricePerTicket: z.number().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const totalAmount = input.quantity * input.pricePerTicket;

      // Record sale
      const [sale] = await ctx.db
        .insert(raffleSales)
        .values({
          guestId: input.guestId,
          quantity: input.quantity,
          pricePerTicket: input.pricePerTicket.toFixed(2),
          totalAmount: totalAmount.toFixed(2),
          soldBy: ctx.user.id,
        })
        .returning();

      // Update guest raffle quantity
      await ctx.db
        .update(guests)
        .set({
          raffleQuantity: sql`${guests.raffleQuantity} + ${input.quantity}`,
          updatedAt: new Date(),
        })
        .where(eq(guests.id, input.guestId));

      return sale;
    }),

  recordFiftyFiftySale: protectedProcedure
    .input(
      z.object({
        guestId: z.string().uuid(),
        quantity: z.number().int().positive(),
        pricePerTicket: z.number().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const totalAmount = input.quantity * input.pricePerTicket;

      // Record sale
      const [sale] = await ctx.db
        .insert(fiftyFiftySales)
        .values({
          guestId: input.guestId,
          quantity: input.quantity,
          pricePerTicket: input.pricePerTicket.toFixed(2),
          totalAmount: totalAmount.toFixed(2),
          soldBy: ctx.user.id,
        })
        .returning();

      // Update guest 50/50 quantity
      await ctx.db
        .update(guests)
        .set({
          fiftyFiftyQuantity: sql`${guests.fiftyFiftyQuantity} + ${input.quantity}`,
          updatedAt: new Date(),
        })
        .where(eq(guests.id, input.guestId));

      return sale;
    }),

  getRaffleTotals: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({
          totalRevenue: sql<string>`coalesce(sum(${raffleSales.totalAmount}), 0)`,
          totalTickets: sql<number>`coalesce(sum(${raffleSales.quantity}), 0)::int`,
        })
        .from(raffleSales)
        .innerJoin(guests, eq(raffleSales.guestId, guests.id))
        .innerJoin(parties, eq(guests.partyId, parties.id))
        .where(eq(parties.eventId, input.eventId));

      return {
        totalRevenue: parseFloat(result[0]?.totalRevenue as string) || 0,
        totalTickets: result[0]?.totalTickets ?? 0,
      };
    }),

  getFiftyFiftyTotals: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({
          totalRevenue: sql<string>`coalesce(sum(${fiftyFiftySales.totalAmount}), 0)`,
          totalTickets: sql<number>`coalesce(sum(${fiftyFiftySales.quantity}), 0)::int`,
        })
        .from(fiftyFiftySales)
        .innerJoin(guests, eq(fiftyFiftySales.guestId, guests.id))
        .innerJoin(parties, eq(guests.partyId, parties.id))
        .where(eq(parties.eventId, input.eventId));

      return {
        totalRevenue: parseFloat(result[0]?.totalRevenue as string) || 0,
        totalTickets: result[0]?.totalTickets ?? 0,
      };
    }),
});
