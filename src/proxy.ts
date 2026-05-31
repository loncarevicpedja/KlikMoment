import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const isLoggedIn = !!session?.user;

  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn || session.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  if (pathname.startsWith("/owner")) {
    if (!isLoggedIn || session.user.role !== "OWNER") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (!session.user.activated) {
      return NextResponse.redirect(new URL("/login?inactive=1", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/owner/:path*"],
};
