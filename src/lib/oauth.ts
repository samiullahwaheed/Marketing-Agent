import "server-only";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { deleteConnection, saveConnection } from "./connections";
import { decryptSecret, encryptSecret } from "./crypto";

// "Connect account" flows. The browser goes to the platform's login, the user allows our
// app, and the platform sends them back to our callback with a one-time code that we
// swap (server-side, with our app secret) for the user's token.

export type Provider = "facebook" | "linkedin";

const GRAPH = "https://graph.facebook.com/v23.0";
const STATE_TTL = 60 * 10; // seconds

export const FACEBOOK_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "instagram_basic",
  "instagram_content_publish",
  "business_management",
];
const LINKEDIN_SCOPES = ["openid", "profile", "w_member_social"];

/** Must match a redirect URL registered in the Meta / LinkedIn app exactly. */
export function redirectUri(req: NextRequest, provider: Provider): string {
  return `${req.nextUrl.origin}/api/connect/${provider}/callback`;
}

/** Back to Settings with a message the page shows (see CONNECT_MESSAGES in SettingsView). */
export function backToSettings(req: NextRequest, params: Record<string, string>): NextResponse {
  const url = new URL("/settings", req.nextUrl.origin);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return NextResponse.redirect(url);
}

const stateCookie = (provider: Provider) => `oauth_state_${provider}`;
const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: STATE_TTL,
};

/** Random value tied to this browser, so a callback can't be forged from another site (CSRF). */
async function newState(provider: Provider): Promise<string> {
  const state = randomBytes(24).toString("base64url");
  (await cookies()).set(stateCookie(provider), state, cookieOpts);
  return state;
}

async function stateMatches(provider: Provider, state: string | null): Promise<boolean> {
  const store = await cookies();
  const expected = store.get(stateCookie(provider))?.value;
  store.delete(stateCookie(provider));
  if (!expected || !state) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(state);
  return a.length === b.length && timingSafeEqual(a, b);
}

function env(name: string): string | null {
  return process.env[name] || null;
}

// ---------- start ----------

export async function startUrl(req: NextRequest, provider: Provider): Promise<string | null> {
  if (provider === "facebook") {
    const appId = env("META_APP_ID");
    if (!appId || !env("META_APP_SECRET")) return null;
    const url = new URL("https://www.facebook.com/v23.0/dialog/oauth");
    url.searchParams.set("client_id", appId);
    url.searchParams.set("redirect_uri", redirectUri(req, "facebook"));
    url.searchParams.set("state", await newState("facebook"));
    url.searchParams.set("scope", FACEBOOK_SCOPES.join(","));
    url.searchParams.set("response_type", "code");
    return url.toString();
  }
  const clientId = env("LINKEDIN_CLIENT_ID");
  if (!clientId || !env("LINKEDIN_CLIENT_SECRET")) return null;
  const url = new URL("https://www.linkedin.com/oauth/v2/authorization");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri(req, "linkedin"));
  url.searchParams.set("state", await newState("linkedin"));
  url.searchParams.set("scope", LINKEDIN_SCOPES.join(" "));
  return url.toString();
}

/** Validates what the platform sent back. Returns the code, or an error key for Settings. */
export async function readCallback(req: NextRequest, provider: Provider): Promise<{ code: string } | { error: string }> {
  const q = req.nextUrl.searchParams;
  const stateOk = await stateMatches(provider, q.get("state"));
  if (q.get("error")) return { error: "denied" };
  if (!stateOk) return { error: "expired" };
  const code = q.get("code");
  return code ? { code } : { error: "failed" };
}

// ---------- Facebook + Instagram ----------

interface GraphError {
  error?: { message?: string };
}

async function graph<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${GRAPH}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { cache: "no-store" });
  const body = (await res.json()) as T & GraphError;
  if (!res.ok || body.error) throw new Error(body.error?.message || `Facebook returned ${res.status}`);
  return body;
}

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: { id: string; username?: string };
}

/** Code → long-lived user token. Page tokens derived from it don't expire. */
export async function facebookUserToken(req: NextRequest, code: string): Promise<string> {
  const appId = env("META_APP_ID")!;
  const secret = env("META_APP_SECRET")!;
  const short = await graph<{ access_token: string }>("/oauth/access_token", {
    client_id: appId,
    client_secret: secret,
    redirect_uri: redirectUri(req, "facebook"),
    code,
  });
  const long = await graph<{ access_token: string }>("/oauth/access_token", {
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: secret,
    fb_exchange_token: short.access_token,
  });
  return long.access_token;
}

export async function facebookPages(userToken: string): Promise<FacebookPage[]> {
  const res = await graph<{ data: FacebookPage[] }>("/me/accounts", {
    fields: "id,name,access_token,instagram_business_account{id,username}",
    limit: "100",
    access_token: userToken,
  });
  return res.data ?? [];
}

/** Saves the Page, and the Instagram account linked to it (or clears a stale one). */
export async function saveFacebookPage(userId: string, page: FacebookPage): Promise<{ instagram: boolean }> {
  await saveConnection(userId, "facebook", { accountId: page.id, accountName: page.name, token: page.access_token });
  const ig = page.instagram_business_account;
  if (ig) {
    await saveConnection(userId, "instagram", {
      accountId: ig.id,
      accountName: ig.username ? `@${ig.username}` : `${page.name} (Instagram)`,
      // Instagram publishing uses the Page's token.
      token: page.access_token,
    });
  } else {
    await deleteConnection(userId, "instagram");
  }
  return { instagram: !!ig };
}

// Several Pages: keep the user token for a few minutes (encrypted, httpOnly) while they pick one.
const PENDING_COOKIE = "fb_pending_token";

export async function holdFacebookToken(token: string): Promise<void> {
  (await cookies()).set(PENDING_COOKIE, encryptSecret(token), cookieOpts);
}

export async function heldFacebookToken(): Promise<string | null> {
  const raw = (await cookies()).get(PENDING_COOKIE)?.value;
  if (!raw) return null;
  try {
    return decryptSecret(raw);
  } catch {
    return null;
  }
}

export async function dropFacebookToken(): Promise<void> {
  (await cookies()).delete(PENDING_COOKIE);
}

// ---------- LinkedIn ----------

export async function connectLinkedIn(req: NextRequest, userId: string, code: string): Promise<void> {
  const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(req, "linkedin"),
      client_id: env("LINKEDIN_CLIENT_ID")!,
      client_secret: env("LINKEDIN_CLIENT_SECRET")!,
    }),
    cache: "no-store",
  });
  const token = (await tokenRes.json()) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!tokenRes.ok || !token.access_token) throw new Error(token.error_description || "LinkedIn didn't return a token");

  const meRes = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { authorization: `Bearer ${token.access_token}` },
    cache: "no-store",
  });
  const me = (await meRes.json()) as { sub?: string; name?: string };
  if (!meRes.ok || !me.sub) throw new Error("Couldn't read your LinkedIn profile");

  await saveConnection(userId, "linkedin", {
    accountId: `urn:li:person:${me.sub}`,
    accountName: me.name || "LinkedIn profile",
    token: token.access_token,
    // About 60 days; LinkedIn only gives refresh tokens to approved partners.
    expiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null,
  });
}
