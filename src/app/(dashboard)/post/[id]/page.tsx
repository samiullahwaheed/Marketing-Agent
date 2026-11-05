import { notFound, redirect } from "next/navigation";
import { getPostById } from "@/lib/db";
import { hasLivePlatform } from "@/lib/status";
import PublishedView from "./PublishedView";

export const dynamic = "force-dynamic";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) notFound();

  // A partly published post still has live links worth showing (e.g. Facebook ok, Instagram failed).
  if (post.status === "failed" && !hasLivePlatform(post)) redirect("/approvals");
  if (post.status === "failed") return <PublishedView post={post} />;
  if (post.status !== "published") redirect(`/post/${id}/review`);

  return <PublishedView post={post} />;
}
