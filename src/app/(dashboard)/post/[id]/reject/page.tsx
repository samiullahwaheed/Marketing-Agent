import { notFound } from "next/navigation";
import { getSettings, getPostById } from "@/lib/db";
import { requireUserId } from "@/lib/users";
import RejectView from "./RejectView";

export const dynamic = "force-dynamic";

export default async function RejectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireUserId();
  const [post, settings] = await Promise.all([getPostById(userId, id), getSettings(userId)]);
  if (!post) notFound();

  return <RejectView post={post} bannedWords={settings.bannedWords ?? []} />;
}
