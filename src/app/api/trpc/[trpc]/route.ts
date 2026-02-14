import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/lib/trpc/routers/_app";
import { createContext } from "@/lib/trpc/server";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/utils/rate-limit";

const handler = async (req: NextRequest) => {
  // Rate limiting
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
  const { allowed, remaining, resetTime } = checkRateLimit(`trpc:${ip}`, {
    maxRequests: 100,
    windowMs: 60000,
  });

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(resetTime).toISOString(),
          "Retry-After": String(Math.ceil((resetTime - Date.now()) / 1000)),
        },
      }
    );
  }

  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
  });

  // Add rate limit headers
  response.headers.set("X-RateLimit-Remaining", String(remaining));

  return response;
};

export { handler as GET, handler as POST };
