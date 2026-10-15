import { getActivityData, getAccounts } from "@/lib/db";
import ApprovalsView from "./ApprovalsView";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const [{ posts }, accounts] = await Promise.all([getActivityData(), getAccounts()]);
  const reconnectAccounts = accounts.filter((a) => a.status === "reconnect");

  return <ApprovalsView posts={posts} reconnectPlatforms={reconnectAccounts.map((a) => a.platform)} />;
}
