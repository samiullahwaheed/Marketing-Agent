import AppLayout from "@/components/AppLayout";
import { countPosts, getSettings } from "@/lib/db";
import { getCurrentUser, requireUserId } from "@/lib/users";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await requireUserId();
  const [settings, pendingCount, user] = await Promise.all([
    getSettings(userId),
    countPosts(userId, { status: "waiting_approval" }),
    getCurrentUser(),
  ]);

  return (
    <AppLayout
      user={user ? { name: user.name, email: user.email } : null}
      hasActivityAlert={pendingCount}
      aiCreditsPercent={settings.aiCreditsPercent}
      aiCreditsPostsLeft={settings.aiCreditsPostsLeft}
    >
      {children}
    </AppLayout>
  );
}
