import { getAccounts } from "@/lib/connections";
import { getActivityData } from "@/lib/db";
import { requireUserId } from "@/lib/users";
import ApprovalsView from "./ApprovalsView";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const userId = await requireUserId();
  const [{ posts }, accounts] = await Promise.all([getActivityData(userId), getAccounts(userId)]);
  const reconnectAccounts = accounts.filter((a) => a.status === "reconnect");

  return <ApprovalsView posts={posts} reconnectPlatforms={reconnectAccounts.map((a) => a.platform)} />;
}
