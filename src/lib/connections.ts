import "server-only";
import { decryptSecret, encryptSecret } from "./crypto";
import { PLATFORM_ORDER, PLATFORMS } from "./platforms";
import { getSupabase, unwrap } from "./supabase";
import type { Account, Platform } from "./types";

interface ConnectionRow {
  id: string;
  user_id: string;
  platform: Platform;
  account_id: string;
  account_name: string;
  access_token: string;
  expires_at: string | null;
  status: "connected" | "reconnect";
  updated_at: string;
}

/** What n8n needs to publish for one platform. Built server-side, sent only to n8n. */
export interface PublishAccount {
  accountId: string;
  accountName: string;
  token: string;
}

const isExpired = (row: Pick<ConnectionRow, "expires_at">) =>
  !!row.expires_at && new Date(row.expires_at).getTime() <= Date.now();

/** Every platform for this user, connected or not, in display order. Tokens are not included. */
export async function getAccounts(userId: string): Promise<Account[]> {
  const rows = unwrap(
    await getSupabase()
      .from("social_connections")
      .select("platform, account_name, expires_at, status, updated_at")
      .eq("user_id", userId),
    "Could not load connected accounts"
  ) as Omit<ConnectionRow, "id" | "user_id" | "account_id" | "access_token">[];

  return PLATFORM_ORDER.map((platform) => {
    const row = rows.find((r) => r.platform === platform);
    if (!row) return { id: platform, platform, label: PLATFORMS[platform].label, status: "not_connected" };
    return {
      id: platform,
      platform,
      label: PLATFORMS[platform].label,
      status: row.status === "reconnect" || isExpired(row) ? "reconnect" : "connected",
      accountName: row.account_name,
      expiresAt: row.expires_at ?? undefined,
      updatedAt: row.updated_at,
    };
  });
}

export async function saveConnection(
  userId: string,
  platform: Platform,
  input: { accountId: string; accountName: string; token: string; expiresAt?: Date | null }
): Promise<void> {
  unwrap(
    await getSupabase()
      .from("social_connections")
      .upsert(
        {
          user_id: userId,
          platform,
          account_id: input.accountId,
          account_name: input.accountName,
          access_token: encryptSecret(input.token),
          expires_at: input.expiresAt ? input.expiresAt.toISOString() : null,
          status: "connected",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,platform" }
      ),
    "Could not save the connection"
  );
}

export async function deleteConnection(userId: string, platform: Platform): Promise<void> {
  unwrap(
    await getSupabase().from("social_connections").delete().eq("user_id", userId).eq("platform", platform),
    "Could not disconnect"
  );
}

/** Called when a platform rejects the token: the user must connect again. */
export async function markReconnectNeeded(userId: string, platform: Platform): Promise<void> {
  unwrap(
    await getSupabase()
      .from("social_connections")
      .update({ status: "reconnect", updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("platform", platform),
    "Could not update the connection"
  );
}

/**
 * Decrypted credentials for the platforms a post goes to. Platforms that are missing,
 * expired or flagged come back in `missing` so the caller can stop before calling n8n.
 */
export async function getPublishAccounts(
  userId: string,
  platforms: Platform[]
): Promise<{ accounts: Partial<Record<Platform, PublishAccount>>; missing: Platform[] }> {
  const rows = unwrap(
    await getSupabase().from("social_connections").select("*").eq("user_id", userId).in("platform", platforms),
    "Could not load connected accounts"
  ) as ConnectionRow[];

  const accounts: Partial<Record<Platform, PublishAccount>> = {};
  const missing: Platform[] = [];
  for (const platform of platforms) {
    const row = rows.find((r) => r.platform === platform);
    if (!row || row.status === "reconnect" || isExpired(row)) {
      missing.push(platform);
      continue;
    }
    accounts[platform] = { accountId: row.account_id, accountName: row.account_name, token: decryptSecret(row.access_token) };
  }
  return { accounts, missing };
}
