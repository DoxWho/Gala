import { initTRPC, TRPCError } from "@trpc/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";
import superjson from "superjson";

export interface Context {
  session: Awaited<ReturnType<typeof getServerSession>> | null;
  db: typeof db;
}

export async function createContext(): Promise<Context> {
  const session = await getServerSession(authOptions);
  return { session, db };
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware: require authentication
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.session.user,
    },
  });
});

// Middleware: require admin role
const isAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in",
    });
  }
  if (ctx.session.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.session.user,
    },
  });
});

// Middleware: audit logging
const withAudit = t.middleware(async ({ ctx, next, path, type }) => {
  const result = await next();
  // Log mutations to audit log
  if (type === "mutation" && ctx.session?.user) {
    try {
      await db.insert(auditLog).values({
        userId: ctx.session.user.id,
        action: path,
        entityType: path.split(".")[0],
        newValues: JSON.stringify({ path, type }),
      });
    } catch {
      // Don't fail the mutation if audit logging fails
      console.error("Audit logging failed for:", path);
    }
  }
  return result;
});

export const protectedProcedure = t.procedure.use(isAuthed).use(withAudit);
export const adminProcedure = t.procedure.use(isAdmin).use(withAudit);
