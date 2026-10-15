import { getAccounts, getCalendarPosts } from "@/lib/db";
import CalendarView from "./CalendarView";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const [posts, accounts] = await Promise.all([getCalendarPosts(), getAccounts()]);
  const reconnectPlatforms = accounts.filter((a) => a.status === "reconnect").map((a) => a.platform);

  return <CalendarView posts={posts} reconnectPlatforms={reconnectPlatforms} />;
}
