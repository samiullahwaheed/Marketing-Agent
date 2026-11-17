import { getAccounts } from "@/lib/connections";
import { getCalendarPosts } from "@/lib/db";
import { requireUserId } from "@/lib/users";
import CalendarView from "./CalendarView";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const userId = await requireUserId();
  const [posts, accounts] = await Promise.all([getCalendarPosts(userId), getAccounts(userId)]);
  const reconnectPlatforms = accounts.filter((a) => a.status === "reconnect").map((a) => a.platform);

  return <CalendarView posts={posts} reconnectPlatforms={reconnectPlatforms} />;
}
