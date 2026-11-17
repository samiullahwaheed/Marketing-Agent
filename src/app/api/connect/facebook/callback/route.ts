import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { backToSettings, facebookPages, facebookUserToken, holdFacebookToken, readCallback, saveFacebookPage } from "@/lib/oauth";
import { requireUserId } from "@/lib/users";

// Facebook sends the user back here after "Allow".
export async function GET(req: NextRequest) {
  const userId = await requireUserId();
  const cb = await readCallback(req, "facebook");
  if ("error" in cb) return backToSettings(req, { connect_error: `facebook_${cb.error}` });

  try {
    const userToken = await facebookUserToken(req, cb.code);
    const pages = await facebookPages(userToken);
    if (pages.length === 0) return backToSettings(req, { connect_error: "facebook_no_pages" });

    if (pages.length > 1) {
      // Let them choose which Page this workspace posts to.
      await holdFacebookToken(userToken);
      return NextResponse.redirect(new URL("/settings/connect/facebook", req.nextUrl.origin));
    }

    const { instagram } = await saveFacebookPage(userId, pages[0]);
    return backToSettings(req, { connected: instagram ? "facebook_instagram" : "facebook" });
  } catch (err) {
    console.error("Facebook connect failed:", err instanceof Error ? err.message : err);
    return backToSettings(req, { connect_error: "facebook_failed" });
  }
}
