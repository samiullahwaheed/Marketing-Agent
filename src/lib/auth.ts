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

export async function createSessionToken(): Promise<string> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  const exp = Date.now() + SESSION_MAX_AGE_MS;
  const payload = `${exp}`;
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return `${payload}.${toHex(sig)}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;

  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) return false;
  const payload = token.slice(0, dotIndex);
  const sig = token.slice(dotIndex + 1);
  if (!payload || !sig) return false;

  const exp = Number(payload);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;

  const key = await getKey(secret);
  const expectedSig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toHex(expectedSig) === sig;
}
