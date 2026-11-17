import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { backToSettings, startUrl } from "@/lib/oauth";

// Settings → "Connect LinkedIn": send the user to LinkedIn's login.
export async function GET(req: NextRequest) {
  const url = await startUrl(req, "linkedin");
  if (!url) return backToSettings(req, { connect_error: "linkedin_not_configured" });
  return NextResponse.redirect(url);
}
