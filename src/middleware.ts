import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = ["/login", "/signup", "/auth/callback", "/suspended", "/pending-payment"];
const WEBHOOK_PATHS = ["/api/webhooks/"];
const ADMIN_PATHS = ["/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Webhooks bypass auth entirely — verified by signature in each handler
  if (WEBHOOK_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const { user, supabaseResponse } = await updateSession(request);

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Not logged in and trying to access protected route -> redirect to login
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Logged in and trying to access auth pages -> redirect to panel
  if (user && isPublicPath && pathname !== "/suspended") {
    const url = request.nextUrl.clone();
    url.pathname = "/panel";
    return NextResponse.redirect(url);
  }

  if (user) {
    const role = user.app_metadata?.role ?? "user";
    const accountStatus = user.app_metadata?.account_status ?? "active";

    // Account pending payment -> redirect to pending-payment page (superadmin exempt)
    if (
      role !== "superadmin" &&
      accountStatus === "pending" &&
      pathname !== "/pending-payment"
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/pending-payment";
      return NextResponse.redirect(url);
    }

    // Account suspended/cancelled -> redirect to suspended page (superadmin exempt)
    if (
      role !== "superadmin" &&
      (accountStatus === "paused" || accountStatus === "cancelled") &&
      pathname !== "/suspended"
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/suspended";
      return NextResponse.redirect(url);
    }

    // Admin routes -> only superadmin
    if (
      ADMIN_PATHS.some((p) => pathname.startsWith(p)) &&
      role !== "superadmin"
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/panel";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - api/health (health check)
     * - api/webhooks (payment webhooks — bypassed above for clarity)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/health|api/clarity/cron|.*\\.png$|.*\\.jpeg$|.*\\.jpg$|.*\\.svg$|.*\\.webp$).*)",
  ],
};
