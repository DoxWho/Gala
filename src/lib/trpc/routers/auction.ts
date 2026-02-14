import { z } from "zod";
import { router, protectedProcedure } from "../server";
import { auctionItems } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export const auctionRouter = router({
  getAll: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.query.auctionItems.findMany({
        where: eq(auctionItems.eventId, input.eventId),
        with: {
          winningParty: true,
        },
        orderBy: auctionItems.createdAt,
      });

      return items;
    }),

  create: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        title: z.string().min(1),
        description: z.string().optional(),
        estimatedValue: z.number().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [item] = await ctx.db
        .insert(auctionItems)
        .values({
          eventId: input.eventId,
          title: input.title,
          description: input.description || null,
          estimatedValue: input.estimatedValue?.toFixed(2) || null,
        })
        .returning();

      return item;
    }),

  assignWinner: protectedProcedure
    .input(
      z.object({
        auctionItemId: z.string().uuid(),
        winningPartyId: z.string().uuid(),
        finalBidAmount: z.number().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(auctionItems)
        .set({
          winningPartyId: input.winningPartyId,
          finalBidAmount: input.finalBidAmount.toFixed(2),
          soldAt: new Date(),
          soldBy: ctx.user.id,
          updatedAt: new Date(),
        })
        .where(eq(auctionItems.id, input.auctionItemId))
        .returning();

      return updated;
    }),

  clearWinner: protectedProcedure
    .input(z.object({ auctionItemId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(auctionItems)
        .set({
          winningPartyId: null,
          finalBidAmount: null,
          soldAt: null,
          soldBy: null,
          updatedAt: new Date(),
        })
        .where(eq(auctionItems.id, input.auctionItemId))
        .returning();

      return updated;
    }),

  getTotalRevenue: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({
          total: sql<string>`coalesce(sum(${auctionItems.finalBidAmount}), 0)`,
          soldCount: sql<number>`count(*) filter (where ${auctionItems.finalBidAmount} is not null)::int`,
          totalItems: sql<number>`count(*)::int`,
        })
        .from(auctionItems)
        .where(eq(auctionItems.eventId, input.eventId));

      return {
        total: parseFloat(result[0]?.total as string) || 0,
        soldCount: result[0]?.soldCount ?? 0,
        totalItems: result[0]?.totalItems ?? 0,
      };
    }),
});
