import { getAccounts } from "@/lib/connections";
import { getSettings } from "@/lib/db";
import { requireUserId } from "@/lib/users";
import SettingsView from "./SettingsView";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; connect_error?: string }>;
}) {
  const userId = await requireUserId();
  const [accounts, settings, { connected, connect_error }] = await Promise.all([
    getAccounts(userId),
    getSettings(userId),
    searchParams,
  ]);

  return <SettingsView accounts={accounts} settings={settings} connected={connected} connectError={connect_error} />;
}
