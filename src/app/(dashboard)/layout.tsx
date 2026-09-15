import Sidebar from "@/components/Sidebar";
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
    <div className="flex min-h-screen bg-[#f7f6f3]">
      <Sidebar hasActivityAlert={pendingCount > 0} aiCreditsPercent={settings.aiCreditsPercent} />
      <main className="min-h-screen flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
