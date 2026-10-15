import { getAccounts, getSettings } from "@/lib/db";
import SettingsView from "./SettingsView";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [accounts, settings] = await Promise.all([getAccounts(), getSettings()]);

  return <SettingsView accounts={accounts} settings={settings} />;
}
