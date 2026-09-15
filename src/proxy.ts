import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export const config = {
  matcher: [
    "/((?!api/n8n|api/auth|_next/static|_next/image|favicon.ico|login).*)",
  ],
};

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const ok = await verifySessionToken(token);

  if (!ok) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    if (req.nextUrl.pathname !== "/") {
      url.searchParams.set("next", req.nextUrl.pathname);
    }
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
