import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ req, token }) => {
      // Settings page requires admin role
      if (
        req.nextUrl.pathname.startsWith("/settings") &&
        token?.role !== "admin"
      ) {
        return false;
      }
      // All dashboard routes require authentication
      return !!token;
    },
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/guests/:path*",
    "/impact-board/:path*",
    "/auction/:path*",
    "/reports/:path*",
    "/settings/:path*",
  ],
};
