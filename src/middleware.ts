import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = ["/login", "/signup", "/auth/callback"];

export async function middleware(request: NextRequest) {
  const { user, supabaseResponse } = await updateSession(request);

  const isPublicPath = PUBLIC_PATHS.some((p) =>
    request.nextUrl.pathname.startsWith(p)
  );

  // Not logged in and trying to access protected route -> redirect to login
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Logged in and trying to access auth pages -> redirect to panel
  if (user && isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/panel";
    return NextResponse.redirect(url);
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
     */
    "/((?!_next/static|_next/image|favicon.ico|api/health|api/clarity/cron|.*\\.png$|.*\\.jpeg$|.*\\.jpg$|.*\\.svg$|.*\\.webp$).*)",
  ],
};
