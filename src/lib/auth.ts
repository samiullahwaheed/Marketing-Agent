const encoder = new TextEncoder();

async function getKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export const SESSION_COOKIE = "session";

/** Token is `<exp>:<userId>.<hmac>`. */
export async function createSessionToken(userId: string): Promise<string> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  const exp = Date.now() + SESSION_MAX_AGE_MS;
  const payload = `${exp}:${userId}`;
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return `${payload}.${toHex(sig)}`;
}

/** The user id in a valid session token, or null. */
export async function readSessionUserId(token: string | undefined | null): Promise<string | null> {
  if (!token) return null;
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;

  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) return null;
  const payload = token.slice(0, dotIndex);
  const sig = token.slice(dotIndex + 1);
  if (!payload || !sig) return null;

  const [expPart, userId] = payload.split(":");
  const exp = Number(expPart);
  if (!userId || !Number.isFinite(exp) || Date.now() > exp) return null;

  const key = await getKey(secret);
  const expectedSig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toHex(expectedSig) === sig ? userId : null;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  return (await readSessionUserId(token)) !== null;
}
