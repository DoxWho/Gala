import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../server";
import bcrypt from "bcryptjs";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const authRouter = router({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(2),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.users.findFirst({
        where: eq(users.email, input.email),
      });

      if (existing) {
        throw new Error("Email already in use");
      }

      const passwordHash = await bcrypt.hash(input.password, 12);

      const [user] = await ctx.db
        .insert(users)
        .values({
          email: input.email,
          passwordHash,
          name: input.name,
          role: "volunteer",
        })
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
        });

      return user;
    }),

  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updates: Record<string, unknown> = {};
      if (input.name) updates.name = input.name;
      if (input.email) updates.email = input.email;
      updates.updatedAt = new Date();

      const [updated] = await ctx.db
        .update(users)
        .set(updates)
        .where(eq(users.id, ctx.user.id))
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
        });

      return updated;
    }),

  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.user.id),
      });

      if (!user) {
        throw new Error("User not found");
      }

      const isValid = await bcrypt.compare(
        input.currentPassword,
        user.passwordHash
      );
      if (!isValid) {
        throw new Error("Current password is incorrect");
      }

      const passwordHash = await bcrypt.hash(input.newPassword, 12);
      await ctx.db
        .update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, ctx.user.id));

      return { success: true };
    }),
});
