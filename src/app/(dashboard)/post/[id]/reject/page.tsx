import { notFound } from "next/navigation";
import { getSettings, getPostById } from "@/lib/db";
import RejectView from "./RejectView";

export const dynamic = "force-dynamic";

export default async function RejectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post, settings] = await Promise.all([getPostById(id), getSettings()]);
  if (!post) notFound();

  return <RejectView post={post} bannedWords={settings.bannedWords ?? []} />;
}
