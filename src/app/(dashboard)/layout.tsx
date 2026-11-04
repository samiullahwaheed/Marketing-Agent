import AppLayout from "@/components/AppLayout";
import { countPosts, getSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, pendingCount] = await Promise.all([
    getSettings(),
    countPosts({ status: "waiting_approval" }),
  ]);

  return (
    <AppLayout
      hasActivityAlert={pendingCount}
      aiCreditsPercent={settings.aiCreditsPercent}
      aiCreditsPostsLeft={settings.aiCreditsPostsLeft}
    >
      {children}
    </AppLayout>
  );
}
