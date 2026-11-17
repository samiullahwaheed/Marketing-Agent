"use client";

import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";
import { useState, useTransition } from "react";
import { disconnectAccountAction } from "@/lib/actions";
import { PLATFORMS } from "@/lib/platforms";
import type { Account, Platform } from "@/lib/types";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { PlatformBadge } from "@/components/PlatformBadge";

const row = "flex flex-wrap items-center gap-3.5 py-3.5 border-t border-divider";
const SOON_MS = 7 * 24 * 60 * 60 * 1000;

// Instagram is connected through its Facebook Page, so both use the Facebook login.
const CONNECT_URL: Record<Platform, string> = {
  facebook: "/api/connect/facebook",
  instagram: "/api/connect/facebook",
  linkedin: "/api/connect/linkedin",
};

/** Messages for the ?connected= / ?connect_error= values the connect routes redirect with. */
const CONNECTED: Record<string, string> = {
  facebook: "Facebook Page connected. No Instagram Business account is linked to it.",
  facebook_instagram: "Facebook Page and Instagram connected.",
  linkedin: "LinkedIn connected.",
};
const ERRORS: Record<string, string> = {
  facebook_denied: "You cancelled the Facebook login, so nothing was connected.",
  facebook_expired: "The Facebook connect took too long. Try again.",
  facebook_no_pages:
    "Your Facebook account doesn't manage any Pages. Create a Page, or ask its owner to make you an admin, then try again.",
  facebook_failed: "We couldn't connect Facebook. Try again in a moment.",
  facebook_not_configured: "Facebook connecting isn't set up on this server yet (META_APP_ID / META_APP_SECRET).",
  linkedin_denied: "You cancelled the LinkedIn login, so nothing was connected.",
  linkedin_expired: "The LinkedIn connect took too long. Try again.",
  linkedin_failed: "We couldn't connect LinkedIn. Try again in a moment.",
  linkedin_not_configured: "LinkedIn connecting isn't set up on this server yet (LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET).",
};

function statusLine(acc: Account): { text: string; tone: "muted" | "warning" | "error" } {
  if (acc.status === "reconnect") return { text: `${acc.accountName ?? acc.label} · login expired, connect again to keep posting`, tone: "error" };
  if (acc.status === "not_connected") {
    return {
      text: acc.platform === "instagram" ? "Comes with a Facebook Page that has Instagram linked" : "Not connected",
      tone: "muted",
    };
  }
  if (acc.expiresAt && new Date(acc.expiresAt).getTime() - Date.now() < SOON_MS) {
    const days = Math.max(0, Math.ceil((new Date(acc.expiresAt).getTime() - Date.now()) / 86_400_000));
    return { text: `${acc.accountName} · expires in ${days} day${days === 1 ? "" : "s"}`, tone: "warning" };
  }
  return { text: acc.accountName ?? "Connected", tone: "muted" };
}

const toneClass = { muted: "text-muted", warning: "text-warning font-semibold", error: "text-error" };

export function ConnectedAccounts({
  accounts,
  connected,
  connectError,
}: {
  accounts: Account[];
  connected?: string;
  connectError?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<Platform | null>(null);

  function disconnect(platform: Platform) {
    if (!window.confirm(`Disconnect ${PLATFORMS[platform].label}? Posts waiting to go there will need it connected again.`)) return;
    setBusy(platform);
    startTransition(async () => {
      await disconnectAccountAction(platform);
      setBusy(null);
    });
  }

  const success = connected ? CONNECTED[connected] : undefined;
  const error = connectError ? ERRORS[connectError] ?? "Something went wrong while connecting. Try again." : undefined;

  return (
    <Card className="px-6 pt-5 pb-2">
      <h2 className="heading text-xl">Connected accounts</h2>
      <p className="mt-1 mb-3 text-muted text-sm">Posts go to these accounts. Only you can see and use them.</p>

      {(success || error) && (
        <div
          role={error ? "alert" : "status"}
          className={`mb-3 flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-sm font-semibold ${
            error ? "bg-error-bg text-error" : "bg-success-bg text-success"
          }`}
        >
          {error ? (
            <AlertCircle size={18} className="mt-px flex-none" aria-hidden="true" />
          ) : (
            <CheckCircle2 size={18} className="mt-px flex-none" aria-hidden="true" />
          )}
          {error ?? success}
        </div>
      )}

      {accounts.map((acc) => {
        const line = statusLine(acc);
        const removing = pending && busy === acc.platform;
        return (
          <div key={acc.platform} className={`${row} ${acc.status === "reconnect" ? "bg-[#FDF6F5] -mx-6 px-6" : ""}`}>
            <PlatformBadge platform={acc.platform} size="lg" />
            <div className="flex-[1_1_180px] min-w-0">
              <strong>{acc.label}</strong>
              <div className={`text-[13.5px] truncate ${toneClass[line.tone]}`} title={line.text}>
                {line.text}
              </div>
            </div>

            {acc.status === "connected" && (
              <>
                <Chip tone="success">Connected</Chip>
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-h-[38px] text-muted"
                  onClick={() => disconnect(acc.platform)}
                  disabled={removing}
                >
                  {removing && <LoaderCircle size={14} className="animate-spin" aria-hidden="true" />}
                  Disconnect
                </Button>
              </>
            )}
            {acc.status === "reconnect" && (
              <Button variant="primary" size="sm" className="min-h-[38px]" href={CONNECT_URL[acc.platform]} newTab={false}>
                Reconnect
              </Button>
            )}
            {acc.status === "not_connected" && (
              <Button size="sm" className="min-h-[38px]" href={CONNECT_URL[acc.platform]} newTab={false}>
                {acc.platform === "instagram" ? "Connect via Facebook" : "Connect"}
              </Button>
            )}
          </div>
        );
      })}
    </Card>
  );
}
