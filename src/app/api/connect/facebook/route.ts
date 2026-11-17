import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { backToSettings, startUrl } from "@/lib/oauth";

// Settings → "Connect Facebook": send the user to Facebook's login.
export async function GET(req: NextRequest) {
  const url = await startUrl(req, "facebook");
  if (!url) return backToSettings(req, { connect_error: "facebook_not_configured" });
  return NextResponse.redirect(url);
}
