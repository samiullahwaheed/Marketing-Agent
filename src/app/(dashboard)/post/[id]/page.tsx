import { notFound, redirect } from "next/navigation";
import { getPostById } from "@/lib/db";
import PublishedView from "./PublishedView";

export const dynamic = "force-dynamic";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) notFound();

  if (post.status === "failed") redirect("/approvals");
  if (post.status !== "published") redirect(`/post/${id}/review`);

  return <PublishedView post={post} />;
}
