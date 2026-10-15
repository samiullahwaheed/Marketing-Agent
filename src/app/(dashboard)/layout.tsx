import AppLayout from "@/components/AppLayout";
import { getSettings, postsCollection } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, col] = await Promise.all([getSettings(), postsCollection()]);
  const pendingCount = await col.countDocuments({ status: "waiting_approval" });

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
