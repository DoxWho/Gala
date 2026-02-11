import { z } from "zod";
import { router, protectedProcedure } from "../server";
import { pledges } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const pledgesRouter = router({
  getByGuest: protectedProcedure
    .input(z.object({ guestId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query.pledges.findMany({
        where: eq(pledges.guestId, input.guestId),
        with: {
          impactBoardItem: true,
        },
        orderBy: pledges.createdAt,
      });

      return result;
    }),

  create: protectedProcedure
    .input(
      z.object({
        guestId: z.string().uuid(),
        impactBoardItemId: z.string().uuid(),
        amount: z.number().positive(),
        donationType: z.enum(["pre_pledged", "gala_night"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [pledge] = await ctx.db
        .insert(pledges)
        .values({
          guestId: input.guestId,
          impactBoardItemId: input.impactBoardItemId,
          amount: input.amount.toFixed(2),
          donationType: input.donationType,
          pledgedBy: ctx.user.id,
          notes: input.notes || null,
        })
        .returning();

      return pledge;
    }),

  createBulk: protectedProcedure
    .input(
      z.object({
        guestId: z.string().uuid(),
        pledges: z.array(
          z.object({
            impactBoardItemId: z.string().uuid(),
            amount: z.number().positive(),
            donationType: z.enum(["pre_pledged", "gala_night"]),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const values = input.pledges.map((p) => ({
        guestId: input.guestId,
        impactBoardItemId: p.impactBoardItemId,
        amount: p.amount.toFixed(2),
        donationType: p.donationType as "pre_pledged" | "gala_night",
        pledgedBy: ctx.user.id,
      }));

      const result = await ctx.db.insert(pledges).values(values).returning();

      return result;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        amount: z.number().positive().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (input.amount !== undefined) updates.amount = input.amount.toFixed(2);
      if (input.notes !== undefined) updates.notes = input.notes;

      const [updated] = await ctx.db
        .update(pledges)
        .set(updates)
        .where(eq(pledges.id, input.id))
        .returning();

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(pledges).where(eq(pledges.id, input.id));
      return { success: true };
    }),
});
