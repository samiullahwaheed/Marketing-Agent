import { notFound } from "next/navigation";
import { getPostById } from "@/lib/db";
import { requireUserId } from "@/lib/users";
import RewriteView from "./RewriteView";

export const dynamic = "force-dynamic";

export default async function RewritePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPostById(await requireUserId(), id);
  if (!post) notFound();

  return <RewriteView post={post} />;
}
