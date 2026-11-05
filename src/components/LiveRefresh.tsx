"use client";

import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DASHBOARD_CHANNEL, POSTS_CHANGED_EVENT } from "@/lib/realtime";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Re-fetches the current page when n8n reports back (draft ready for approval, or a
 * publish result). The n8n callback route broadcasts a data-free "posts-changed" ping
 * over Supabase Realtime; router.refresh() then reloads the server data while keeping
 * client state such as unsaved edits. No polling.
 */
export function LiveRefresh() {
  const router = useRouter();

  useEffect(() => {
    if (!url || !publishableKey) return;
    const supabase = createClient(url, publishableKey, { auth: { persistSession: false } });
    const channel = supabase
      .channel(DASHBOARD_CHANNEL)
      .on("broadcast", { event: POSTS_CHANGED_EVENT }, () => router.refresh())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
