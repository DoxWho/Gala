import { z } from "zod";
import { router, protectedProcedure } from "../server";
import { impactBoardItems, pledges } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

export const impactBoardRouter = router({
  getAll: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        category: z
          .enum(["shabbat", "holidays", "education", "operating", "wishlist"])
          .optional(),
        hasNoPledges: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(impactBoardItems.eventId, input.eventId)];

      if (input.category) {
        conditions.push(eq(impactBoardItems.category, input.category));
      }

      const items = await ctx.db
        .select({
          item: impactBoardItems,
          totalPledged: sql<string>`coalesce(sum(${pledges.amount}), 0)`,
          pledgeCount: sql<number>`count(${pledges.id})::int`,
        })
        .from(impactBoardItems)
        .leftJoin(pledges, eq(impactBoardItems.id, pledges.impactBoardItemId))
        .where(and(...conditions))
        .groupBy(impactBoardItems.id)
        .orderBy(impactBoardItems.category, impactBoardItems.sortOrder);

      const result = items.map((row) => ({
        ...row.item,
        totalPledged: parseFloat(row.totalPledged as string) || 0,
        pledgeCount: row.pledgeCount,
      }));

      if (input.hasNoPledges) {
        return result.filter((item) => item.pledgeCount === 0);
      }

      return result;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const item = await ctx.db.query.impactBoardItems.findFirst({
        where: eq(impactBoardItems.id, input.id),
        with: {
          pledges: {
            with: {
              guest: true,
            },
          },
        },
      });

      if (!item) {
        throw new Error("Impact board item not found");
      }

      const totalPledged = item.pledges.reduce(
        (sum, p) => sum + parseFloat(p.amount),
        0
      );

      return {
        ...item,
        totalPledged,
        pledgeCount: item.pledges.length,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        category: z.enum([
          "shabbat",
          "holidays",
          "education",
          "operating",
          "wishlist",
        ]),
        title: z.string().min(1),
        defaultAmount: z.number().positive(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [item] = await ctx.db
        .insert(impactBoardItems)
        .values({
          eventId: input.eventId,
          category: input.category,
          title: input.title,
          defaultAmount: input.defaultAmount.toFixed(2),
          description: input.description || null,
          isCustom: true,
          sortOrder: 999,
        })
        .returning();

      return item;
    }),

  getTotals: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({
          category: impactBoardItems.category,
          totalPledged: sql<string>`coalesce(sum(${pledges.amount}), 0)`,
          itemCount: sql<number>`count(distinct ${impactBoardItems.id})::int`,
          pledgeCount: sql<number>`count(${pledges.id})::int`,
        })
        .from(impactBoardItems)
        .leftJoin(pledges, eq(impactBoardItems.id, pledges.impactBoardItemId))
        .where(eq(impactBoardItems.eventId, input.eventId))
        .groupBy(impactBoardItems.category);

      return result.map((row) => ({
        category: row.category,
        totalPledged: parseFloat(row.totalPledged as string) || 0,
        itemCount: row.itemCount,
        pledgeCount: row.pledgeCount,
      }));
    }),
});
