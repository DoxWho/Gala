import { z } from "zod";
import { router, adminProcedure } from "../server";
import { users, auditLog } from "@/lib/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const adminRouter = router({
  getUsers: adminProcedure.query(async ({ ctx }) => {
    const allUsers = await ctx.db.query.users.findMany({
      orderBy: [users.createdAt],
      columns: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return allUsers;
  }),

  createUser: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(2),
        role: z.enum(["admin", "volunteer"]),
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
          role: input.role,
        })
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
        });

      return user;
    }),

  updateUserRole: adminProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        role: z.enum(["admin", "volunteer"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(users)
        .set({ role: input.role, updatedAt: new Date() })
        .where(eq(users.id, input.userId))
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
        });

      return updated;
    }),

  deactivateUser: adminProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Prevent self-deactivation
      if (input.userId === ctx.user.id) {
        throw new Error("Cannot deactivate your own account");
      }

      const [updated] = await ctx.db
        .update(users)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(users.id, input.userId))
        .returning({
          id: users.id,
          email: users.email,
          isActive: users.isActive,
        });

      return updated;
    }),

  activateUser: adminProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(users)
        .set({ isActive: true, updatedAt: new Date() })
        .where(eq(users.id, input.userId))
        .returning({
          id: users.id,
          email: users.email,
          isActive: users.isActive,
        });

      return updated;
    }),

  getAuditLog: adminProcedure
    .input(
      z.object({
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        userId: z.string().uuid().optional(),
        entityType: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];

      if (input.startDate) {
        conditions.push(gte(auditLog.createdAt, new Date(input.startDate)));
      }
      if (input.endDate) {
        conditions.push(lte(auditLog.createdAt, new Date(input.endDate)));
      }
      if (input.userId) {
        conditions.push(eq(auditLog.userId, input.userId));
      }
      if (input.entityType) {
        conditions.push(eq(auditLog.entityType, input.entityType));
      }

      const logs = await ctx.db.query.auditLog.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: [desc(auditLog.createdAt)],
        limit: input.limit,
        offset: input.offset,
      });

      return logs;
    }),

  resetUserPassword: adminProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        newPassword: z.string().min(8),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const passwordHash = await bcrypt.hash(input.newPassword, 12);
      await ctx.db
        .update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, input.userId));

      return { success: true };
    }),
});
